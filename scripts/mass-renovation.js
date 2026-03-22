const fs = require('fs');
const path = require('path');
const { generateDeepArticle } = require('./auto-blogger-module'); // Сейчас создам этот модуль

async function renovate() {
    const INDEX_FILE = path.join(__dirname, '../site/public/blog/index.json');
    const blogIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    
    console.log(`🚀 Начинаю тотальную реновацию блога (${blogIndex.length} статей)...`);
    
    for (const article of blogIndex) {
        // Пропускаем наш эталон, он и так хорош
        if (article.slug === 'urgent-phone-repair-kemerovo-adminko') continue;
        
        console.log(`\n♻️  Реновация: ${article.slug}`);
        await generateDeepArticle({ topic: article.topic_raw });
        
        // Ждем немного, чтобы не забанил API
        await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log("\n✅ РЕНОВАЦИЯ ЗАВЕРШЕНА. Весь блог переведен на золотой стандарт.");
}

renovate();
