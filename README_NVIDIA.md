# Auto Blog System - NVIDIA Integration

🚀 **Универсальная система автоматизации блога с использованием NVIDIA NIM API**

## 📋 Что готово

✅ NVIDIA NIM API интегрирован  
✅ Модель: `meta/llama-3.1-405b-instruct` (405 миллиардов параметров)  
✅ Exa API для поиска (ключ уже есть)  
✅ Все агенты адаптированы  
✅ Тестовый скрипт готов  

---

## 🎯 Возможности

### Автоматическая генерация статей

1. **Извлечение идей** из логов Claude Code/OpenCode
2. **Research** через Exa (поиск актуальной информации)
3. **Генерация черновика** статьи
4. **Deaify** — удаление "аишности" текста (4 критика параллельно)
5. **Форматирование** в HTML и Markdown
6. **Публикация** в Telegram

### Используемые модели

| Модель | Параметры | Для чего |
|--------|-----------|----------|
| `meta/llama-3.1-405b-instruct` | 405B | Генерация статей (максимальное качество) |
| `meta/llama-3.1-70b-instruct` | 70B | Быстрая генерация (опционально) |

---

## 🔧 Установка

### 1. Клонирование проекта

```bash
git clone <repo-url>
cd sereja-blog-project
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка `.env` файла

```bash
# .env уже настроен с NVIDIA API ключом
# NVIDIA_API_KEY=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
# EXA_API_KEY=dc2820df-89a6-4500-a5c7-97809566cc81
```

### 4. Тестирование NVIDIA API

```bash
node scripts/test-nvidia.js
```

---

## 📝 Использование

### Генерация статьи из темы

```bash
npm run generate-post "Тема статьи"
```

**Пример:**
```bash
npm run generate-post "Как настроить Docker для Rails приложений"
```

**Опции:**
- `--context "контекст"` — добавить дополнительный контекст
- `--tags tag1,tag2,tag3` — указать теги

### Извлечение идей из логов

```bash
npm run extract-ideas
```

**Опции:**
- `--days 7` — анализировать последние N дней
- `--min-complexity 3` — минимальная сложность тем (1-5)
- `--output output/ideas.json` — путь для сохранения

### Деаификация текста (удаление "аишности")

```bash
npm run deaify input.txt --output output.txt --iterations 2
```

### Публикация в Telegram

```bash
# Одна статья
npm run publish-telegram output/2025-01-01-article-name

# Массовая публикация
npm run publish-telegram --batch output
```

---

## 🎨 Структура проекта

```
sereja-blog-project/
├── src/
│   ├── agents/              # Агенты генерации
│   │   ├── extract-ideas.js    # Извлечение идей из логов
│   │   ├── generate-post.js    # Генерация статей
│   │   ├── deaify.js            # Удаление "аишности"
│   │   └── telegram-publisher.js  # Публикация в Telegram
│   ├── utils/               # Утилиты
│   │   ├── nvidia.js            # NVIDIA NIM API клиент
│   │   ├── exa.js               # Exa API клиент
│   │   └── files.js             # Файловые операции
│   └── config/              # Конфигурация
│       └── index.js             # Главная конфигурация
├── scripts/                 # Скрипты
│   ├── install.sh              # Установка на сервер
│   ├── health-check.sh         # Проверка здоровья
│   ├── backup.sh               # Резервное копирование
│   └── test-nvidia.js          # Тест NVIDIA API
├── docker/                  # Docker конфигурация
│   ├── Dockerfile
│   └── docker-compose.yml
├── output/                  # Результаты работы
│   └── 2025-01-01-article-name/
│       ├── index.html           # HTML статья
│       ├── index.md             # Markdown статья
│       └── meta.json             # Метаданные
└── .env                     # Переменные окружения
```

---

## 💰 Стоимость (бесплатно!)

**NVIDIA NIM Free Tier:**
- 5,000 запросов/день
- 250,000 токенов/день
- Лимиты обновляются **каждый день**

**Сколько статей:**
- 1 статья ≈ 5,000-10,000 токенов
- Хватит на **25-50 статей в день**
- Бесплатно!

---

## 🔒 Безопасность API ключей

### Текущий статус

- ✅ NVIDIA API ключ добавлен в `.env`
- ⚠️ `.env` файл **НЕ** добавлен в `.gitignore`
- ⚠️ `.env` файл имеет стандартные права доступа

### Рекомендуемые действия

```bash
# 1. Добавить .env в .gitignore
echo ".env" >> .gitignore

