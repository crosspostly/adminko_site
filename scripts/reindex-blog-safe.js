const fs = require('fs');
const path = require('path');

/**
 * ЧЕСТНЫЙ РЕИНДЕКСАТОР БЛОГА v6.0
 * Автоматически находит все HTML статьи и добавляет их в index.json
 */

const BLOG_DIR = path.join(__dirname, '../site/public/blog');
const INDEX_FILE = path.join(BLOG_DIR, 'index.json');

function reindex() {
    console.log("📡 Запуск реиндексации блога...");
    
    if (!fs.existsSync(BLOG_DIR)) {
        console.error("❌ Папка блога не найдена!");
        return;
    }

    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');
    let newIndex = [];

    files.forEach(file => {
        try {
            const filePath = path.join(BLOG_DIR, file);
            const html = fs.readFileSync(filePath, 'utf-8');
            const stats = fs.statSync(filePath);

            // Парсим мета-данные
            const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
            let title = titleMatch ? titleMatch[1].split(' | ')[0].trim() : file.replace('.html', '');

            const descMatch = html.match(/<meta name="description" content="([^"]+)">/);
            let desc = descMatch ? descMatch[1].trim() : "";

            // Ищем дату в мета-теге или берем дату создания файла
            const dateMatch = html.match(/<meta name="published_at" content="([^"]+)">/);
            let publishDate = dateMatch ? dateMatch[1] : stats.birthtime.toISOString();

            newIndex.push({
                title: title,
                description: desc,
                slug: file.replace('.html', ''),
                publish_date: publishDate
            });
        } catch (e) {
            console.error(`  ⚠️ Ошибка при парсинге файла ${file}:`, e.message);
        }
    });

    // Сортировка: сначала новые
    newIndex.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

    fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
    console.log(`✅ Индекс обновлен! Всего статей: ${newIndex.length}`);
}

reindex();
