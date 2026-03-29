/**
 * Yandex Wordstat API Client - Production Version v2
 * 
 * Использует НОВЫЙ API Wordstat: https://api.wordstat.yandex.net
 * Документация: https://yandex.ru/support2/wordstat/ru/content/api-structure
 * 
 * Методы:
 * - /v1/topRequests - популярные запросы по фразе
 * - /v1/regions - распределение по регионам
 * - /v1/dynamics - динамика запросов
 * - /v1/userInfo - информация о пользователе и квотах
 * 
 * Авторизация:
 * 1. Получить OAuth-токен: https://oauth.yandex.ru/authorize?response_type=token&client_id=9cb249a1890246e3bda803264d1f8743
 * 2. Сохранить токен в .env как YANDEX_OAUTH_TOKEN
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

const CONFIG = {
    // Client credentials
    CLIENT_ID: process.env.YANDEX_CLIENT_ID || '9cb249a1890246e3bda803264d1f8743',
    CLIENT_SECRET: process.env.YANDEX_CLIENT_SECRET || '3141c558ecb34d09b61cf1424a3bc6c9',
    
    // OAuth токен
    OAUTH_TOKEN: process.env.YANDEX_OAUTH_TOKEN,
    
    // API endpoint (НОВЫЙ API!)
    API_URL: 'https://api.wordstat.yandex.net',
    
    // Регионы: 2 = Москва, 213 = Санкт-Петербург, 115 = Кемерово
    // Получаем список регионов через /v1/getRegionsTree
    REGIONS: [115], // Кемерово
    
    // Устройства
    DEVICES: ['all', 'desktop', 'phone', 'tablet'],
    
    // Настройки запросов
    MAX_PHRASES_PER_REQUEST: 100,
    REQUEST_DELAY_MS: 500, // 500ms между запросами (лимит 10 req/sec)
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 3000,
    
    // Пути к файлам
    OUTPUT_DIR: path.join(__dirname, '../data'),
    CACHE_FILE: path.join(__dirname, '../data/wordstat_cache.json'),
    TOPICS_FILE: path.join(__dirname, '../data/wordstat_topics.json'),
    REGIONS_FILE: path.join(__dirname, '../data/wordstat_regions.json'),
};

// ============================================================================
// KEYWORD MASKS (маски для генерации ключевых слов)
// ============================================================================

const KEYWORD_MASKS = {
    phone: [
        'ремонт телефонов', 'ремонт смартфонов', 'замена экрана', 'замена дисплея',
        'замена аккумулятора', 'ремонт iphone', 'ремонт samsung', 'ремонт xiaomi',
        'ремонт honor', 'ремонт realme', 'восстановление после воды', 'замена стекла',
        'ремонт разъема зарядки', 'прошивка телефона', 'ремонт динамика', 'ремонт микрофона'
    ],
    laptop: [
        'ремонт ноутбуков', 'ремонт макбуков', 'чистка ноутбука', 'замена матрицы',
        'ремонт материнской платы', 'замена клавиатуры', 'апгрейд ноутбука',
        'установка ssd', 'установка windows', 'удаление вирусов', 'восстановление данных',
        'замена термопасты', 'ремонт после залития', 'настройка wifi', 'ремонт пк'
    ],
    b2b_it: [
        'ит аутсорсинг', 'обслуживание компьютеров', 'администрирование сетей',
        'настройка сервера', 'поддержка 1с', 'облачные решения', 'резервное копирование',
        'настройка видеонаблюдения', 'скупка компьютеров', 'утилизация техники',
        'настройка скд', 'настройка скус', 'монтаж лок', 'настройка телефонии'
    ],
    cctv: [
        'видеонаблюдение', 'монтаж камер', 'установка камер', 'обслуживание камер',
        'ремонт видеонаблюдения', 'ip камеры', 'купольные камеры', 'уличные камеры',
        'настройка dvr', 'настройка nvr', 'удаленный доступ к камерам',
        'системы контроля доступа', 'домофония', 'электрозамки'
    ],
    consoles: [
        'ремонт ps5', 'ремонт ps4', 'ремонт xbox', 'ремонт nintendo switch',
        'чистка приставки', 'замена термопасты', 'замена стиков', 'ремонт джойстиков',
        'установка игр', 'прошивка приставки', 'ремонт hdmi', 'замена лазерной головки'
    ],
    appliances: [
        'ремонт пылесосов', 'ремонт роботов пылесосов', 'ремонт кофемашин',
        'ремонт кофемолок', 'декальцинация', 'замена помпы', 'чистка кофемашины',
        'ремонт xiaomi', 'ремонт roborock', 'замена аккумулятора пылесоса',
        'ремонт щетки', 'замена фильтра'
    ],
    tv: [
        'ремонт телевизоров', 'ремонт led', 'ремонт lcd', 'замена подсветки',
        'ремонт материнской платы тв', 'ремонт блока питания', 'прошивка телевизора',
        'настройка smart tv', 'ремонт после грозы', 'замена матрицы',
        'телевизор не включается', 'телевизор мигает', 'нет звука'
    ],
    data_recovery: [
        'восстановление данных', 'восстановление с диска', 'восстановление с флешки',
        'восстановление с карты памяти', 'ремонт hdd', 'ремонт ssd',
        'восстановление после форматирования', 'восстановление удаленных файлов',
        'расшифровка данных', 'клонирование диска', 'замена платы hdd'
    ]
};

// ============================================================================
// API CLIENT
// ============================================================================

class WordstatAPI {
    constructor() {
        this.token = null;
        this.regionsCache = null;
    }

    async init() {
        this.token = this.validateOAuthToken();
        
        // Создаем директорию для данных если не существует
        if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
            fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
        }
        
        // Загружаем кэш регионов если есть
        this.loadRegionsCache();
    }

    validateOAuthToken() {
        if (!CONFIG.OAUTH_TOKEN) {
            console.error('❌ YANDEX_OAUTH_TOKEN не задан в .env');
            console.error('\n📋 Инструкция по получению токена:');
            console.error('1. Перейдите по ссылке:');
            console.error(`   https://oauth.yandex.ru/authorize?response_type=token&client_id=${CONFIG.CLIENT_ID}`);
            console.error('2. Авторизуйтесь в Яндексе и подтвердите доступ');
            console.error('3. Скопируйте токен из адресной строки (параметр access_token)');
            console.error('4. Добавьте в .env: YANDEX_OAUTH_TOKEN=ваш_токен');
            throw new Error('OAuth token не задан');
        }
        return CONFIG.OAUTH_TOKEN;
    }

    async makeRequest(method, params = {}) {
        const url = `${CONFIG.API_URL}${method}`;
        
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json;charset=utf-8',
        };

        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                await this.sleep(CONFIG.REQUEST_DELAY_MS);
                
                const response = await axios.post(url, params, { headers });
                
                // Проверяем наличие ошибок в ответе
                if (response.data.error) {
                    const err = response.data.error;
                    throw new Error(`API Error: ${err.code || 'UNKNOWN'} - ${err.message || JSON.stringify(err)}`);
                }
                
                return response.data;
                
            } catch (error) {
                console.error(`⚠️ Попытка ${attempt}/${CONFIG.MAX_RETRIES} failed:`, error.message);
                
                if (attempt === CONFIG.MAX_RETRIES) {
                    throw error;
                }
                
                // Обработка специфичных ошибок
                if (error.response?.status === 401) {
                    throw new Error('Неверный OAuth токен. Получите новый: ' + 
                        `https://oauth.yandex.ru/authorize?response_type=token&client_id=${CONFIG.CLIENT_ID}`);
                }
                
                if (error.response?.status === 429) {
                    console.log('⏳ Превышен лимит запросов (Rate Limit), ждем 30 секунд...');
                    await this.sleep(30000);
                    continue;
                }
                
                if (error.response?.status === 403) {
                    throw new Error('Доступ к API запрещен. Убедитесь что вы подали заявку на доступ через форму поддержки Яндекс.Директ');
                }
                
                await this.sleep(CONFIG.RETRY_DELAY_MS);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================================================
    // WORDSTAT METHODS
    // ========================================================================

    /**
     * Получает информацию о пользователе и квотах
     */
    async getUserInfo() {
        console.log('📊 Получение информации о пользователе...');
        const result = await this.makeRequest('/v1/userInfo');
        return result.userInfo;
    }

    /**
     * Получает дерево регионов
     */
    async getRegionsTree() {
        console.log('🌍 Получение списка регионов...');
        const result = await this.makeRequest('/v1/getRegionsTree');
        
        // Сохраняем в кэш
        this.regionsCache = result;
        this.saveRegionsCache();
        
        return result;
    }

    /**
     * Получает популярные запросы по фразе(ам)
     * @param {string|string[]} phrases - Фраза или массив фраз (макс 128)
     * @param {number[]} regions - IDs регионов
     * @param {string[]} devices - Типы устройств
     * @param {number} numPhrases - Количество фраз в ответе (макс 2000)
     */
    async getTopRequests(phrases, regions = CONFIG.REGIONS, devices = ['all'], numPhrases = 200) {
        const params = {
            phrases: Array.isArray(phrases) ? phrases : [phrases],
            regions,
            devices,
            numPhrases
        };

        const result = await this.makeRequest('/v1/topRequests', params);
        return result;
    }

    /**
     * Получает распределение запросов по регионам
     */
    async getRegionsDistribution(phrase, devices = ['all']) {
        const params = {
            phrase,
            regionType: 'cities',
            devices
        };

        const result = await this.makeRequest('/v1/regions', params);
        return result.regions || [];
    }

    /**
     * Получает динамику запросов
     */
    async getDynamics(phrase, period = 'monthly', fromDate, toDate, regions = CONFIG.REGIONS, devices = ['all']) {
        // Если даты не указаны, берем последние 3 месяца
        if (!fromDate) {
            const date = new Date();
            date.setMonth(date.getMonth() - 3);
            fromDate = date.toISOString().split('T')[0];
        }
        
        if (!toDate) {
            toDate = new Date().toISOString().split('T')[0];
        }

        const params = {
            phrase,
            period,
            fromDate,
            toDate,
            regions,
            devices
        };

        const result = await this.makeRequest('/v1/dynamics', params);
        return result.dynamics || [];
    }

    // ========================================================================
    // BATCH PROCESSING
    // ========================================================================

    /**
     * Обрабатывает список фраз батчами
     */
    async processPhrasesBatch(phrases, onProgress = null) {
        const results = [];
        const chunks = this.chunkArray(phrases, CONFIG.MAX_PHRASES_PER_REQUEST);
        
        console.log(`🔍 Обработка ${phrases.length} фраз в ${chunks.length} запросах...`);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`\n📦 Запрос ${i + 1}/${chunks.length} (${chunk.length} фраз)`);
            
            try {
                const data = await this.getTopRequests(chunk);
                
                if (Array.isArray(data)) {
                    results.push(...data);
                } else if (data.requestPhrase) {
                    results.push(data);
                }
                
                // Сохраняем промежуточный результат в кэш
                this.saveCache(results);
                
                if (onProgress) {
                    onProgress(i + 1, chunks.length, results.length);
                }
                
            } catch (error) {
                console.error(`❌ Ошибка обработки чанка ${i + 1}:`, error.message);
                // Продолжаем обработку следующих чанков
            }
        }
        
        return results;
    }

    chunkArray(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================

    saveCache(data) {
        try {
            fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify(data, null, 2));
            console.log(`💾 Кэш сохранен: ${CONFIG.CACHE_FILE} (${data.length} записей)`);
        } catch (e) {
            console.error('⚠️ Не удалось сохранить кэш:', e.message);
        }
    }

    loadCache() {
        try {
            if (fs.existsSync(CONFIG.CACHE_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.CACHE_FILE, 'utf-8'));
                console.log(`📂 Загружено ${data.length} записей из кэша`);
                return data;
            }
        } catch (e) {
            console.error('⚠️ Не удалось загрузить кэш:', e.message);
        }
        return [];
    }

    saveRegionsCache() {
        try {
            fs.writeFileSync(CONFIG.REGIONS_FILE, JSON.stringify(this.regionsCache, null, 2));
            console.log(`💾 Кэш регионов сохранен: ${CONFIG.REGIONS_FILE}`);
        } catch (e) {
            console.error('⚠️ Не удалось сохранить кэш регионов:', e.message);
        }
    }

    loadRegionsCache() {
        try {
            if (fs.existsSync(CONFIG.REGIONS_FILE)) {
                this.regionsCache = JSON.parse(fs.readFileSync(CONFIG.REGIONS_FILE, 'utf-8'));
                console.log('📂 Кэш регионов загружен');
            }
        } catch (e) {
            console.error('⚠️ Не удалось загрузить кэш регионов:', e.message);
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Генерирует расширенный список ключевых слов с гео-модификаторами
 */
function generateKeywords() {
    const geoModifiers = ['кемерово', 'кузбасс', 'кемеровская область'];
    const allKeywords = [];
    
    for (const [category, masks] of Object.entries(KEYWORD_MASKS)) {
        for (const mask of masks) {
            // Базовая маска без модификатора
            allKeywords.push({ keyword: mask, category });
            
            // С гео-модификаторами
            for (const geo of geoModifiers) {
                allKeywords.push({ keyword: `${mask} ${geo}`, category });
            }
            
            // С дополнительными словами
            const additionalWords = ['цена', 'стоимость', 'мастер', 'сервис', 'центр', 'рядом'];
            for (const word of additionalWords) {
                allKeywords.push({ keyword: `${mask} ${word}`, category });
                allKeywords.push({ keyword: `${mask} ${word} кемерово`, category });
            }
        }
    }
    
    // Удаляем дубликаты
    const unique = new Map();
    for (const item of allKeywords) {
        unique.set(item.keyword.toLowerCase(), item);
    }
    
    return Array.from(unique.values());
}

/**
 * Генерирует заголовок статьи из ключевого слова
 */
function generateTopicFromKeyword(keyword, queries) {
    const templates = [
        (k) => `${capitalize(k)}: полный гайд по ремонту в Кемерово`,
        (k) => `Как ${k} в Кемерово: советы мастеров Админ.Ко`,
        (k) => `${capitalize(k)} - цена, сроки и гарантии в сервисном центре`,
        (k) => `Профессиональное решение: ${capitalize(k)}`,
        (k) => `${capitalize(k)} своими руками или мастер? Сравниваем варианты`
    ];
    
    let templateIndex = 0;
    if (queries > 1000) templateIndex = 0;
    else if (queries > 500) templateIndex = 1;
    else if (queries > 100) templateIndex = 2;
    else templateIndex = 3;
    
    return {
        title: templates[templateIndex](keyword),
        queries
    };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Основная функция генерации тем из Wordstat
 */
async function generateTopicsFromWordstat() {
    console.log('🚀 Yandex Wordstat Topic Generator v2.0 (NEW API)\n');
    console.log('='.repeat(60));
    
    const api = new WordstatAPI();
    
    try {
        // Инициализация
        await api.init();
        
        // Проверяем квоты
        const userInfo = await api.getUserInfo();
        console.log(`👤 Пользователь: ${userInfo.login}`);
        console.log(`📊 Лимиты: ${userInfo.limitPerSecond} req/sec, ${userInfo.dailyLimit} req/day`);
        console.log(`⏳ Остаток квоты: ${userInfo.dailyLimitRemaining}/${userInfo.dailyLimit}`);
        
        if (userInfo.dailyLimitRemaining < 50) {
            console.warn('⚠️ Мало квоты! Рекомендуется подождать до полуночи (МСК)');
        }
        
        // Загружаем или получаем регионы
        if (!api.regionsCache) {
            await api.getRegionsTree();
        }
        
        // Находим ID Кемерово в дереве регионов
        const kemerovoId = findRegionId(api.regionsCache, 'Кемерово');
        if (kemerovoId) {
            console.log(`✅ Регион Кемерово: ID ${kemerovoId}`);
            CONFIG.REGIONS = [kemerovoId];
        } else {
            console.log('⚠️ Не удалось найти Кемерово, используем ID 115');
            CONFIG.REGIONS = [115];
        }
        
        // Генерируем ключевые слова
        const keywords = generateKeywords();
        console.log(`\n📝 Сгенерировано ${keywords.length} ключевых слов`);
        
        // Загружаем кэш если есть
        const cached = api.loadCache();
        
        // Получаем статистику
        const phrases = keywords.map(k => k.keyword);
        const stats = await api.processPhrasesBatch(phrases);
        
        // Агрегируем результаты по категориям
        const topicsByCategory = {};
        
        for (const stat of stats) {
            const keyword = stat.requestPhrase;
            const keywordInfo = keywords.find(k => k.keyword === keyword);
            const category = keywordInfo?.category || 'other';
            
            if (!topicsByCategory[category]) {
                topicsByCategory[category] = [];
            }
            
            // Считаем общую частотность
            const totalQueries = stat.totalCount || 0;
            const topRequests = stat.topRequests || [];
            
            // Берем топ-5 запросов для темы
            const relatedKeywords = topRequests.slice(0, 5).map(r => r.phrase);
            
            // Генерируем тему
            const topic = generateTopicFromKeyword(keyword, totalQueries);
            
            topicsByCategory[category].push({
                topic: topic.title,
                keywords: [keyword, ...relatedKeywords],
                category,
                totalQueries,
                topRequests: topRequests.slice(0, 10)
            });
        }
        
        // Сортируем по частотности и берем топ-10 на категорию
        const finalTopics = [];
        for (const [category, topics] of Object.entries(topicsByCategory)) {
            const sorted = topics.sort((a, b) => b.totalQueries - a.totalQueries);
            finalTopics.push(...sorted.slice(0, 10));
        }
        
        // Сохраняем результат
        fs.writeFileSync(CONFIG.TOPICS_FILE, JSON.stringify(finalTopics, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Сгенерировано ${finalTopics.length} тем`);
        console.log(`📁 Результат сохранен в: ${CONFIG.TOPICS_FILE}`);
        
        // Выводим топ тем
        console.log('\n📊 ТОП-20 тем по частотности:');
        finalTopics
            .sort((a, b) => b.totalQueries - a.totalQueries)
            .slice(0, 20)
            .forEach((t, i) => {
                console.log(`   ${i + 1}. [${t.category}] ${t.topic} (${t.totalQueries.toLocaleString()} запросов)`);
            });
        
        return finalTopics;
        
    } catch (error) {
        console.error('\n❌ Критическая ошибка:', error.message);
        
        if (error.message.includes('OAuth')) {
            console.error('\n📋 Для запуска скрипта необходимо:');
            console.error('   1. Получить OAuth токен');
            console.error('   2. Добавить его в .env как YANDEX_OAUTH_TOKEN');
        }
        
        if (error.message.includes('доступ к API запрещен')) {
            console.error('\n📋 Необходимо подать заявку на доступ к API:');
            console.error('   1. Зайдите в Яндекс.Директ');
            console.error('   2. Создайте заявку в поддержку на доступ к Wordstat API');
            console.error('   3. Укажите ваш ClientId: ' + CONFIG.CLIENT_ID);
        }
        
        throw error;
    }
}

/**
 * Рекурсивно ищет регион по названию в дереве регионов
 */
function findRegionId(regionsTree, name) {
    if (!regionsTree) return null;
    
    if (Array.isArray(regionsTree)) {
        for (const region of regionsTree) {
            const found = findRegionId(region, name);
            if (found) return found;
        }
    } else if (typeof regionsTree === 'object') {
        if (regionsTree.name && regionsTree.name.toLowerCase().includes(name.toLowerCase())) {
            return regionsTree.id;
        }
        if (regionsTree.children) {
            return findRegionId(regionsTree.children, name);
        }
    }
    
    return null;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'topics':
            await generateTopicsFromWordstat();
            break;
            
        case 'test':
            console.log('🧪 Тестовый режим...');
            const api = new WordstatAPI();
            await api.init();
            console.log('✅ OAuth токен валиден');
            console.log(`   Client ID: ${CONFIG.CLIENT_ID}`);
            
            const userInfo = await api.getUserInfo();
            console.log('\n📊 Информация о пользователе:');
            console.log(`   Логин: ${userInfo.login}`);
            console.log(`   Лимит req/sec: ${userInfo.limitPerSecond}`);
            console.log(`   Дневной лимит: ${userInfo.dailyLimit}`);
            console.log(`   Остаток: ${userInfo.dailyLimitRemaining}`);
            break;
            
        case 'regions':
            console.log('🌍 Получение списка регионов...');
            const api2 = new WordstatAPI();
            await api2.init();
            const regions = await api2.getRegionsTree();
            console.log(`✅ Получено дерево регионов`);
            console.log(`   Файл: ${CONFIG.REGIONS_FILE}`);
            break;
            
        case 'help':
        default:
            console.log(`
📊 Yandex Wordstat Topic Generator v2.0 (NEW API)

Использование:
  node yandex-wordstat.js topics    - Генерация тем из Wordstat
  node yandex-wordstat.js test      - Проверка подключения и квот
  node yandex-wordstat.js regions   - Получение дерева регионов
  node yandex-wordstat.js help      - Эта справка

Переменные окружения (.env):
  YANDEX_CLIENT_ID       - Client ID приложения
  YANDEX_CLIENT_SECRET   - Client Secret приложения  
  YANDEX_OAUTH_TOKEN     - OAuth токен для доступа к API (обязательно)

Получение OAuth токена:
  1. https://oauth.yandex.ru/authorize?response_type=token&client_id=9cb249a1890246e3bda803264d1f8743
  2. Авторизуйтесь и подтвердите доступ
  3. Скопируйте токен из адресной строки (access_token=...)
  4. Добавьте в .env: YANDEX_OAUTH_TOKEN=ваш_токен

Важно: Для доступа к API необходимо подать заявку через поддержку Яндекс.Директ
`);
            break;
    }
}

// Export для использования в других модулях
module.exports = {
    WordstatAPI,
    generateKeywords,
    generateTopicsFromWordstat,
    CONFIG,
    KEYWORD_MASKS
};

// Запуск если вызван напрямую
if (require.main === module) {
    main().catch(console.error);
}
