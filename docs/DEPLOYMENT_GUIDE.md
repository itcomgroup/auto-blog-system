# 📋 Deployment Guide for Server Agent

## 🎯 Цель документа

Этот документ предназначен для **серверного агента управления** (далее "Агент"). 

Агент должен:
1. Развернуть Auto Blog System на VPS сервере
2. Настроить все зависимости
3. Конфигурировать окружение
4. Запустить систему
5. Обеспечить мониторинг и логирование

**Важно:** Все действия должны выполняться через этого Агента. Прямой доступ к серверу пользователем для установки ПО запрещён.

---

## 🏗️ Архитектура развёртывания

```
Пользователь → Команды для Агента → Агент → VPS Сервер
                                                │
                                                ▼
                                      ┌─────────────────────┐
                                      │  Auto Blog System   │
                                      │  (Docker/Native)    │
                                      │                     │
                                      │  • Node.js app      │
                                      │  • Astro website    │
                                      │  • Cron jobs        │
                                      │  • Logs             │
                                      └─────────────────────┘
```

---

## 📁 Структура проекта на сервере

```
/opt/auto-blog/                      # Корневая директория
├── app/                            # Приложение
│   ├── src/                        # Исходный код
│   ├── website/                    # Сайт Astro
│   ├── output/                     # Сгенерированные статьи
│   ├── scripts/                    # Скрипты
│   ├── docs/                       # Документация
│   ├── package.json               # Зависимости Node.js
│   ├── .env                       # Конфигурация (секреты)
│   └── .env.example               # Шаблон конфигурации
│
├── data/                           # Данные
│   ├── logs/                       # Логи приложения
│   ├── articles/                   # Сохранённые статьи
│   └── backups/                    # Резервные копии
│
├── config/                         # Конфигурация системы
│   ├── nginx/                      # Nginx конфиг (если нужен)
│   ├── systemd/                    # Systemd сервисы
│   └── cron/                       # Cron задачи
│
├── docker/                         # Docker конфигурация
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── scripts/                        # Скрипты управления
│   ├── install.sh                  # Установка
│   ├── update.sh                   # Обновление
│   ├── backup.sh                   # Бэкап
│   └── health-check.sh             # Проверка здоровья
│
└── README.md                       # Этот файл
```

---

## 🔧 Требования к серверу

### Минимальные:
```yaml
OS: Ubuntu 22.04 LTS (рекомендуется) или Debian 12
RAM: 2 GB
CPU: 1 vCPU
Disk: 10 GB SSD
Network: Публичный IP, порты 80/443 (для веб)
```

### Рекомендуемые:
```yaml
OS: Ubuntu 22.04 LTS
RAM: 4 GB
CPU: 2 vCPU
Disk: 20 GB SSD
Network: Публичный IP, порты 22/80/443
```

### Необходимое ПО (установить через Агента):
- [ ] Node.js 18+ (LTS)
- [ ] npm 9+
- [ ] Git
- [ ] Nginx (опционально, для проксирования)
- [ ] Docker + Docker Compose (опционально)
- [ ] PM2 (для процессов Node.js)
- [ ] Cron (для автоматизации)

---

## 🚀 Способы развёртывания

Агент может выбрать один из способов:

### Способ 1: Docker (Рекомендуется) ⭐
**Преимущества:**
- Изоляция
- Простота обновления
- Воспроизводимость

**Минусы:**
- Требуется Docker

### Способ 2: Native (Без Docker)
**Преимущества:**
- Меньше ресурсов
- Прямой доступ к системе

**Минусы:**
- Сложнее обновлять
- Зависимости в системе

---

## 📋 Пошаговая инструкция для Агента

### ЭТАП 1: Подготовка системы

