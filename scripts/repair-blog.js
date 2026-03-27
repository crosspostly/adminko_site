const fs = require('fs');
const path = require('path');
const { generateDeepArticle } = require('./auto-blogger.js');

const BLOG_DIR = path.join(__dirname, '../site/public/blog');
const FULL_INDEX_PATH = path.join(__dirname, '../full_index.json');

async function repair(limit = null) {
    console.log("🛠️  Запуск ТОТАЛЬНОГО восстановления блога (177 статей)...");
    
    if (!fs.existsSync(FULL_INDEX_PATH)) {
        console.error("Критическая ошибка: full_index.json не найден!");
        return;
    }
    
    const fullIndex = JSON.parse(fs.readFileSync(FULL_INDEX_PATH, 'utf8'));
    let count = 0;

    for (const article of fullIndex) {
        if (limit && count >= limit) break;

        const filePath = path.join(BLOG_DIR, `${article.slug}.html`);
        let needsWork = false;

        if (!fs.existsSync(filePath)) {
            needsWork = true;
            console.log(`\n❌ Отсутствует: [${article.slug}] -> ${article.title}`);
        } else {
            const stats = fs.statSync(filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            // Если файл слишком маленький, отсутствует маркер контента или нет футера
            if (stats.size < 5000 || !content.includes('<!-- CONTENT START -->') || !content.includes('<footer')) {
                needsWork = true;
                console.log(`\n⚠️  Битый/Мусорный файл (размер, маркер или футер): [${article.slug}]`);
            }
        }

        if (needsWork) {
            console.log(`✨ Генерируем качественную версию для: ${article.slug}...`);
            try {
                // ПЕРЕДАЕМ ТОПИК И СЛАГ
                await generateDeepArticle({ 
                    topic: article.title, 
                    customSlug: article.slug 
                });
                count++;
                // Пауза для API
                await new Promise(r => setTimeout(r, 3000));
            } catch (err) {
                console.error(`❌ Ошибка генерации ${article.slug}: ${err.message}`);
            }
        } else {
            // Файл в порядке
        }
    }

    console.log(`\n📡 Обновляем финальный индекс...`);
    reindex();
}

function reindex() {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
    const fullIndex = JSON.parse(fs.readFileSync(FULL_INDEX_PATH, 'utf8'));
    
    const newIndex = [];
    files.forEach(f => {
        const slug = f.replace('.html', '');
        const filePath = path.join(BLOG_DIR, f);
        const html = fs.readFileSync(filePath, 'utf8');
        
        // Пытаемся найти в оригинальном индексе для сохранения мета-данных
        const original = fullIndex.find(a => a.slug === slug);
        
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        const descMatch = html.match(/<meta name="description" content="(.*?)"/);
        
        newIndex.push({
            title: titleMatch ? titleMatch[1].split(' | ')[0] : (original ? original.title : slug),
            description: descMatch ? descMatch[1] : (original ? original.description : ""),
            slug: slug,
            publish_date: original ? original.publish_date : new Date().toISOString()
        });
    });

    fs.writeFileSync(path.join(BLOG_DIR, 'index.json'), JSON.stringify(newIndex, null, 2));
    console.log(`✅ Итого в индексе: ${newIndex.length} статей.`);
}

const limitArg = process.argv[2] ? parseInt(process.argv[2], 10) : null;
repair(limitArg);
