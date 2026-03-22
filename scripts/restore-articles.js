const fs = require('fs');
const path = require('path');
const { generateDeepArticle } = require('./auto-blogger.js');

const BLOG_DIR = path.join(__dirname, '../site/public/blog');
const INDEX_FILE = path.join(BLOG_DIR, 'index.json');

async function restoreArticles() {
    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

    let brokenSlugs = [];

    // Находим статьи, в которых есть "Контент в процессе восстановления"
    for (const file of files) {
        const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
        if (content.includes('Контент в процессе восстановления')) {
            brokenSlugs.push(file.replace('.html', ''));
        }
    }

    console.log(`Найдено ${brokenSlugs.length} статей для восстановления.`);

    for (let i = 0; i < brokenSlugs.length; i++) {
        const slug = brokenSlugs[i];
        const item = index.find(a => a.slug === slug);
        if (item) {
            console.log(`[${i + 1}/${brokenSlugs.length}] Восстанавливаем: ${item.title}`);
            const topicData = {
                topic: item.topic_raw || item.title,
                category: 'recovery'
            };
            
            try {
                await generateDeepArticle(topicData);
                console.log(`✅ Восстановлена: ${slug}`);
            } catch (e) {
                console.error(`❌ Ошибка восстановления ${slug}:`, e.message);
            }
        }
    }
    
    console.log("🎉 Восстановление завершено!");
}

restoreArticles();