```bash
#!/bin/bash
# scripts/01-prepare-system.sh

set -e  # Остановка при ошибке

echo "=== ЭТАП 1: Подготовка системы ==="

# 1.1 Обновление системы
echo "[1/6] Обновление пакетов..."
apt-get update
apt-get upgrade -y

# 1.2 Установка базовых зависимостей
echo "[2/6] Установка базовых пакетов..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    logrotate

# 1.3 Настройка timezone
echo "[3/6] Настройка timezone..."
timedatectl set-timezone UTC

# 1.4 Создание пользователя (если нужно)
echo "[4/6] Создание пользователя autoblog..."
if ! id "autoblog" &>/dev/null; then
    useradd -m -s /bin/bash autoblog
    usermod -aG sudo autoblog
fi

# 1.5 Создание директорий
echo "[5/6] Создание директорий..."
mkdir -p /opt/auto-blog/{app,data,config,scripts,docker}
chown -R autoblog:autoblog /opt/auto-blog

# 1.6 Настройка прав
echo "[6/6] Настройка прав..."
chmod 755 /opt/auto-blog

echo "=== ЭТАП 1 ЗАВЕРШЁН ==="
```

### ЭТАП 2: Установка Node.js

```bash
#!/bin/bash
# scripts/02-install-nodejs.sh

set -e

echo "=== ЭТАП 2: Установка Node.js ==="

# 2.1 Установка через NVM (рекомендуется)
echo "[1/3] Установка NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Загрузка NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 2.2 Установка Node.js 18
echo "[2/3] Установка Node.js 18..."
nvm install 18
nvm use 18
nvm alias default 18

# 2.3 Проверка
echo "[3/3] Проверка установки..."
node --version
npm --version

echo "=== ЭТАП 2 ЗАВЕРШЁН ==="
```

### ЭТАП 3: Клонирование проекта

```bash
#!/bin/bash
# scripts/03-clone-project.sh

set -e

echo "=== ЭТАП 3: Клонирование проекта ==="

REPO_URL="https://github.com/user/auto-blog.git"  # Заменить на реальный URL
APP_DIR="/opt/auto-blog/app"

# 3.1 Клонирование
echo "[1/2] Клонирование репозитория..."
if [ -d "$APP_DIR/.git" ]; then
    echo "Репозиторий уже существует, обновляем..."
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
fi

# 3.2 Установка прав
echo "[2/2] Настройка прав..."
chown -R autoblog:autoblog /opt/auto-blog/app

echo "=== ЭТАП 3 ЗАВЕРШЁН ==="
```

### ЭТАП 4: Установка зависимостей

```bash
#!/bin/bash
# scripts/04-install-dependencies.sh

set -e

echo "=== ЭТАП 4: Установка зависимостей ==="

APP_DIR="/opt/auto-blog/app"

# 4.1 Установка основных зависимостей
echo "[1/3] Установка npm пакетов..."
cd "$APP_DIR"
npm ci --production

# 4.2 Установка зависимостей сайта
echo "[2/3] Установка зависимостей Astro..."
cd "$APP_DIR/website"
npm ci --production

# 4.3 Проверка
echo "[3/3] Проверка установки..."
cd "$APP_DIR"
npm list

echo "=== ЭТАП 4 ЗАВЕРШЁН ==="
```

### ЭТАП 5: Конфигурация

```bash
#!/bin/bash
# scripts/05-configure.sh

set -e

echo "=== ЭТАП 5: Конфигурация ==="

APP_DIR="/opt/auto-blog/app"

# 5.1 Создание .env файла
echo "[1/3] Создание конфигурации..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    echo "⚠️  ВНИМАНИЕ: Нужно отредактировать $APP_DIR/.env и добавить API ключи!"
fi

# 5.2 Создание директорий для данных
echo "[2/3] Создание директорий данных..."
mkdir -p /opt/auto-blog/data/{logs,articles,backups}
chmod 755 /opt/auto-blog/data

# 5.3 Настройка логов
echo "[3/3] Настройка логирования..."
mkdir -p /var/log/auto-blog
chown autoblog:autoblog /var/log/auto-blog

echo "=== ЭТАП 5 ЗАВЕРШЁН ==="
echo "⚠️  Не забудьте отредактировать $APP_DIR/.env!"
```

