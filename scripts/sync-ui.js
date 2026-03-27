const fs = require('fs');
const path = require('path');

/**
 * ИЗОЛИРОВАННАЯ СИНХРОНИЗАЦИЯ UI v6.0
 * Гарантирует независимость блога от основного сайта.
 */

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const MASTER_HEADER = fs.readFileSync(path.join(PUBLIC_DIR, 'header.html'), 'utf-8');
const MASTER_FOOTER = fs.readFileSync(path.join(PUBLIC_DIR, 'footer.html'), 'utf-8');

/**
 * Синхронизация ГЛАВНЫХ страниц (Лендингов)
 */
function syncCorePage(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Для корня используем стандартную логику, но бережно
    const bodyMatch = html.match(/<body[\s\S]*?>/);
    if (!bodyMatch) return;
    const bodyStartTag = bodyMatch[0];

    // Вырезаем старое, вставляем новое
    let content = html.split(bodyStartTag)[1].split('</body>')[0];
    
    // Чистим только навигацию и футер
    content = content.replace(/<div class="brand-stripes[\s\S]*?<\/nav>/, '');
    content = content.replace(/<nav[\s\S]*?<\/nav>/, '');
    content = content.split(/<!-- Карта -->|<footer/)[0];

    const finalHtml = html.split(bodyStartTag)[0] + 
        bodyStartTag + "\n" +
        MASTER_HEADER + "\n" +
        content.trim() + "\n" +
        MASTER_FOOTER + "\n" +
        `<script src="components.js?v=3.3"></script>\n` +
        "</body>\n</html>";

    fs.writeFileSync(filePath, finalHtml);
    console.log(`🏠 Core Synced: ${path.basename(filePath)}`);
}

/**
 * ХИРУРГИЧЕСКАЯ синхронизация статей БЛОГА
 * Вообще не трогает контент статьи!
 */
function syncBlogArticle(filePath) {
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Подготовка относительных путей для блога
    const blogHeader = MASTER_HEADER.replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../')
                                   .replace(/src="(?!http|https)/g, 'src="../');
    const blogFooter = MASTER_FOOTER.replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../')
                                   .replace(/src="(?!http|https)/g, 'src="../');

    // 1. Меняем только навигацию
    if (html.includes('<nav')) {
        html = html.replace(/<div class="brand-stripes[\s\S]*?<\/nav>/, blogHeader);
        html = html.replace(/<nav[\s\S]*?<\/nav>/, blogHeader);
    } else {
        // Если навигации нет, вставляем после body
        html = html.replace(/<body[\s\S]*?>/, (match) => match + "\n" + blogHeader);
    }

    // 2. Меняем только футер и всё что после него
    if (html.includes('<footer')) {
        html = html.split('<footer')[0] + blogFooter + `\n<script src="../components.js?v=3.3"></script>\n</body>\n</html>`;
    } else if (html.includes('<!-- Карта -->')) {
        html = html.split('<!-- Карта -->')[0] + blogFooter + `\n<script src="../components.js?v=3.3"></script>\n</body>\n</html>`;
    } else if (html.includes('<!-- CONTENT END -->')) {
        html = html.split('<!-- CONTENT END -->')[0] + "<!-- CONTENT END -->\n        </div>\n    </article>\n</main>\n" + blogFooter + `\n<script src="../components.js?v=3.3"></script>\n</body>\n</html>`;
    } else {
        // Жесткий фоллбек: если всё сломано, просто лепим в конец перед body
        html = html.split('</body>')[0] + blogFooter + `\n<script src="../components.js?v=3.3"></script>\n</body>\n</html>`;
    }

    fs.writeFileSync(filePath, html);
    console.log(`📝 Blog Synced: ${path.basename(filePath)}`);
}

// РАСПРЕДЕЛЯЕМ ЗАДАЧИ
// 1. Лендинги в корне
const rootFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html') && !['header.html', 'footer.html'].includes(f));
rootFiles.forEach(f => syncCorePage(path.join(PUBLIC_DIR, f)));

// 2. Статьи в папке блога (ИЗОЛИРОВАННО)
const blogDir = path.join(PUBLIC_DIR, 'blog');
if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');
    blogFiles.forEach(f => syncBlogArticle(path.join(blogDir, f)));
}

console.log("\n🚀 ИЗОЛИРОВАННАЯ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА. Сайт и Блог теперь независимы.");
