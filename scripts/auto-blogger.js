const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');
const SYSTEM_PROMPT_PATH = path.join(__dirname, '../docs/AGENT_PROMPT.md');

const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');

/**
 * ФАБРИКА ДИЗАЙНА (Версия 4.1)
 */
const Layout = {
    yellowBlock: (content) => `
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-8 border-yellow-500 p-8 my-12 rounded-r-[2rem] shadow-sm">
            ${content}
        </div>`,
    
    blueBlock: (content) => `
        <div class="bg-blue-50 dark:bg-blue-900/20 p-10 rounded-[3rem] border-l-8 border-blue-500 my-16 shadow-inner">
            ${content}
        </div>`,

    ctaBlock: `
        <div class="mt-20 mb-16 p-8 md:p-16 bg-primary rounded-[4rem] shadow-2xl shadow-primary/30 text-center relative overflow-hidden group">
            <div class="relative z-10">
                <h2 class="text-4xl md:text-5xl font-black mb-6 text-white uppercase italic tracking-tighter">Спросите инженера</h2>
                <p class="mb-10 text-white/95 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">Диагностика в «Админ.Ко» всегда 0₽. Опишите проблему, и мы назовем цену ремонта за 5 минут.</p>
                <div class="flex justify-center">
                    <button onclick="openMessengerModal()" class="bg-white text-primary px-12 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-2xl active:scale-95 flex items-center gap-4 uppercase tracking-widest">
                        <span class="material-symbols-outlined text-3xl">chat</span>
                        Бесплатная консультация
                    </button>
                </div>
            </div>
            <span class="material-symbols-outlined absolute -right-12 -bottom-12 text-[20rem] text-white/10 rotate-12 pointer-events-none">build_circle</span>
        </div>`
};

/**
 * ТОТАЛЬНАЯ ОЧИСТКА ОТ MARKDOWN И ВЕРСТКА АБЗАЦЕВ
 */