### ЭТАП 6: Настройка автозапуска

```bash
#!/bin/bash
# scripts/06-setup-autostart.sh

set -e

echo "=== ЭТАП 6: Настройка автозапуска ==="

# 6.1 Установка PM2
echo "[1/4] Установка PM2..."
npm install -g pm2

# 6.2 Создание systemd сервиса для PM2
echo "[2/4] Настройка PM2..."
cd /opt/auto-blog/app

# Запуск приложения через PM2
pm2 start npm --name "auto-blog" -- start
pm2 startup systemd
pm2 save

# 6.3 Настройка cron для автоматической генерации
echo "[3/4] Настройка cron..."
cat > /tmp/auto-blog-cron << 'EOF'
# Auto Blog System - Cron задачи

# Генерация идей каждый день в 9:00
0 9 * * * cd /opt/auto-blog/app && npm run extract-ideas >> /var/log/auto-blog/cron.log 2>&1

# Бэкап каждый день в 2:00
0 2 * * * /opt/auto-blog/scripts/backup.sh >> /var/log/auto-blog/backup.log 2>&1

# Проверка здоровья каждые 5 минут
*/5 * * * * /opt/auto-blog/scripts/health-check.sh >> /var/log/auto-blog/health.log 2>&1
EOF

crontab -u autoblog /tmp/auto-blog-cron
rm /tmp/auto-blog-cron

# 6.4 Настройка logrotate
echo "[4/4] Настройка logrotate..."
cat > /etc/logrotate.d/auto-blog << 'EOF'
/var/log/auto-blog/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 autoblog autoblog
}
EOF

echo "=== ЭТАП 6 ЗАВЕРШЁН ==="
```

### ЭТАП 7: Проверка установки

```bash
#!/bin/bash
# scripts/07-verify.sh

set -e

echo "=== ЭТАП 7: Проверка установки ==="

# 7.1 Проверка Node.js
echo "[1/6] Проверка Node.js..."
node --version || exit 1

# 7.2 Проверка npm
echo "[2/6] Проверка npm..."
npm --version || exit 1

# 7.3 Проверка структуры директорий
echo "[3/6] Проверка директорий..."
[ -d "/opt/auto-blog/app" ] || exit 1
[ -d "/opt/auto-blog/data/logs" ] || exit 1

# 7.4 Проверка конфигурации
echo "[4/6] Проверка конфигурации..."
[ -f "/opt/auto-blog/app/.env" ] || echo "⚠️  .env не найден!"

# 7.5 Проверка PM2
echo "[5/6] Проверка PM2..."
pm2 list | grep "auto-blog" || echo "⚠️  PM2 процесс не найден"

# 7.6 Проверка cron
echo "[6/6] Проверка cron..."
crontab -l | grep "auto-blog" || echo "⚠️  Cron задачи не настроены"

echo "=== ЭТАП 7 ЗАВЕРШЁН ==="
echo "✅ Установка завершена!"
echo ""
echo "Следующие шаги:"
echo "1. Отредактировать /opt/auto-blog/app/.env"
echo "2. Добавить API ключи"
echo "3. Запустить: cd /opt/auto-blog/app && npm run generate-post 'Тема'"
```

---

