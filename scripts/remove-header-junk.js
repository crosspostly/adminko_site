const fs = require('fs');
const path = require('path');

const filesToFix = [
    path.join(__dirname, '../site/public/phones.html'),
    path.join(__dirname, '../site/public/computers.html'),
    path.join(__dirname, '../site/public/other-devices.html')
];

filesToFix.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        let html = fs.readFileSync(filePath, 'utf-8');
        
        // Регулярное выражение для поиска кривого остатка хедера
        // Ищет от <!-- Brand Stripes --> до </header> включительно
        const regex = /<!-- Brand Stripes -->[\s\S]*?<\/header>/g;
        
        if (regex.test(html)) {
            html = html.replace(regex, '');
            fs.writeFileSync(filePath, html);
            console.log(`✅ Вырезан мусор из: ${path.basename(filePath)}`);
        } else {
            console.log(`ℹ️ Мусор не найден в: ${path.basename(filePath)}`);
        }
    }
});
