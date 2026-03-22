const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * ТОТАЛЬНЫЙ ОРКЕСТРАТОР v5.0 (Мастер-план 1000)
 * Темп: 16 статей за запуск (по 2 на каждую из 8 ниш).
 */

const PRIORITIZED_TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');
const CATEGORIES = ['phone', 'laptop', 'b2b_it', 'cctv', 'consoles', 'appliances', 'tv', 'data_recovery'];
const ARTICLES_PER_CATEGORY = 2; // Итого 16 статей в день

async function orchestrate() {
    console.log(`🚀 ЗАПУСК КОНВЕЙЕРА: План 1000 (Цель: 16 статей)...`);

    // 1. Проверка наличия тем
    if (!fs.existsSync(PRIORITIZED_TOPICS_FILE) || JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8')).length < 20) {
        console.log("⚠️ Тем мало. Пополняем базу через AI-анализатор...");
        execSync('node scripts/ai-keyword-analyzer.js', { stdio: 'inherit' });
    }

    let topics = JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8'));

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

            try {
                // Генерируем статью
                execSync('node scripts/auto-blogger.js', { stdio: 'inherit' });
                // Убираем выполненную задачу из основного списка
                topics = topics.filter(t => t.topic !== task.topic);
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