# 2. Ограничить права доступа к .env
chmod 600 .env

# 3. Проверить безопасность
bash scripts/check-api-security.sh
```

---

## 🚀 Развертывание на сервере

### Через Docker (рекомендуется)

```bash
# Клонировать проект на сервер
git clone <repo-url>
cd sereja-blog-project

# Запуск через docker-compose
cd docker
docker-compose up -d

# Проверка состояния
docker-compose ps
docker-compose logs -f app
```

### Нативная установка

```bash
# Запуск установочного скрипта
bash scripts/install.sh

# Проверка здоровья
bash scripts/health-check.sh
```

---

## 📊 Мониторинг

### Проверка логов

```bash
# PM2 логи
pm2 logs auto-blog

# Логи приложения
tail -f /var/log/auto-blog/app.log

# Ошибки
tail -f /var/log/auto-blog/error.log
```

### Статистика использования

```bash
# Количество сгенерированных статей
ls output/ | wc -l

# Размер базы данных
du -sh output/

# Последние статьи
ls -lt output/ | head -10
```

---

## 🎯 Примеры использования

### 1. Генерация статьи из идеи

```bash
npm run generate-post "Как использовать Claude Code для автоматизации рутинных задач" \
  --context "Из личного опыта: я использовал Claude Code для рефакторинга кодовой базы и сэкономил 2 дня работы" \
  --tags "claude-code,automation,productivity"
```

### 2. Извлечение идей за неделю

```bash
npm run extract-ideas --days 7 --min-complexity 4 --output output/ideas-week.json
```

### 3. Деаификация статьи

```bash
npm run deaify output/draft.txt --output output/final.txt --iterations 3
```

---

## 🔧 Конфигурация

### Модель NVIDIA

Изменить в `src/config/index.js`:

```javascript
nvidia: {
  model: 'meta/llama-3.1-405b-instruct',  // Для максимального качества
  // или
  model: 'meta/llama-3.1-70b-instruct',   // Для скорости
  maxTokens: 4096,
}
```

### Директории

В `.env` файле:

```bash
OUTPUT_DIR=./output
WEBSITE_CONTENT_DIR=./website/src/content/blog
CLAUDE_LOGS_DIR=~/.claude/logs
OPENCODE_LOGS_DIR=~/.opencode/logs
```

---

## 🐛 Решение проблем

### NVIDIA API ошибка 401

```bash
# Проверить ключ
grep NVIDIA_API_KEY .env

# Проверить формат (должен начинаться с nvapi-)
```

### Exa API ошибка

```bash
# Проверить ключ
grep EXA_API_KEY .env

# Ключ уже должен быть настроен: dc2820df-89a6-4500-a5c7-97809566cc81
```

### npm install ошибки

```bash
# Очистить кеш
npm cache clean --force

# Переустановить
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Дополнительная документация

- [Архитектура системы](docs/ARCHITECTURE.md)
- [Руководство по развертыванию](docs/DEPLOYMENT_GUIDE.md)
- [Безопасность API ключей](docs/API_SECURITY.md)
- [Агент README](docs/AGENT_README.md)

---

## 🤝 Поддержка

Если возникли проблемы:

1. Проверьте логи: `pm2 logs auto-blog`
2. Запустите health check: `bash scripts/health-check.sh`
3. Проверьте API ключи: `bash scripts/check-api-security.sh`
4. Протестируйте NVIDIA API: `node scripts/test-nvidia.js`

---

## 📄 Лицензия

MIT

---

**Версия:** 1.0.0  
**Модель:** meta/llama-3.1-405b-instruct  
**Статус:** ✅ Готов к использованию