## 🐳 Альтернатива: Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  auto-blog:
    build:
      context: ./app
      dockerfile: ../docker/Dockerfile
    container_name: auto-blog
    restart: unless-stopped
    
    environment:
      - NODE_ENV=production
    
    env_file:
      - ./app/.env
    
    volumes:
      - ./data/logs:/app/logs
      - ./data/articles:/app/output
      - ./data/backups:/app/backups
      # Логи AI агентов (настрой под свои пути)
      - ~/.claude/logs:/app/logs/claude:ro
      - ~/.opencode/logs:/app/logs/opencode:ro
    
    networks:
      - auto-blog-network
    
    # Для Astro dev server (опционально)
    ports:
      - "127.0.0.1:4321:4321"
    
    healthcheck:
      test: ["CMD", "node", "scripts/health-check.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Опционально: Nginx для проксирования сайта
  nginx:
    image: nginx:alpine
    container_name: auto-blog-nginx
    restart: unless-stopped
    
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - ./data/articles:/usr/share/nginx/html:ro
      - ./config/nginx:/etc/nginx/conf.d:ro
    
    networks:
      - auto-blog-network
    
    depends_on:
      - auto-blog

networks:
  auto-blog-network:
    driver: bridge

volumes:
  auto-blog-data:
    driver: local
```

### Dockerfile

```dockerfile
FROM node:18-alpine

# Установка зависимостей для сборки
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# Создание пользователя
RUN addgroup -g 1001 -S autoblog && \
    adduser -S autoblog -u 1001

# Рабочая директория
WORKDIR /app

# Копирование package.json
COPY package*.json ./
COPY website/package*.json ./website/

# Установка зависимостей
RUN npm ci --production && \
    cd website && npm ci --production

# Копирование кода
COPY . .

# Права
RUN chown -R autoblog:autoblog /app

# Переключение на пользователя
USER autoblog

# Создание директорий
RUN mkdir -p logs output backups

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node scripts/health-check.js || exit 1

# Команда по умолчанию
CMD ["npm", "start"]
```

### Инструкция для Docker (для Агента):

```bash
#!/bin/bash
# scripts/deploy-docker.sh

echo "=== Развёртывание через Docker ==="

# 1. Установка Docker
curl -fsSL https://get.docker.com | sh

# 2. Установка Docker Compose
apt-get install -y docker-compose-plugin

# 3. Клонирование
mkdir -p /opt/auto-blog
cd /opt/auto-blog
git clone <REPO_URL> app

# 4. Конфигурация
cp app/.env.example .env
# ⚠️ Нужно отредактировать .env!

# 5. Запуск
docker-compose up -d

# 6. Проверка
docker-compose ps
docker-compose logs

echo "=== Docker развёртывание завершено ==="
```

---

## 🔍 Команды для управления

### Проверка статуса:
```bash
# Проверить процесс
pm2 status

# Проверить логи
tail -f /var/log/auto-blog/app.log

# Проверить cron
crontab -l

# Проверить диск
pm2 monit
```

### Обновление:
```bash
# Обновить код
cd /opt/auto-blog/app && git pull

# Перезапустить
pm2 restart auto-blog

# Или через Docker
docker-compose pull && docker-compose up -d
```

### Ручной запуск:
```bash
# От имени пользователя autoblog
su - autoblog
cd /opt/auto-blog/app

# Генерация статьи
npm run generate-post "Тема статьи"

# Проверка результата
ls -la output/
```

---

## 📝 Чек-лист для Агента

После установки проверить:

- [ ] Node.js 18+ установлен
- [ ] npm работает
- [ ] Проект склонирован в /opt/auto-blog/app
- [ ] Зависимости установлены
- [ ] .env создан и настроен (API ключи)
- [ ] PM2 процесс запущен
- [ ] Cron задачи настроены
- [ ] Логи пишутся в /var/log/auto-blog/
- [ ] Директории data созданы
- [ ] Права на файлы настроены (autoblog:autoblog)
- [ ] Тестовая генерация работает

---

## 🚨 Важные замечания

1. **API ключи:** Пользователь должен сам добавить ANTHROPIC_API_KEY в .env
2. **Логи AI:** Настроить пути к логам Claude Code / OpenCode в .env
3. **Безопасность:** .env содержит секреты, права 600
4. **Мониторинг:** Настроить алерты на ошибки в логах
5. **Бэкапы:** Автоматический backup данных ежедневно

---

## 📞 Контакты и поддержка

При возникновении проблем:
1. Проверить логи: `/var/log/auto-blog/`
2. Проверить статус: `pm2 status`
3. Перезапустить: `pm2 restart auto-blog`

---

**Документ создан:** 2026-02-05  
**Версия:** 1.0  
**Для:** Server Agent VPS Deployment
