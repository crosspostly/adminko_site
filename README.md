# Админ.Ко — Сервисный центр (Кемерово)
**Профессиональный ремонт цифровой техники с 2014 года**
🔗 [admin-ko.ru](https://admin-ko.ru)

---

## 🚀 SEO-Машина v5.0 (Data-Driven Content Engine)

Полностью автономная система генерации, оптимизации и мониторинга контента.
Работает как «вечный двигатель» с принятием решений на основе реального трафика.

### 📊 Ключевые возможности:
*   **8 векторов роста**: Смартфоны, Ноутбуки, B2B-сервис, Видеонаблюдение/СКУД, Приставки, Пылесосы/Кофемашины, ТВ, Восстановление данных.
*   **Темп**: 8 статей/сутки + SEO-аудит каждой после генерации.
*   **Yandex Metrika**: Трафик-аналитика, hot-topic detection, content gap analysis.
*   **SEO Auditor**: IndexLift — аудит каждой статьи перед публикацией (Google + Яндекс + GEO).
*   **Decision Engine**: Решения на основе данных Метрики — что создавать, что обновлять.
*   **GEO-SEO**: Глубокая привязка к Кемерово и области (Вордстат семантика).
*   **AI Engine**: **Google Gemini 3.1 Flash-Lite** с контекстным окном 1М.

---

## 🔄 Content Pipeline v5.0

```
Wordstat API → Topic Queue → Orchestrator → Auto-Blogger (Gemini)
    → SEO Audit (IndexLift) → Reindex → Sync UI → Git Push → Nginx Reload
         ↓
    Metrika Analytics → Decision Engine → Hot Topic Detection → New Topics
         ↓
    Monitoring (7/14/30 days) → CONTINUE / PIVOT / URGENT
```

### Новые скрипты v5.0:

| Скрипт | Назначение |
|--------|-----------|
| `metrika-analytics.js` | API Метрики: топ страниц, источники, поисковые фразы, hot topics |
| `seo-audit-check.js` | SEO/GEO аудит каждой статьи через IndexLift Auditor |
| `content-decision-engine.js` | Data-driven решения: что создавать, обновлять, расширять |

---

## 📋 Команды

### Контент-пайплайн
```bash
# Запустить генерацию + SEO аудит
node scripts/content-orchestrator.js

# Cron (автоматически, ежедневно в 03:00)
scripts/cron-job.sh
```

### Аналитика Метрики
```bash
# Топ страниц за 7 дней
node scripts/metrika-analytics.js --action top-pages --days 7

# Источники трафика
node scripts/metrika-analytics.js --action traffic-sources --days 30

# Поисковые фразы
node scripts/metrika-analytics.js --action search-phrases --days 30

# Горячие темы (рост трафика)
node scripts/metrika-analytics.js --action hot-topics --days-a 7 --days-b 14

# Контентные пробелы (что ищут, чего нет)
node scripts/metrika-analytics.js --action content-gaps --days 30

# Статистика конкретной страницы
node scripts/metrika-analytics.js --action page-stats --url "/blog/remont-iphone"

# Сравнение периодов
node scripts/metrika-analytics.js --action compare --days-a 7 --days-b 14
```

### SEO Аудит
```bash
# Аудит одной статьи
node scripts/seo-audit-check.js --file site/public/blog/article.html

# Аудит всех статей за неделю
node scripts/seo-audit-check.js --all-recent --days 7
```

### Decision Engine
```bash
# Полный анализ + контент-план
node scripts/content-decision-engine.js

# Мониторинг опубликованных статей
node scripts/content-decision-engine.js --action monitor
```

### UI и обслуживание
```bash
node scripts/sync-ui.js              # Обновить header/footer на всех страницах
node scripts/reindex-blog-safe.js    # Перестроить индекс блога
node scripts/backup-manager.js       # Бэкап блога
```

---

## 🔐 Настройка

### .env (уже настроен)
```
GEMINI_API_KEY=...              # Google Gemini API ключ
YANDEX_CLIENT_ID=...            # Яндекс OAuth Client ID
YANDEX_CLIENT_SECRET=...        # Яндекс OAuth Client Secret
YANDEX_OAUTH_TOKEN=...          # Яндекс OAuth токен (Wordstat)
YANDEX_METRIKA_COUNTER_ID=...   # ID счётчика Метрики (для аналитики)
SEO_MIN_SCORE=80                # Минимальный SEO score для статьи
```

### Yandex Metrika — получение ID счётчика
1. Зайти на https://metrika.yandex.ru/
2. Выбрать счётчик admin-ko.ru
3. Скопировать номер из URL или настроек
4. Вставить в `.env` как `YANDEX_METRIKA_COUNTER_ID`

---

## 🛑 ПРАВИЛА РАЗРАБОТКИ (CRITICAL)

1.  **ЗАПРЕТ НА ИЗМЕНЕНИЕ ДИЗАЙНА**: Категорически запрещено менять оригинальный стиль, сетку (layout) или шрифты страниц без прямого запроса.
2.  **СОХРАННОСТЬ КОНТЕНТА**: Оригинальные тексты, блоки услуг, описания команды и отзывы неприкосновенны.
3.  **ЕДИНЫЙ UI**: Любые изменения Хедера или Футера вносятся ТОЛЬКО в `site/public/header.html` и `site/public/footer.html`, после чего запускается `node scripts/sync-ui.js`.
4.  **СТАНДАРТ СТАТЬИ**: Только формат "Продающий технический кейс". Без JSON в тексте, без "воды", с вшитыми реальными ключевыми словами.

---

## 🛠 Технический стек
*   **Frontend**: Tailwind CSS v3.4, Vanilla JS.
*   **Automation**: Node.js + Gemini 3.1 API.
*   **Analytics**: Yandex Metrika API (трафик, hot topics, content gaps).
*   **SEO Audit**: IndexLift SEO Auditor (Google + Яндекс + GEO checks).
*   **Decision Engine**: Data-driven контентные решения.
*   **Local Cron**: Автоматизация через `scripts/cron-job.sh`.
*   **Оборудование**: Quick 861DW, JBC, Rigol, JCID (используется в описаниях кейсов).

---

## 📈 Метрики успеха

| Метрика | Target | Источник |
|---------|--------|----------|
| Органический трафик | +30% за 90 дней | Метрика |
| Позиции в топ-10 | 20+ запросов | GSC / Вебмастер |
| SEO Score статей | ≥ 80/100 | IndexLift Auditor |
| CTR из выдачи | > 5% | GSC / Вебмастер |
| Bounce rate | < 50% | Метрика |
| Контентные пробелы | 0 | Decision Engine |

---

## 📁 Структура проекта

```
adminko_site/
├── scripts/                    # Автоматизация
│   ├── content-orchestrator.js    # Мастер-пайплайн (генерация + SEO аудит)
│   ├── auto-blogger.js            # Генератор статей v7.0 (Gemini)
│   ├── metrika-analytics.js       # 🆕 API Метрики — аналитика трафика
│   ├── seo-audit-check.js         # 🆕 SEO аудит каждой статьи
│   ├── content-decision-engine.js # 🆕 Data-driven решения
│   ├── yandex-wordstat.js         # Wordstat API клиент
│   ├── ai-keyword-analyzer.js     # AI-анализ ключевых слов
│   ├── sync-ui.js                 # Синхронизация header/footer
│   ├── backup-manager.js          # Бэкап блога
│   └── ...                        # Остальные утилиты
├── data/                       # Wordstat данные и решения Decision Engine
├── site/public/                # Статический сайт (nginx)
│   ├── blog/                   # 196+ статей
│   └── *.html                  # Лендинги
├── content_factory/            # Выход контент-пайплайна (social, seo, geo, aeo)
├── backups/                    # Бэкапы блога (10 ротационных)
├── logs/                       # Логи cron и SEO аудитов
└── seo_skill_repo_tmp/         # IndexLift SEO Auditor (движок аудита)
```

---

## 🔗 Связанные ресурсы

*   **SEO/GEO Skills**: `~/.openclaw/workspace/skills/` — 3 консолидированных скилла
    *   `seo-geo-auditor/` — SEO аудит + GEO 2.0 framework
    *   `traffic-growth-analytics/` — Метрика API + аналитика
    *   `content-automation-pipeline/` — Автономный контент-движок
*   **Yandex Metrika**: https://metrika.yandex.ru/
*   **Google Search Console**: https://search.google.com/search-console
*   **Яндекс.Вебмастер**: https://webmaster.yandex.ru/

---
> ✅ Версия 5.0 — Data-Driven Content Engine | 2026-04-04
> 🔄 SEO аудит каждой статьи + Metрика аналитика + Decision Engine
