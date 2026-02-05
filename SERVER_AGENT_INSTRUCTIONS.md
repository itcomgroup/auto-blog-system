# Инструкции для Server Agent

Эта документация предназначена для server agent, который будет развертывать Auto Blog System на сервере.

---

## 📋 Обзор проекта

**Название:** Auto Blog System с NVIDIA NIM API  
**Тип:** Автоматизация генерации контента для блога  
**Технологии:** Node.js 18+, NVIDIA NIM API, Exa API, LLaMA 3.1 405B, Docker (опционально)

**Бесплатные лимиты:**
- NVIDIA: 5,000 запросов/день
- NVIDIA: 250,000 токенов/день
- Хватит на 25-50 статей/день

---

## 🚀 Развертывание

### Вариант A: Docker (рекомендуется)

#### 1. Клонирование репозитория

```bash
git clone https://github.com/YOUR_USERNAME/auto-blog-system.git
cd auto-blog-system
```

#### 2. Создание .env файла

```bash
cp .env.example .env
```

#### 3. Настройка .env

```bash
nano .env
```

Добавить API ключи:
```bash
# API Keys
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXA_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Settings
OUTPUT_DIR=/opt/auto-blog/output
WEBSITE_CONTENT_DIR=/opt/auto-blog/website/src/content/blog
SITE_URL=https://yourblog.com
AUTHOR_NAME=Your Name
```

⚠️ **ВАЖНО:** Не коммитить .env в Git!

#### 4. Запуск через Docker Compose

```bash
cd docker
docker-compose up -d
```

#### 5. Проверка состояния

```bash
docker-compose ps
docker-compose logs -f app
```

---

### Вариант B: Нативная установка (через install.sh)

#### 1. Клонирование репозитория

```bash
git clone https://github.com/YOUR_USERNAME/auto-blog-system.git
cd auto-blog-system
```

#### 2. Запуск установочного скрипта

```bash
bash scripts/install.sh
```

Скрипт автоматически:
- Создаёт пользователя `autoblog`
- Устанавливает Node.js 18+
- Устанавливает зависимости
- Настраивает PM2
- Настраивает cron
- Настраивает logrotate

#### 3. Настройка .env

```bash
sudo -u autoblog nano /opt/auto-blog/app/.env
```

Добавить API ключи (см. выше)

#### 4. Перезапуск сервиса

```bash
sudo -u autoblog pm2 restart auto-blog
```

---

## 🔐 Безопасность API ключей

### 1. Проверка прав доступа

```bash
ls -la .env
# Должно быть: -rw------- (600)
```

Если не 600:
```bash
chmod 600 .env
```

### 2. Проверка .gitignore

```bash
cat .gitignore | grep .env
```

Если нет — добавить в .gitignore

### 3. Проверка на утечки

```bash
bash scripts/check-api-security.sh
```

---

## 🧪 Тестирование

### Тест NVIDIA API

```bash
node scripts/test-nvidia.js
```

Ожидаемый результат:
```
🧪 Тестирование NVIDIA API...
✅ Конфигурация загружена
✅ Успешно!
🎉 NVIDIA API работает корректно!
```

### Тест генерации статьи

```bash
npm run generate-post "Тестовая статья"
```

---

## 📊 Мониторинг

### Проверка здоровья

```bash
bash scripts/health-check.sh
```

Проверяет:
- Дисковое пространство
- Память
- Процессы
- API ключи
- Логи на ошибки

### Просмотр логов

#### Для Docker:
```bash
docker-compose logs -f app
```

#### Для нативной установки:
```bash
pm2 logs auto-blog
```

### Логи приложения

```bash
tail -f /var/log/auto-blog/app.log
tail -f /var/log/auto-blog/error.log
```

---

## 🔄 Обновление

### Вариант A: Docker

```bash
cd docker
git pull
docker-compose down
docker-compose pull
docker-compose up -d
```

### Вариант B: Нативная установка

```bash
cd /opt/auto-blog/app
git pull
npm install
sudo -u autoblog pm2 restart auto-blog
```

---

## 💾 Резервное копирование

```bash
bash scripts/backup.sh
```

Автоматически:
- Архивирует статьи
- Архивирует логи
- Архивирует конфигурацию
- Хранит последние 30 дней

---

## 🛠️ Решение проблем

### Проблема: Ошибка 401 от NVIDIA API

**Причина:** Неверный API ключ

**Решение:**
```bash
grep NVIDIA_API_KEY .env
# Убедитесь, что ключ начинается с nvapi-
```

### Проблема: Ошибка npm install

**Решение:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Проблема: PM2 не запускается

**Решение:**
```bash
pm2 list
pm2 restart auto-blog
pm2 logs auto-blog
```

### Проблема: Нет прав на запись

**Решение (только для нативной установки):**
```bash
sudo chown -R autoblog:autoblog /opt/auto-blog
```

---

## 📈 Масштабирование

### Добавление cron задачи

```bash
sudo -u autoblog crontab -e
```

Пример:
```bash
# Генерация статьи каждый день в 10:00
0 10 * * * cd /opt/auto-blog/app && npm run generate-post "Автоматическая тема" >> /var/log/auto-blog/cron.log 2>&1
```

### Настройка Telegram публикации

```bash
nano .env
```

Добавить:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=@your_channel
```

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте логи
2. Запустите health check
3. Проверьте API ключи
4. Протестируйте NVIDIA API
5. Свяжитесь с администратором

---

## ✅ Чек-лист после развертывания

- [ ] .env файл создан с правильными API ключами
- [ ] .env имеет права доступа 600
- [ ] npm install прошёл успешно
- [ ] node scripts/test-nvidia.js работает
- [ ] npm run generate-post "Тест" работает
- [ ] PM2 процесс запущен (для нативной установки) или Docker контейнер работает
- [ ] bash scripts/health-check.sh проходит без ошибок
- [ ] .env НЕ в Git репозитории (проверить .gitignore)
- [ ] Бэкап настроен (опционально)

---

**Версия:** 1.0.0  
**Дата:** 2025-02-05  
**Статус:** ✅ Готов к production
