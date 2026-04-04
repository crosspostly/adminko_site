const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const BLOG_INDEX_PATH = path.join(BLOG_DIR, 'index.json');
const KEYWORDS_PATH = path.join(__dirname, 'real_keywords.json');

/**
 * ОДНОПРОХОДНАЯ ГЕНЕРАЦИЯ v7.0 (Anti-Duplicate & Pure Logic)
 */

function getLSIKeywords(topic) {
    try {
        const keywordsDB = JSON.parse(fs.readFileSync(KEYWORDS_PATH, 'utf-8'));
        const topicLower = topic.toLowerCase();
        const category = keywordsDB.find(c => topicLower.includes(c.category.toLowerCase()) || c.category.toLowerCase().includes(topicLower.split(' ')[0]));
        return category ? category.keywords.slice(0, 15).join(', ') : "";
    } catch (e) { return ""; }
}

function getTargetLanding(topic) {
    const t = topic.toLowerCase();
    if (t.includes('iphone') || t.includes('смартфон') || t.includes('телефон') || t.includes('samsung') || t.includes('xiaomi')) return { name: 'Ремонт смартфонов', url: 'phones.html' };
    if (t.includes('ноутбук') || t.includes('macbook') || t.includes('компьютер')) return { name: 'Ремонт компьютеров', url: 'computers.html' };
    if (t.includes('бизнес') || t.includes('сервер') || t.includes('аутсорсинг')) return { name: 'ИТ-услуги для бизнеса', url: 'business.html' };
    if (t.includes('камер') || t.includes('видео') || t.includes('скуд')) return { name: 'Видеонаблюдение и СКУД', url: 'cctv.html' };
    return { name: 'Все услуги сервиса', url: 'services-consumer.html' };
}

