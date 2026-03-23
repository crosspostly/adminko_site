const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const BLOG_INDEX_FILE = path.join(BLOG_DIR, 'index.json');
const SYSTEM_PROMPT_PATH = path.join(__dirname, '../docs/AGENT_PROMPT.md');

const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');

const Layout = {
    yellowBlock: (content) => `
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 my-8 rounded-r-2xl shadow-sm">
            ${content}
        </div>`,
    
    blueBlock: (content) => `
        <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border-l-4 border-blue-500 my-10">
            ${content}
        </div>`,

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

async function generateDeepArticle(topicData) {
    const { topic } = topicData;
    console.log(`🛠️  Генерация: "${topic}"`);

    try {
        const metaPrompt = `SEO JSON для темы "${topic}" (город Кемерово). Верни {"title": "...", "description": "...", "slug": "..."}`;
        const metaRes = await model.generateContent(metaPrompt);
        const meta = JSON.parse(metaRes.response.text().match(/\{[\s\S]*\}/)[0]);

        const planPrompt = `ТЫ — ВЕДУЩИЙ ИНЖЕНЕР. План статьи: "${topic}". Верни ТОЛЬКО JSON массив из 4 глав.`;
        const planRes = await model.generateContent(planPrompt);
        const sections = JSON.parse(planRes.response.text().replace(/```json|```/g, '').trim());

        let chapters = [];
        for (const section of sections) {
            const chapterPrompt = `${systemPrompt}\n\nНАПИШИ ГЛАВУ: "${section}" (Тема: ${topic})\nТРЕБОВАНИЯ: Выдавай ТОЛЬКО HTML (h2, p, ul). Кратко, инженерно.`;
            const chapterRes = await model.generateContent(chapterPrompt);
            chapters.push(chapterRes.response.text().replace(/```html|```/g, '').trim());
        }

        const blitzPrompt = `Blitz-Answer для статьи "${topic}" (Цена, Срок, Диагностика в Кемерово). Только HTML (p с strong).`;
        const blitzRes = await model.generateContent(blitzPrompt);
        const blitzHtml = blitzRes.response.text().replace(/```html|```/g, '').trim();

        const nuancePrompt = `Технический секрет мастера для темы "${topic}". Только HTML (h3, p).`;
        const nuanceRes = await model.generateContent(nuancePrompt);
        const nuanceHtml = nuanceRes.response.text().replace(/```html|```/g, '').trim();

        let finalBody = `
            <section>${chapters[0]}</section>
            ${Layout.yellowBlock(blitzHtml)}
            <section>${chapters[1]}</section>
            ${Layout.blueBlock(nuanceHtml)}
            ${Layout.ctaBlock}
            <section>${chapters[2] || ''}</section>
            <section class="mt-8">${chapters[3] || ''}</section>
        `;

        const finalHtml = `<!DOCTYPE html>
<html lang="ru" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.title} | Админ.Ко</title>
    <meta name="description" content="${meta.description}">
    <link rel="canonical" href="https://admin-ko.ru/blog/${meta.slug}.html">
    <link rel="icon" href="../favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../styles.css?v=3.4">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <script>tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#E50914' } } } }</script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300">
<div id="header-placeholder"></div>
<main class="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
    <article class="prose dark:prose-invert prose-primary lg:prose-xl max-w-none bg-white dark:bg-gray-800 p-8 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3 text-xs font-bold text-primary uppercase tracking-widest mb-8">
            <span class="px-3 py-1 bg-primary/10 rounded-full italic">Инженерный разбор</span>
            <span class="text-gray-400">Кемерово</span>
        </div>
        <h1 class="text-3xl md:text-6xl font-black mb-12 text-gray-900 dark:text-white leading-tight tracking-tighter">${meta.title}</h1>
        ${finalBody}
    </article>
</main>
<div id="footer-placeholder"></div>
<script src="../components.js?v=3.6"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(BLOG_DIR, `${meta.slug}.html`), finalHtml);
        console.log(`✅ Сохранено: ${meta.slug}.html`);

        // Обновляем индекс
        let blogIndex = JSON.parse(fs.readFileSync(BLOG_INDEX_FILE, 'utf-8'));
        const existingIdx = blogIndex.findIndex(i => i.slug === meta.slug);
        const entry = { title: meta.title, description: meta.description, slug: meta.slug, publish_date: new Date().toISOString(), topic_raw: topic };
        if (existingIdx !== -1) blogIndex[existingIdx] = entry; else blogIndex.unshift(entry);
        fs.writeFileSync(BLOG_INDEX_FILE, JSON.stringify(blogIndex, null, 2));

    } catch (e) { console.error(`❌ Ошибка генерации:`, e.message); }
}

module.exports = { generateDeepArticle };
