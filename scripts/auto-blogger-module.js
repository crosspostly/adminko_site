const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // В 2026 используется @google/genai или совместимый SDK
const wpPublisher = require('./wp-publisher');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * КОНФИГУРАЦИЯ GEMINI 2.5 (Официально, Март 2026)
 * gemini-2.5-pro: для глубокого текста и поиска
 * gemini-2.5-flash-image: для генерации медиа (Nano Banana)
 */
const modelPro = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    tools: [{ google_search: {} }] // Нативное заземление
});

const modelMedia = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-image" // Официальная мультимодальная модель
});

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../docs/AGENT_PROMPT.md');
const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');

/**
 * ФАБРИКА ДИЗАЙНА (Сохраняем ваш стиль)
 */
const Layout = {
    yellowBlock: (content) => `<div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 my-8 rounded-r-2xl shadow-sm">${content}</div>`,
    blueBlock: (content) => `<div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border-l-4 border-blue-500 my-10">${content}</div>`,
    ctaBlock: `
        <div class="mt-16 mb-12 p-8 md:p-12 bg-gray-50 dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center">
            <h3 class="text-2xl md:text-3xl font-black mb-4 text-gray-900 dark:text-white uppercase tracking-tighter">Спросите инженера напрямую</h3>
            <p class="mb-8 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">Диагностика в «Админ.Ко» (Кемерово, Дзержинского 2Б) всегда 0₽. Опишите проблему, и мы назовем цену ремонта за 5 минут.</p>
            <div class="flex justify-center">
                <button onclick="openMessengerModal()" class="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 uppercase tracking-widest">
                    <span class="material-symbols-outlined">chat</span>
                    Бесплатная консультация
                </button>
            </div>
        </div>`
};

/**
 * ГЕНЕРАЦИЯ СТАТЬИ v5.6 (GEMINI 2.5 + WP)
 */
async function generateDeepArticle(topicData) {
    const { topic } = topicData;
    console.log(`\n🛠️  [ENGINE 2026] Обработка темы: "${topic}"`);

    try {
        // [1] SEO И РЕСЕРЧ (С использованием Google Search Grounding)
        const metaPrompt = `Собери технические факты и создай SEO JSON для темы: "${topic}" (Кемерово, март 2026). 
        Верни ТОЛЬКО JSON: {"title": "...", "description": "...", "slug": "...", "key_facts": "..."}`;
        const metaRes = await modelPro.generateContent(metaPrompt);
        const meta = JSON.parse(metaRes.response.text().match(/\{[\s\S]*\}/)[0]);

        // [2] ГЕНЕРАЦИЯ ПЛАНА (12 ГЛАВ)
        const planPrompt = `Составь план статьи из 12 глав для темы "${topic}". Используй факты: ${meta.key_facts}. Верни JSON массив.`;
        const planRes = await modelPro.generateContent(planPrompt);
        const sections = JSON.parse(planRes.response.text().match(/\[[\s\S]*\]/)[0]);

        // [3] ПОЭТАПНАЯ ГЕНЕРАЦИЯ ТЕКСТА (Для 3000 слов)
        let chapters = [];
        for (const section of sections) {
            console.log(`   ✍️ Глава: ${section}...`);
            const chapterPrompt = `${systemPrompt}\n\nНАПИШИ ГЛАВУ: "${section}" (Тема: ${topic}). 
            Используй HTML (h2, p, ul). НИКАКОГО MARKDOWN!`;
            const chapterRes = await modelPro.generateContent(chapterPrompt);
            chapters.push(chapterRes.response.text().replace(/```html|```/g, '').trim());
        }

        // [4] ГЕНЕРАЦИЯ ОБЛОЖКИ (Gemini 2.5 Flash Image)
        console.log(`🎨 Генерация медиа (Nano Banana Pro)...`);
        const imagePrompt = `Professional technical repair photo of ${topic}, lab environment, cinematic lighting, 4k, realistic details.`;
        const imageRes = await modelMedia.generateContent({
            contents: [{ parts: [{ text: imagePrompt }] }],
            generationConfig: { responseModalities: ["IMAGE"] }
        });
        
        // В 2026 SDK изображение возвращается в виде inlineData или аттачмента
        const imagePart = imageRes.response.candidates[0].content.parts.find(p => p.inlineData);
        let featuredMediaId = null;
        if (imagePart && process.env.WP_URL) {
            featuredMediaId = await wpPublisher.uploadMedia(Buffer.from(imagePart.inlineData.data, 'base64'), `${meta.slug}.jpg`);
        }

        // [5] СБОРКА И ПУБЛИКАЦИЯ В WP
        const fullContent = chapters.join('\n') + Layout.ctaBlock;
        
        if (process.env.WP_URL) {
            await wpPublisher.publishPost({
                title: meta.title,
                content: fullContent,
                slug: meta.slug,
                excerpt: meta.description,
                featured_media: featuredMediaId
            });
        } else {
            console.log(`⚠️ WP_URL не найден. Сохраняю локальный файл.`);
            fs.writeFileSync(path.join(__dirname, `../site/public/blog/${meta.slug}.html`), fullContent);
        }

        console.log(`✅ Успешно завершено: ${meta.slug}`);

    } catch (e) {
        console.error(`❌ Ошибка в пайплайне 2026:`, e.message);
    }
}

module.exports = { generateDeepArticle };
