const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

async function analyzeKeywordsForTrends() {
    if (!API_KEY) {
        console.error("❌ GEMINI_API_KEY не задан в .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.2 }
    });

    const rawKeywordsPath = path.join(__dirname, 'real_keywords.json');
    if (!fs.existsSync(rawKeywordsPath)) {
        console.error("❌ Не удалось прочитать real_keywords.json. Сначала запустите fetch-keywords.js");
        return;
    }

    const rawKeywords = JSON.parse(fs.readFileSync(rawKeywordsPath, 'utf-8'));
    
    // ЧИТАЕМ ИСТОРИЮ ПУБЛИКАЦИЙ
    const indexPath = path.join(__dirname, '../site/public/blog/index.json');
    let publishedHistory = [];
    if (fs.existsSync(indexPath)) {
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        publishedHistory = index.map(item => `${item.title} (${item.topic_raw})`);
    }

    console.log(`\n🔍 Анализируем ${rawKeywords.length} ключевых слов через Gemini 3.1...`);
    console.log(`📚 Учитываем ${publishedHistory.length} уже написанных статей.`);

    const prompt = `
ТЫ — ГЛАВНЫЙ СТРАТЕГ СЦ «АДМИН.КО».
ТВОЯ ЗАДАЧА: Создать 40 планов (по 5 на каждую из 8 категорий).

КАТЕГОРИИ:
1. phone: Смартфоны (B2C)
2. laptop: Ноутбуки (B2C/Pro)
3. b2b_it: ИТ-аутсорсинг, серверы (МАРКЕТИНГОВЫЙ СТИЛЬ: налоги, договор, отсутствие простоев)
4. cctv: Видеонаблюдение/СКУД (B2B и частники)
5. consoles: Игровые приставки
6. appliances: Пылесосы/Кофемашины
7. tv: Телевизоры
8. data_recovery: Восстановление данных (АКЦЕНТ: спасение памяти, конфиденциальность)

УЖЕ НАПИСАНО: ${JSON.stringify(publishedHistory)}

ИНСТРУКЦИЯ:
- Для b2b_it используй заголовки типа: "Как сократить расходы на ИТ-отдел в Кемерово" или "Обслуживание серверов: работаем по договору с НДС".
- Для остальных - жесткие технические кейсы спасения.
- Формат JSON: [{ "topic": "...", "keywords": [...], "category": "..." }]
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
             text = text.substring(firstBracket, lastBracket + 1);
        }
        
        // Проверка на валидность JSON
        const prioritizedTopics = JSON.parse(text);
        fs.writeFileSync(path.join(__dirname, 'prioritized_topics.json'), JSON.stringify(prioritizedTopics, null, 2));
        
        console.log(`✅ Анализ завершен! Создано ${prioritizedTopics.length} приоритетных тем.`);
    } catch (e) {
        console.error("❌ Ошибка при анализе Gemini:", e.message);
    }
}

analyzeKeywordsForTrends();
