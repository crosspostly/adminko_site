const axios = require('axios');
require('dotenv').config();

/**
 * Модуль публикации в Headless WordPress (v1.0 - Март 2026)
 */
class WPPublisher {
    constructor() {
        this.url = process.env.WP_URL; // Например: https://cms.adminko.ru
        this.username = process.env.WP_USERNAME;
        this.password = process.env.WP_PASSWORD; // Application Password
        this.auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    }

    /**
     * Публикация статьи
     */
    async publishPost(data) {
        const { title, content, slug, excerpt, categories, tags, featured_media } = data;

        try {
            console.log(`🌐 Отправка в WordPress: "${title}"...`);
            
            const response = await axios.post(`${this.url}/wp-json/wp/v2/posts`, {
                title: title,
                content: content,
                slug: slug,
                excerpt: excerpt,
                status: 'publish', // или 'draft' для проверки
                categories: categories || [],
                tags: tags || [],
                featured_media: featured_media || null,
                format: 'standard'
            }, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Опубликовано! ID: ${response.data.id} | Link: ${response.data.link}`);
            return response.data;
        } catch (error) {
            console.error('❌ Ошибка публикации в WP:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    /**
     * Загрузка медиа (из Nano-Banana) в WordPress
     */
    async uploadMedia(imageBuffer, filename) {
        try {
            console.log(`🖼️ Загрузка медиа: ${filename}...`);
            
            const response = await axios.post(`${this.url}/wp-json/wp/v2/media`, imageBuffer, {
                headers: {
                    'Authorization': `Basic ${this.auth}`,
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Type': 'image/jpeg'
                }
            });

            console.log(`✅ Медиа загружено. ID: ${response.data.id}`);
            return response.data.id;
        } catch (error) {
            console.error('❌ Ошибка загрузки медиа:', error.response ? error.response.data : error.message);
            return null;
        }
    }
}

module.exports = new WPPublisher();
