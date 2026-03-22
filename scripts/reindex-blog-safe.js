const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../site/public/blog');
const INDEX_FILE = path.join(BLOG_DIR, 'index.json');

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

let newIndex = [];

files.forEach(file => {
    const filePath = path.join(BLOG_DIR, file);
    const html = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath); // БЕРЕМ ДАТУ ИЗ ФАЙЛА

    // Вытаскиваем заголовок
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    let title = titleMatch ? titleMatch[1].replace(' | Админ.Ко', '').trim() : "Без названия";
    
    // Вытаскиваем описание
    const descMatch = html.match(/<meta name="description" content="([^"]+)">/);
    let desc = descMatch ? descMatch[1].trim() : "";

    // Используем дату изменения файла для сортировки (чтобы новые были сверху)
    const isoDate = stats.mtime.toISOString();

    newIndex.push({
        title: title,
        description: desc,
        slug: file.replace('.html', ''),
        publish_date: isoDate,
        topic_raw: title
    });
});

// Сортируем: НОВЫЕ СВЕРХУ (самые свежие mtime)
newIndex.sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));

fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
console.log(`✅ Оглавление обновлено! Теперь все ${newIndex.length} статей отсортированы по времени создания.`);
