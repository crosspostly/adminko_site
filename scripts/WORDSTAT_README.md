# Yandex Wordstat Topic Generator v2.0

Продакшн-скрипт для генерации тем статей на основе данных **НОВОГО API Яндекс.Вордстат** (2025).

## 🚀 Быстрый старт

### 1. Получение OAuth токена

```
https://oauth.yandex.ru/authorize?response_type=token&client_id=9cb249a1890246e3bda803264d1f8743
```

1. Откройте ссылку в браузере
2. Авторизуйтесь в Яндексе
3. Подтвердите права доступа
4. Скопируйте токен из адресной строки (параметр `access_token=...`)

### 2. Настройка .env

Добавьте токен в файл `.env`:

```env
YANDEX_OAUTH_TOKEN=ваш_токен_из_адресной_строки
```

### 3. Подача заявки на доступ к API

⚠️ **Важно!** Новый API Wordstat требует предварительной заявки:

1. Зайдите в [Яндекс.Директ](https://direct.yandex.ru)
2. Создайте заявку в поддержку на доступ к Wordstat API
3. Укажите ваш ClientId: `9cb249a1890246e3bda803264d1f8743`
4. Дождитесь подтверждения на email

### 4. Запуск

```bash
# Проверка подключения и квот
node scripts/yandex-wordstat.js test

# Получение дерева регионов
node scripts/yandex-wordstat.js regions

# Генерация тем
node scripts/yandex-wordstat.js topics
```

## 📊 Что делает скрипт

1. **Генерирует 1648 ключевых слов** по 8 категориям:
   - phone (смартфоны) — 205 слов
   - laptop (ноутбуки) — 205 слов
   - b2b_it (ИТ-аутсорсинг) — 205 слов
   - cctv (видеонаблюдение) — 205 слов
   - consoles (игровые приставки) — 205 слов
   - appliances (пылесосы/кофемашины) — 205 слов
   - tv (телевизоры) — 205 слов
   - data_recovery (восстановление данных) — 205 слов

2. **Запрашивает статистику** из нового API Wordstat:
   - `/v1/topRequests` — популярные запросы
   - `/v1/regions` — распределение по регионам
   - `/v1/dynamics` — динамика запросов

3. **Генерирует темы статей** с учетом частотности

4. **Сохраняет результат** в `data/wordstat_topics.json`

## 📁 Выходные данные

Файл `data/wordstat_topics.json`:

```json
[
  {
    "topic": "Ремонт телефонов: полный гайд по ремонту в Кемерово",
    "keywords": [
      "ремонт телефонов",
      "ремонт телефонов кемерово",
      "ремонт смартфонов",
      "замена экрана iphone"
    ],
    "category": "phone",
    "totalQueries": 4521,
    "topRequests": [
      {"phrase": "ремонт телефонов кемерово", "count": 4521},
      {"phrase": "ремонт iphone кемерово", "count": 2340}
    ]
  }
]
```

## 🔧 API лимиты

| Параметр | Значение |
|----------|----------|
| Запросов в секунду | 10 |
| Запросов в день | 1000 |
| Фраз за запрос | до 128 |
| Топ запросов | до 2000 |

Скрипт автоматически соблюдает лимиты (задержка 500ms между запросами).

## 🗺 Коды регионов

| Регион | ID |
|--------|-----|
| Кемерово | 115 |
| Москва | 213 |
| Санкт-Петербург | 2 |
| Кемеровская область | 115 |

Для изменения региона отредактируйте `CONFIG.REGIONS` в скрипте.

## 🛠 Интеграция

### В content-orchestrator.js

```javascript
const { generateTopicsFromWordstat } = require('./scripts/yandex-wordstat');

async function run() {
    // 1. Получаем темы из Wordstat
    const topics = await generateTopicsFromWordstat();
    
    // 2. Сортируем по частотности
    const sorted = topics.sort((a, b) => b.totalQueries - a.totalQueries);
    
    // 3. Генерируем статьи через Gemini
    for (const topic of sorted.slice(0, 10)) {
        await generateArticle(topic);
    }
}
```

### Отдельный запрос статистики

```javascript
const { WordstatAPI } = require('./scripts/yandex-wordstat');

const api = new WordstatAPI();
await api.init();

// Информация о квотах
const userInfo = await api.getUserInfo();
console.log(userInfo);

// Топ запросы по фразе
const stats = await api.getTopRequests(
    ['ремонт телефонов кемерово'],
    [115],  // Кемерово
    ['all', 'phone'],
    100
);
console.log(stats);
```

## 📝 Структура команд

| Команда | Описание |
|---------|----------|
| `test` | Проверка OAuth и вывод квот |
| `regions` | Получение дерева регионов |
| `topics` | Генерация тем (основной режим) |
| `help` | Справка |

## ⚠️ Troubleshooting

### "OAuth token не задан"
Добавьте токен в `.env`:
```env
YANDEX_OAUTH_TOKEN=ваш_токен
```

### "Доступ к API запрещен" (403)
Необходимо подать заявку на доступ через поддержку Яндекс.Директ.

### "Неверный OAuth токен" (401)
Получите новый токен по ссылке и обновите `.env`.

### "Превышен лимит запросов" (429)
Скрипт автоматически ждет 30 секунд. Не прерывайте выполнение.

### "Мало квоты"
Дневной лимит сбрасывается в полночь по Москве. Дождитесь сброса.

## 📚 Документация

- [API Wordstat](https://yandex.ru/support2/wordstat/ru/content/api-structure)
- [OAuth 2.0](https://yandex.ru/dev/oauth/doc/dg/concepts/about.html)
- [Яндекс.Директ API](https://yandex.ru/dev/direct/doc/dg/concepts/about.html)

## 🔐 Безопасность

- ✅ `.env` добавлен в `.gitignore`
- ✅ OAuth токен хранится локально
- ✅ Rate limiting встроен
- ✅ Кэширование результатов
