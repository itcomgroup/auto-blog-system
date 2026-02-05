# 🚀 Практическое применение: Что дальше?

## ✅ Что уже создано

### 1. Демо-статья готова!
- **Markdown:** `output/demo-article/index.md`
- **HTML:** `output/demo-article/index.html` 
- **Meta:** `output/demo-article/meta.json`
- **На сайте:** `website/src/content/blog/auto-blog-claude-code.md`

Статья основана на транскрипции видео Серёжи Риса и содержит:
- Полное описание архитектуры
- 4 компонента системы
- Примеры кода
- Практические инсайты
- SEO-оптимизацию

### 2. Структура проекта готова
```
sereja-blog-project/
├── src/agents/          # AI агенты (реализация)
├── website/             # Сайт на Astro
├── output/             # Сгенерированные статьи
└── docs/               # Документация
```

---

## 🎯 Следующие шаги для полного запуска

### Шаг 1: Получить API ключи

#### 1.1 Anthropic (Claude) - ОБЯЗАТЕЛЬНО
```bash
# Перейти на https://console.anthropic.com/
# Создать аккаунт
# Получить API ключ (начинается с sk-ant-...)
```

#### 1.2 Exa (для research) - РЕКОМЕНДУЕТСЯ
```bash
# Перейти на https://exa.ai/
# Зарегистрироваться
# Получить API ключ
# Бесплатно: 1000 запросов/месяц
```

#### 1.3 Telegram Bot - ОПЦИОНАЛЬНО
```bash
# 1. Написать @BotFather в Telegram
# 2. Отправить /newbot
# 3. Придумать название и username
# 4. Получить токен (вида: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)
# 5. Создать канал в Telegram
# 6. Добавить бота в канал администратором
# 7. Узнать ID канала (через @userinfobot)
```

### Шаг 2: Настроить окружение

```bash
cd /home/debian/sereja-blog-project

# Создать .env файл
cp .env.example .env

# Отредактировать .env:
nano .env
```

Заполнить:
```env
ANTHROPIC_API_KEY=sk-ant-ваш_ключ_здесь
EXA_API_KEY=exa-ваш_ключ_здесь
TELEGRAM_BOT_TOKEN=123456:ваш_токен
TELEGRAM_CHANNEL_ID=@ваш_канал
SITE_URL=https://вашблог.com
AUTHOR_NAME=Ваше Имя
```

### Шаг 3: Установить зависимости

```bash
# Основные зависимости
npm install

# Зависимости сайта
cd website
npm install
cd ..
```

### Шаг 4: Создать первую реальную статью

**Вариант А: Из логов Claude Code**
```bash
# 1. Извлечь идеи из логов
npm run extract-ideas -- --days 7

# 2. Посмотреть что получилось
cat output/ideas.json

# 3. Выбрать тему и создать статью
npm run generate-post "Название темы из ideas.json"
```

**Вариант Б: Из вашей темы**
```bash
# Создать статью по вашей теме
npm run generate-post "Настройка Docker для Rails приложения"
```

**Вариант В: Ручная статья (без API)**
```bash
# Создать статью вручную
cat > website/src/content/blog/my-first-post.md << 'EOF'
---
title: "Моя первая статья"
description: "Описание статьи"
date: 2026-02-05
author: "Ваше Имя"
tags: ["blog", "first"]
---

# Моя первая статья

Текст статьи здесь...
EOF
```

### Шаг 5: Запустить сайт

```bash
# Локальная разработка
cd website
npm run dev

# Открыть http://localhost:4321
```

### Шаг 6: Опубликовать в Telegram (опционально)

```bash
# Опубликовать статью
npm run publish-telegram ./output/YYYY-MM-DD-slug/

# Или все неопубликованные
npm run publish-telegram --batch
```

### Шаг 7: Деплой на хостинг

**Вариант А: GitHub Pages (бесплатно)**
```bash
# Собрать сайт
cd website
npm run build

# Создать репозиторий на GitHub
# Загрузить содержимое ./dist
# Включить GitHub Pages в настройках
```

**Вариант Б: Vercel (бесплатно)**
```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
cd website
vercel --prod
```

**Вариант В: Netlify (бесплатно)**
```bash
# Установить Netlify CLI
npm i -g netlify-cli

# Деплой
cd website
netlify deploy --prod --dir=dist
```

---

## 🔄 Автоматизация (CI/CD)

Создай `.github/workflows/blog.yml`:

```yaml
name: Auto Blog
on:
  schedule:
    - cron: '0 9 * * 1'  # Каждый понедельник в 9:00
  workflow_dispatch:     # Ручной запуск

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Extract ideas
        run: npm run extract-ideas
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      
      - name: Generate post
        run: npm run generate-post
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          EXA_API_KEY: ${{ secrets.EXA_API_KEY }}
      
      - name: Build site
        run: cd website && npm ci && npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/dist
```

---

## 💡 Практические советы

### 1. Качество статей
- Запускай `deaify` минимум 2 итерации
- Проверяй score (должен быть > 3.5)
- Читай статью перед публикацией
- Добавляй личные примеры из практики

### 2. Оптимизация затрат
- Используй Haiku для субагентов (критики)
- Ограничь Exa до 3-5 результатов
- Запускай не чаще 1-2 раз в неделю

### 3. SEO
- Используй читаемые URL (slug)
- Пиши мета-описания 150-160 символов
- Добавляй Open Graph теги
- Используй теги (3-5 на статью)

### 4. Контент
- Одна статья = одна проблема
- Добавляй код и примеры
- Используй скриншоты
- Связывай статьи между собой

---

## 📊 Ожидаемые результаты

**Через неделю:**
- 1-2 статьи в блоге
- Настроенный процесс
- Понимание системы

**Через месяц:**
- 4-8 статей
- Поисковый индекс решений
- Небольшая аудитория

**Через 3 месяца:**
- 12-20 статей
- Постоянный трафик
- Обратная связь от читателей

---

## 🆘 Частые проблемы

### Ошибка: "ANTHROPIC_API_KEY not found"
**Решение:** Проверь .env файл, ключ должен быть без кавычек

### Ошибка: "No logs found"
**Решение:** Укажи правильный путь к логам в .env (CLAUDE_LOGS_DIR)

### Статья слишком "гладкая"
**Решение:** Увеличь DEAIFY_ITERATIONS до 3 в .env

### Нет идей из логов
**Решение:** 
- Уменьши MIN_COMPLEXITY до 2
- Увеличь период (--days 30)
- Проверь что логи не пустые

---

## 🎓 Обучение

Изучи файлы в `docs/`:
- `VIDEO_TRANSCRIPT.txt` - полная транскрипция
- `TECHNICAL_DETAILS.md` - разбор технологий
- `ARCHITECTURE.md` - архитектура системы

---

**Готов начать?** Получи API ключи и запусти:

```bash
cd /home/debian/sereja-blog-project
npm install
npm run generate-post "Твоя первая тема"
```

Успехов! 🚀
