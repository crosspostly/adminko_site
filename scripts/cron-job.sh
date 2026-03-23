#!/bin/bash

# Находим путь к проекту
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$PROJECT_DIR"

# Загружаем окружение Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "--- [$(date)] START AUTO-GENERATION ---" >> logs/cron.log

# 1. Запуск оркестратора (Генерация + Индекс + Sync UI)
/home/varsmana/.nvm/versions/node/v22.22.0/bin/node scripts/content-orchestrator.js >> logs/cron.log 2>&1

# 2. Автоматический пуш на GitHub (чтобы статьи не терялись)
git add .
git commit -m "auto: periodic blog update $(date +'%Y-%m-%d %H:%M')"
git push origin HEAD >> logs/cron.log 2>&1

# 3. Сброс кэша сервера
sudo systemctl reload nginx

echo "--- [$(date)] END AUTO-GENERATION ---" >> logs/cron.log
