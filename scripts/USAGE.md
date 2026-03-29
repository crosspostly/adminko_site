# 🚀 Контент-конвейер Админ.Ко v6.0

Автоматизированная система генерации SEO-статей на основе **Yandex Wordstat**.

---

## 📋 Быстрый старт

### 1. Генерация тем из Wordstat (один раз или для обновления)

```bash
node scripts/yandex-wordstat.js topics
```

**Что происходит:**
- Скрипт подключается к Yandex Wordstat API
- Анализирует 1648 ключевых слов по 8 категориям
- Сохраняет 80 тем с реальной частотностью в `data/wordstat_topics.json`

**Время выполнения:** ~2-3 минуты

---

### 2. Генерация статей (ежедневный запуск)

```bash
node scripts/content-orchestrator.js
```

**Что происходит:**
1. Загружает темы из `data/wordstat_topics.json`
2. Генерирует 8 статей (по 1 на категорию) через Gemini AI
3. Обновляет индекс блога
4. Синхронизирует UI на всех страницах

**Время выполнения:** ~10-15 минут

---

## 🔄 Полный рабочий процесс

```bash
# === ПЕРВЫЙ ЗАПУСК ===

# 1. Генерируем темы из Wordstat
node scripts/yandex-wordstat.js topics

# 2. Запускаем контент-конвейер
node scripts/content-orchestrator.js


# === ЕЖЕДНЕВНЫЙ ЗАПУСК ===

# Просто запускаем оркестратор (темы уже есть)
node scripts/content-orchestrator.js


# === ОБНОВЛЕНИЕ ТЕМ ===

# Если темы закончились, генерируем новые
node scripts/yandex-wordstat.js topics

# Снова запускаем конвейер
node scripts/content-orchestrator.js
```

---

## 📊 Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    YANDEX WORDSTAT API                       │
│              (реальная статистика запросов)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  yandex-wordstat.js    │
         │  (генерация тем)       │
         └───────────┬────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │  data/wordstat_        │
         │  topics.json           │
         │  (80 тем с частотами)  │
         └───────────┬────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │  content-orchestrator  │
         │  (управление процессом)│
         └───────────┬────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌─────────────────┐
│ auto-blogger.js │      │ reindex-blog-   │
│ (генерация      │      │ safe.js         │
│  статей через   │      │ (обновление     │
│  Gemini AI)     │      │  индекса)       │
└─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │ sync-ui.js      │
                        │ (обновление     │
                        │  всех страниц)  │
                        └─────────────────┘
```

---

## 📁 Файлы

| Файл | Описание |
|------|----------|
| `scripts/yandex-wordstat.js` | Генерация тем из Wordstat |
| `scripts/content-orchestrator.js` | Главный контроллер |
| `scripts/auto-blogger.js` | Генерация статей через AI |
| `data/wordstat_topics.json` | Темы с частотностью |
| `data/wordstat_cache.json` | Кэш API запросов |
| `site/public/blog/` | Сгенерированные статьи |

---

## ⚙️ Настройки

### content-orchestrator.js

```javascript
const ARTICLES_PER_CATEGORY = 1; // статей на категорию за запуск
const CATEGORIES = [
    'phone', 'laptop', 'b2b_it', 'cctv',
    'consoles', 'appliances', 'tv', 'data_recovery'
];
```

### yandex-wordstat.js

```javascript
CONFIG = {
    REGIONS: [115],        // Кемерово
    MAX_PHRASES_PER_REQUEST: 100,
    REQUEST_DELAY_MS: 500,
}
```

---

## 🎯 Категории статей

| Категория | Описание | Примеры тем |
|-----------|----------|-------------|
| `phone` | Ремонт телефонов | Замена экрана, аккумулятора |
| `laptop` | Ноутбуки и ПК | Чистка, апгрейд, ремонт |
| `b2b_it` | ИТ-аутсорсинг | Обслуживание организаций |
| `cctv` | Видеонаблюдение | Монтаж камер, СКУД |
| `consoles` | Игровые приставки | Ремонт PS5, Xbox |
| `appliances` | Бытовая техника | Пылесосы, кофемашины |
| `tv` | Телевизоры | Ремонт LED/LCD |
| `data_recovery` | Восстановление данных | HDD, SSD, флешки |

---

## 📈 KPI и метрики

| Показатель | Значение |
|------------|----------|
| Тем из Wordstat | 80 |
| Ключевых слов анализируется | 1648 |
| статей за запуск | 8 |
| Расход квоты Wordstat | ~17 из 1024 |
| Время генерации 8 статей | 10-15 мин |

---

## 🛠 Troubleshooting

### "Нет тем для генерации"
```bash
node scripts/yandex-wordstat.js topics
```

### "Превышен лимит запросов Wordstat"
Подождите до полуночи (МСК) — квота обновится.

### "Ошибка при генерации статьи"
Проверьте `GEMINI_API_KEY` в `.env`

### "Мало тем в wordstat_topics.json"
Убедитесь что OAuth токен действителен:
```bash
node scripts/yandex-wordstat.js test
```

---

## 📅 Cron (автоматизация)

Для ежедневной генерации добавьте в crontab:

```bash
# Ежедневно в 09:00
0 9 * * * cd /home/varsmana/adminko_site && node scripts/content-orchestrator.js >> logs/orchestrator.log 2>&1

# Раз в неделю обновление тем (понедельник 08:00)
0 8 * * 1 cd /home/varsmana/adminko_site && node scripts/yandex-wordstat.js topics >> logs/wordstat.log 2>&1
```

---

## 🔐 Безопасность

- ✅ OAuth токен в `.env` (не в git)
- ✅ Gemini API key в `.env`
- ✅ Автоматический бэкап перед генерацией
- ✅ Rate limiting для API

---

## 📚 Документация

- [Wordstat API](https://yandex.ru/support2/wordstat/ru/content/api-structure)
- [Gemini AI](https://ai.google.dev/docs)
- [Оркестратор](./WORDSTAT_README.md)
