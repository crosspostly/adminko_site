const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * ТОТАЛЬНЫЙ ОРКЕСТРАТОР v6.0 (Мастер-план 1000 + Yandex Wordstat)
 * Темп: 16 статей за запуск (по 2 на каждую из 8 ниш).
 * Источник тем: Yandex Wordstat API (реальная статистика запросов)
 */

const WORDSTAT_TOPICS_FILE = path.join(__dirname, '../data/wordstat_topics.json');
const PRIORITIZED_TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');
const CATEGORIES = ['phone', 'laptop', 'b2b_it', 'cctv', 'consoles', 'appliances', 'tv', 'data_recovery'];
const ARTICLES_PER_CATEGORY = 1; // 1 статья на категорию в день, итого 8 статей за запуск

const backupManager = require('./backup-manager');

async function orchestrate() {
    console.log(`🚀 ЗАПУСК КОНВЕЙЕРА: План 1000 (Цель: 16 статей)...`);

    // 0. Автоматический бэкап ПЕРЕД любыми изменениями
    backupManager();

    // 1. ПРОВЕРКА: Сначала пытаемся загрузить темы из Yandex Wordstat
    let topics = [];
    
    if (fs.existsSync(WORDSTAT_TOPICS_FILE)) {
        const wordstatData = JSON.parse(fs.readFileSync(WORDSTAT_TOPICS_FILE, 'utf-8'));
        console.log(`✅ Загружено ${wordstatData.length} тем из Yandex Wordstat`);
        topics = wordstatData;
    }
    
    // 2. Если тем из Wordstat мало (< 20), используем AI-анализатор как резерв
    if (topics.length < 20) {
        console.log("⚠️ Тем из Wordstat мало. Пополняем базу через AI-анализатор...");
        execSync('node scripts/ai-keyword-analyzer.js', { stdio: 'inherit' });
        
        if (fs.existsSync(PRIORITIZED_TOPICS_FILE)) {
            const aiTopics = JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8'));
            console.log(`✅ Загружено ${aiTopics.length} тем из AI-анализатора`);
            // Объединяем: сначала Wordstat, потом AI
            topics = [...topics, ...aiTopics.filter(t => !topics.some(wt => wt.topic === t.topic))];
        }
    }
    
    if (topics.length === 0) {
        console.error("❌ Нет тем для генерации! Сначала запустите: node scripts/yandex-wordstat.js topics");
        process.exit(1);
    }
    
    console.log(`📂 Всего доступно тем: ${topics.length}`);

    // 2. Идем по всем категориям и берем задачи
    for (const category of CATEGORIES) {
        console.log(`\n📂 Работаем с нишей: [${category.toUpperCase()}]`);
        
        const catTasks = topics.filter(t => t.category === category).slice(0, ARTICLES_PER_CATEGORY);
        
        if (catTasks.length === 0) {
            console.log(`  ⚠️ Нет тем для ${category}. Пропускаем.`);
            continue;
        }

        for (const task of catTasks) {
            console.log(`  📝 Статья: "${task.topic}"`);

            // Подсовываем конкретную задачу в начало для auto-blogger
            const otherTopics = topics.filter(t => t.topic !== task.topic);
            fs.writeFileSync(PRIORITIZED_TOPICS_FILE, JSON.stringify([task, ...otherTopics], null, 2));

            let generatedFile = null;

            try {
                // Генерируем статью
                execSync('node scripts/auto-blogger.js', { stdio: 'inherit' });
                // Убираем выполненную задачу из основного списка
                topics = topics.filter(t => t.topic !== task.topic);

                // Находим сгенерированный файл (последний в blog/)
                const blogDir = path.join(__dirname, '../site/public/blog');
                if (fs.existsSync(blogDir)) {
                    const files = fs.readdirSync(blogDir)
                        .filter(f => f.endsWith('.html'))
                        .map(f => ({ name: f, mtime: fs.statSync(path.join(blogDir, f)).mtime }))
                        .sort((a, b) => b.mtime - a.mtime);
                    if (files.length > 0) {
                        generatedFile = path.join(blogDir, files[0].name);
                    }
                }

                // SEO аудит сгенерированной статьи
                if (generatedFile && fs.existsSync(generatedFile)) {
                    const minScore = process.env.SEO_MIN_SCORE || 80;
                    console.log(`\n  🔍 SEO Audit: проверяем качество...`);
                    try {
                        const auditResult = execSync(
                            `node scripts/seo-audit-check.js --file "${generatedFile}" --min-score ${minScore}`,
                            { encoding: 'utf-8', timeout: 120000 }
                        );
                        console.log(`  ${auditResult.trim()}`);
                    } catch (auditErr) {
                        // Audit скрипт вернул exit code 1 (score < min)
                        const output = auditErr.stdout || auditErr.stderr || auditErr.message;
                        console.log(`  ⚠️ SEO Audit результат:\n  ${output.trim()}`);
                        // Не блокируем пайплайн, просто логируем
                    }
                }
            } catch (e) {
                console.error(`  ❌ Ошибка при генерации "${task.topic}":`, e.message);
            }
        }
    }

    // Сохраняем остатки тем
    fs.writeFileSync(PRIORITIZED_TOPICS_FILE, JSON.stringify(topics, null, 2));

    // 3. Финальная реиндексация ВСЕГО блога
    console.log("\n📡 Обновляем индекс сайта...");
    execSync('node scripts/reindex-blog-safe.js', { stdio: 'inherit' });

    // 4. СИНХРОНИЗАЦИЯ UI (Важно: прокидываем новые данные во все HTML)
    console.log("\n🔄 Синхронизируем UI на всех страницах...");
    try {
        execSync('node scripts/sync-ui.js', { stdio: 'inherit' });
        console.log("✅ UI синхронизирован.");
    } catch (e) {
        console.error("❌ Ошибка при синхронизации UI:", e.message);
    }

    console.log(`\n✅ ЦИКЛ ЗАВЕРШЕН. Контент-план на сегодня выполнен.`);
}

orchestrate();