function cleanHTML(text) {
    return text
        .replace(/```html|```json|```/gi, '')
        .replace(/<html[^>]*>|<\/html>|<body[^>]*>|<\/body>|<head[^>]*>|<\/head>|<style[^>]*>[\s\S]*?<\/style>|<meta[^>]*>|<title[^>]*>[\s\S]*?<\/title>|<!DOCTYPE[^>]*>/gi, '')
        .replace(/&lt;h1&gt;|&lt;\/h1&gt;/gi, '')
        .trim();
}

async function generateDeepArticle(topicData) {
    const { topic, customSlug } = topicData;
    const lsiKeywords = getLSIKeywords(topic);
    const landing = getTargetLanding(topic);

    console.log(`\n🚀 ГЕНЕРАЦИЯ v7.0 (One-Shot): "${topic}"`);

    const mainPrompt = `
    ТЫ — ВЕДУЩИЙ ИНЖЕНЕР ЛАБОРАТОРИИ «АДМИН.КО» (КЕМЕРОВО, ДЗЕРЖИНСКОГО 2Б).
    Напиши экспертную статью на тему: "${topic}".
    
    LSI КЛЮЧИ: ${lsiKeywords}
    
    СТРОГИЕ ПРАВИЛА (АНТИ-МУСОР):
    1. НИКАКИХ ПОВТОРОВ. Если мысль уже высказана, не возвращайся к ней.
    2. НИКАКОЙ ВОДЫ. Забудь фразы "В современном мире", "iPhone - это важно". Сразу к делу.
    3. ТЕХНИЧЕСКАЯ ГЛУБИНА. Упомяни оборудование: Rigol, JBC, Quick 861DW, программатор JCID.
    4. ФОРМАТ: ТОЛЬКО HTML ТЕГИ (h2, h3, p, b, ul, li, table).
    
    СТРУКТУРА СТАТЬИ:
    - Вводная часть (кратко, 2-3 предложения с жирным ответом).
    - Оглавление (список ссылок #section-1, #section-2...).
    - Глава 1: Симптомы и причины (почему сломалось).
    - Глава 2: Техпроцесс (как именно мы чиним под микроскопом).
    - Глава 3: Инженерный секрет (неочевидный факт в блоке <div class="bg-blue-50 ...">).
    - Глава 4: Почему в Кемерово нужно идти именно на Дзержинского 2Б.
    - Таблица цен (HTML <table>).
    - FAQ (3-5 реальных вопросов).
    
    ВЕРНИ ВЕРСТКУ В JSON ФОРМАТЕ:
    {
      "title": "...",
      "description": "...",
      "html_content": "...",
      "takeaways": ["факт1", "факт2", "факт3"]
    }
    `;

    try {
        const res = await model.generateContent(mainPrompt);
        const rawJson = res.response.text().match(/\{[\s\S]*\}/)[0];
        const data = JSON.parse(rawJson);
        
        const slug = customSlug || data.title.toLowerCase().replace(/[^a-zа-я0-9]+/g, '-');
        const finalContent = cleanHTML(data.html_content);

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": data.title,
            "description": data.description,
            "datePublished": new Date().toISOString(),
            "author": { "@type": "Person", "name": "Инженер Админ.Ко" }
        };

        const MASTER_HEADER = fs.readFileSync(path.join(PUBLIC_DIR, 'header.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');
        const MASTER_FOOTER = fs.readFileSync(path.join(PUBLIC_DIR, 'footer.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');

        const finalHtml = `<!DOCTYPE html>
<html lang="ru" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} | Админ.Ко</title>
    <meta name="description" content="${data.description}">
    <link rel="icon" href="../favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../styles.css?v=3.7">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#E50914' } } } }
    </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen">
${MASTER_HEADER}
<main class="flex-grow max-w-5xl mx-auto px-4 py-12 md:py-24 w-full">
    <article class="bg-white dark:bg-gray-800 p-8 md:p-16 rounded-[3rem] shadow-xl border border-gray-100 dark:border-gray-700">
        <header class="mb-16">
            <div class="text-primary font-black uppercase tracking-widest text-xs mb-6 italic">Инженерный разбор v7.0 • Кемерово</div>
            <h1 class="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tighter text-gray-900 dark:text-white uppercase italic">${data.title}</h1>
        </header>

        <div class="prose prose-xl dark:prose-invert max-w-none">
            <!-- TAKEAWAYS -->
            <div class="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 mb-12">
                <h4 class="text-xl font-black m-0 mb-6 uppercase italic tracking-tighter flex items-center gap-2 text-primary">
                    <span class="material-symbols-outlined">analytics</span> Суть за 30 секунд
                </h4>
                <ul class="m-0 space-y-2 text-lg">
                    ${(data.takeaways || []).map(t => `<li><b>${t}</b></li>`).join('')}
                </ul>
            </div>

            <!-- CONTENT -->
            ${finalContent.replace(/<table/g, '<div class="overflow-x-auto my-12"><table class="w-full text-left border-collapse"').replace(/<\/table>/g, '</table></div>').replace(/<td>/g, '<td class="p-4 border-b border-gray-50 dark:border-gray-700">').replace(/<th>/g, '<th class="p-4 bg-gray-50 dark:bg-gray-900 font-bold uppercase text-xs">')}

            <!-- CTA -->
            <div class="mt-20 p-10 md:p-16 bg-primary rounded-[4rem] text-center text-white relative overflow-hidden">
                <h2 class="text-3xl md:text-5xl font-black mb-6 uppercase italic">Нужен качественный ремонт?</h2>
                <p class="text-xl mb-10 opacity-90">Кемерово, Дзержинского 2Б. Оборудование JBC и Rigol. Гарантия 1 год.</p>
                <button onclick="openMessengerModal()" class="bg-white text-primary px-12 py-6 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl uppercase">Бесплатная консультация</button>
            </div>

            <div class="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
                <a href="../${landing.url}" class="text-primary font-black uppercase text-xs tracking-widest hover:underline italic">→ ${landing.name} в Кемерово</a>
            </div>
        </div>
    </article>
</main>
${MASTER_FOOTER}
<script src="../components.js?v=3.7"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(BLOG_DIR, `${slug}.html`), finalHtml);
        console.log(`✅ Готово v7.0: ${slug}.html`);
    } catch (e) {
        console.error(`❌ Ошибка v7.0:`, e.message);
    }
}

module.exports = { generateDeepArticle };

// --- CLI Entry Point ---
// When run directly: node scripts/auto-blogger.js
// Reads the first topic from prioritized_topics.json and generates it
async function main() {
    const PRIORITIZED_TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');
    const WORDSTAT_TOPICS_FILE = path.join(__dirname, '../data/wordstat_topics.json');

    let topics = [];

    // Try prioritized topics first
    if (fs.existsSync(PRIORITIZED_TOPICS_FILE)) {
        topics = JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8'));
    }

    // Fallback to wordstat topics
    if (topics.length === 0 && fs.existsSync(WORDSTAT_TOPICS_FILE)) {
        topics = JSON.parse(fs.readFileSync(WORDSTAT_TOPICS_FILE, 'utf-8'));
    }

    if (topics.length === 0) {
        console.error('❌ Нет тем для генерации!');
        process.exit(1);
    }

    // Take first topic
    const topic = topics[0];
    await generateDeepArticle(topic);
}

// Run if executed directly (not required)
if (require.main === module) {
    main().catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}
