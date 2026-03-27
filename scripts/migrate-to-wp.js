const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const { JSDOM } = require('jsdom');
require('dotenv').config();

const DB_CONFIG = {
    host: '127.0.0.1',
    port: 3306,
    user: 'wp_user',
    password: 'wp_password',
    database: 'wordpress'
};

const BLOG_DIR = path.join(__dirname, '../site/public/blog');

async function migrateContent() {
    let connection;
    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Подключено к базе данных WordPress.');

        const files = await fs.readdir(BLOG_DIR);
        const htmlFiles = files.filter(f => f.endsWith('.html'));

        for (const file of htmlFiles) {
            const filePath = path.join(BLOG_DIR, file);
            const htmlContent = await fs.readFile(filePath, 'utf-8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;
            
            const title = document.querySelector('h1')?.textContent.trim() || 'Без заголовка';
            const content = document.querySelector('article')?.innerHTML || '';
            const slug = file.replace('.html', '');

            // Проверяем, существует ли пост
            const [rows] = await connection.execute('SELECT ID FROM wp_posts WHERE post_name = ?', [slug]);

            if (rows.length > 0) {
                console.log(`🟡 Пост "${slug}" уже существует. Пропускаю.`);
                continue;
            }

            // Создаем пост
            const post = {
                post_author: 1, // admin
                post_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                post_date_gmt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                post_content: content,
                post_title: title,
                post_excerpt: '',
                post_status: 'publish',
                comment_status: 'closed',
                ping_status: 'closed',
                post_name: slug,
                to_ping: '',
                pinged: '',
                post_modified: new Date().toISOString().slice(0, 19).replace('T', ' '),
                post_modified_gmt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                post_content_filtered: '',
                post_parent: 0,
                guid: '', // Будет заполнено WordPress после вставки
                menu_order: 0,
                post_type: 'post',
                post_mime_type: '',
                comment_count: 0
            };

            const [result] = await connection.execute(
                `INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [post.post_author, post.post_date, post.post_date_gmt, post.post_content, post.post_title, post.post_excerpt, post.post_status, post.comment_status, post.ping_status, post.post_name, post.to_ping, post.pinged, post.post_modified, post.post_modified_gmt, post.post_content_filtered, post.post_parent, post.guid, post.menu_order, post.post_type, post.post_mime_type, post.comment_count]
            );

            console.log(`✅ Мигрирован пост: "${title}" (ID: ${result.insertId})`);
        }
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Соединение с базой данных закрыто.');
        }
    }
}

migrateContent();