function cleanMarkdown(text) {
    let clean = text
        .replace(/```html/g, '')
        .replace(/```/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

    // 1. Жирный текст
    clean = clean.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Заголовки (H2 и H3)
    clean = clean.replace(/^### (.*$)/gm, '<h3 class="text-2xl font-black mt-12 mb-6 text-gray-900 dark:text-white uppercase tracking-tighter">$1</h3>');
    clean = clean.replace(/^## (.*$)/gm, '<h2 class="text-3xl font-black mt-16 mb-8 text-gray-900 dark:text-white uppercase tracking-tighter italic border-l-8 border-primary pl-6">$1</h2>');

    // 3. Списки
    clean = clean.replace(/^[\s]*[-*•] (.*)/gm, '<li class="relative pl-8 mb-4 before:content-[\\'—\\'] before:absolute before:left-0 before:text-primary before:font-black text-lg lg:text-xl text-gray-700 dark:text-gray-300">$1</li>');

    // 4. Инфо-блоки (Цена, Сроки)
    clean = clean.replace(/^(Цена|Примерная цена|Сроки|Диагностика)[^:]*:(.*$)/gm, 
        '<div class="bg-gray-100 dark:bg-gray-800/50 p-8 rounded-3xl border-l-8 border-gray-400 my-10">' +
        '<strong class="block uppercase tracking-widest text-sm text-gray-500 mb-2">$1</strong>' +
        '<p class="text-2xl font-black text-gray-900 dark:text-white m-0">$2</p></div>');

    // 5. РАЗБИВКА НА АБЗАЦЫ
    const lines = clean.split('\\n');
    let finalHtml = '';
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
            finalHtml += trimmed + '\\n';
        } else {
            const isPointHeader = trimmed.startsWith('<strong>');
            const spacingClass = isPointHeader ? 'mt-12 mb-6' : 'mb-10';
            finalHtml += \`<p class="\${spacingClass} leading-relaxed text-gray-700 dark:text-gray-300 font-medium text-lg lg:text-xl">\${trimmed}</p>\\n\`;
        }
    });
    return finalHtml;
}

async function generateDeepArticle(topicData) {
    const { topic } = topicData;
    console.log(\`\\n🚀 СТАРТ: "\${topic}"\`);

    try {
        // [1] SEO
        const metaPrompt = \`Для темы "\${topic}" создай SEO данные (город Кемерово). Верни ТОЛЬКО JSON: {"title": "...", "description": "...", "slug": "..."}\`;
        const metaRes = await model.generateContent(metaPrompt);
        const meta = JSON.parse(metaRes.response.text().match(/\\{[\\s\\S]*\\}/)[0]);

        // [2] ПЛАН
        const planPrompt = \`Создай план статьи из 4 глав для: "\${topic}". Верни ТОЛЬКО JSON массив строк.\`;
        const planRes = await model.generateContent(planPrompt);
        const sections = JSON.parse(planRes.response.text().match(/\\[[\\s\\S]*\\]/)[0]);

        // [3] КОНТЕНТ
        let chapters = [];
        for (const section of sections) {
            const chapterPrompt = \`\${systemPrompt}\\n\\nНАПИШИ ГЛАВУ: "\${section}" (Тема: \${topic})\\nТРЕБОВАНИЯ: ТОЛЬКО чистый текст с HTML (h2, p, ul). НИКАКОГО MARKDOWN!\`;
            const chapterRes = await model.generateContent(chapterPrompt);
            chapters.push(cleanMarkdown(chapterRes.response.text()));
        }

        // [4] СБОРКА
        const blitzPrompt = \`Напиши Blitz-Answer (Цена, Срок, Диагностика) для "\${topic}". Без Markdown.\`;
        const blitzHtml = cleanMarkdown((await model.generateContent(blitzPrompt)).response.text());

        const nuancePrompt = \`Напиши технический секрет инженера для "\${topic}". Без Markdown.\`;
        const nuanceHtml = cleanMarkdown((await model.generateContent(nuancePrompt)).response.text());

        const MASTER_HEADER = fs.readFileSync(path.join(PUBLIC_DIR, 'header.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');
        const MASTER_FOOTER = fs.readFileSync(path.join(PUBLIC_DIR, 'footer.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');

        const finalHtml = \`<!DOCTYPE html>
<html lang="ru" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${meta.title} | Админ.Ко</title>
    <meta name="description" content="\${meta.description}">
    <link rel="icon" href="../favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../styles.css?v=3.4">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#E50914' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300">
\${MASTER_HEADER}
<main class="flex-grow">
    <article class="max-w-4xl mx-auto px-4 py-12 md:py-24">
        <header class="mb-16 md:mb-24">
            <div class="flex items-center gap-3 text-xs font-bold text-primary uppercase tracking-widest mb-8 italic">
                <span class="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">Инженерный кейс</span>
                <span class="text-gray-400">Лаборатория Админ.Ко</span>
            </div>
            <h1 class="text-4xl md:text-7xl font-black mb-10 leading-tight tracking-tighter text-gray-900 dark:text-white uppercase italic">\${meta.title}</h1>
            <meta name="published_at" content="\${new Date().toISOString()}">
        </header>
        <div class="prose prose-lg dark:prose-invert max-w-none">
            <!-- CONTENT START -->
            <section>\${chapters[0]}</section>
            \${Layout.yellowBlock(blitzHtml)}
            <section>\${chapters[1]}</section>
            \${Layout.blueBlock(nuanceHtml)}
            \${Layout.ctaBlock}
            <section>\${chapters[2] || ''}</section>
            <section class="mt-12">\${chapters[3] || ''}</section>
            <!-- CONTENT END -->
        </div>
    </article>
</main>
\${MASTER_FOOTER}
<script src="../components.js?v=3.4"></script>
</body>
</html>\`;

        fs.writeFileSync(path.join(BLOG_DIR, \`\${meta.slug}.html\`), finalHtml);
        console.log(\`✅ Готово: \${meta.slug}.html\`);
    } catch (e) {
        console.error(\`❌ Ошибка: \`, e.message);
    }
}

if (require.main === module) {
    async function run() {
        const topics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf-8'));
        if (topics.length > 0) {
            await generateDeepArticle(topics[0]);
            fs.writeFileSync(TOPICS_FILE, JSON.stringify(topics.slice(1), null, 2));
        }
    }
    run();
}

module.exports = { generateDeepArticle };
