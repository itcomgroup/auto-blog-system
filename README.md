# 🚀 Auto Blog System

Автоматическая система создания блога из сессий Claude Code. Каждая сессия становится статьёй через цепочку AI-агентов.

**Вдохновлено проектом:** [Сережа Рис](https://sereja.tech) • [Видео](https://www.youtube.com/watch?v=BxkAfHxQ9BU)

---

## ✨ Что делает система

1. 🔍 **Извлекает идеи** из реальных логов сессий Opencode CLI
2. 🤖 **Создаёт статьи** на основе реальных команд, кода и решений
3. 🧹 **Улучшает текст** через 4 параллельных критика
4. 🌐 **Создаёт сайт** на Astro с SEO-оптимизацией
5. 📱 **Публикует** в Telegram канал

**⚠️ Важно:** Система создаёт статьи из **реальных сессий работы**, а не генерирует "с потолка". Смотрите [CORRECT_WORKFLOW.md](docs/CORRECT_WORKFLOW.md)

---

## 📁 Структура проекта

```
sereja-blog-project/
├── 📂 skills/                      # Документация skills
│   ├── blog-ideas-from-logs/       # Извлечение тем
│   ├── blog-post/                  # Генерация статей
│   ├── deaify-text/                # Удаление аишности
│   └── telegram-publisher/         # Публикация в TG
├── 📂 src/                         # Исходный код
│   ├── agents/                     # AI агенты (реализация)
│   │   ├── extract-ideas.js        # Извлечение из логов
│   │   ├── generate-post.js        # Генерация статьи
│   │   ├── deaify.js               # Деаификация
│   │   └── telegram-publisher.js   # Telegram бот
│   ├── utils/                      # Утилиты
│   │   ├── claude.js               # Claude API
│   │   ├── exa.js                  # Exa API
│   │   └── files.js                # Работа с файлами
│   └── config/                     # Конфигурация
│       └── index.js                # Настройки
├── 📂 website/                     # Сайт на Astro
│   ├── src/
│   │   ├── layouts/
│   │   ├── pages/
│   │   └── content/blog/          # Статьи (Markdown)
│   └── astro.config.mjs
├── 📂 output/                      # Сгенерированные статьи
├── 📂 docs/                        # Документация
│   ├── VIDEO_TRANSCRIPT.txt        # Полная транскрипция
│   └── TECHNICAL_DETAILS.md        # Технические детали
├── 📄 README.md                    # Этот файл
├── 📄 QUICKSTART.md                # Быстрый старт
├── 📄 ARCHITECTURE.md              # Архитектура системы
├── 📄 package.json                 # Зависимости
└── 📄 .env.example                 # Пример конфигурации
```

---

## 🚀 Быстрый старт

### 1. Установка

```bash
cd sereja-blog-project
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
# Отредактируй .env и добавь API ключи
```

### 3. Настройка Telegram бота

1. Напиши [@BotFather](https://t.me/BotFather)
2. Создай бота: `/newbot`
3. Получи токен
4. Добавь бота в канал администратором
5. Укажи токен в `.env`

### 4. Первый запуск

```bash
# Извлечь идеи из логов
npm run extract-ideas

# Создать статью
npm run generate-post "Название темы"

# Опубликовать в Telegram
npm run publish-telegram ./output/YYYY-MM-DD-slug/
```

---

## 🛠 Команды

| Команда | Описание |
|---------|----------|
| `npm run extract-ideas-opencode` | Извлечь темы из логов Opencode CLI |
| `npm run generate-post "Тема"` | Создать статью из реальной сессии |
| `npm run deaify` | Улучшить текст |
| `npm run publish-telegram` | Опубликовать в TG |
| `npm run full-pipeline` | Полный цикл |
| `npm run dev` | Локальный сайт |
| `npm run build` | Собрать сайт |

### 📝 Правильный workflow

```bash
# 1. Извлечь реальные темы из сессий
npm run extract-ideas-opencode -- --days 7

# 2. Посмотреть извлечённые темы
cat output/ideas-opencode.json | jq '.ideas[].topic'

# 3. Создать статью из конкретной сессии
npm run generate-post "Название темы из JSON"
```

**Важно:** Перед генерацией убедитесь, что тема взята из реальной сессии в `~/.local/share/opencode/storage/`. Смотрите [CORRECT_WORKFLOW.md](docs/CORRECT_WORKFLOW.md)

---

## 🔧 Переменные окружения (.env)

```env
# Обязательные - NVIDIA NIM API (для MiniMax M2.1 или LLaMA)
NVIDIA_API_KEY=nvapi-...

# Опциональные (для публикации)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHANNEL_ID=@your_channel

# Настройки
SITE_URL=https://yourblog.com
SITE_TITLE=Мой Автоблог
AUTHOR_NAME=Ваше Имя
OUTPUT_DIR=./output
WEBSITE_CONTENT_DIR=./website/src/content/blog

# Путь к логам Opencode CLI (опционально)
OPENCODE_LOGS_DIR=~/.local/share/opencode/storage
```

### 📋 Требования

- **Opencode CLI** - логи работы должны быть в `~/.local/share/opencode/storage/`
- **NVIDIA API ключ** - для генерации статей через MiniMax M2.1 или LLaMA
- **Node.js 18+** и `npm`

---

## 🧠 Архитектура

```
Логи Opencode CLI
~/.local/share/opencode/storage/
       │
       ▼
┌──────────────────────┐
│ extract-ideas-       │
│ opencode.js          │
│ • Парсинг JSON       │
│ • Анализ сессий      │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ generate-post.js     │
│ • Реальные сессии    │
│ • NVIDIA API         │
│   (MiniMax/LLaMA)    │
│ • Deaify (4 критика) │
│ • HTML/MD            │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ telegram-            │
│ publisher.js         │
└────────┬─────────────┘
         │
         ▼
   📱 Telegram
   🌐 Сайт (Astro)
```

### Основные изменения v2.0:
- ✅ **Opencode CLI** вместо Claude Code
- ✅ **Реальные сессии** вместо Exa research
- ✅ **NVIDIA NIM API** (MiniMax M2.1 / LLaMA) вместо Anthropic
- ✅ **30-минутный таймаут** для больших моделей

---

## 🎯 Ключевые компоненты

### 1. blog-ideas-from-logs

Извлекает темы из логов сессий:
- Ищет паттерны: "Настроить", "Разобраться", "Исправить"
- Оценивает сложность (1-5)
- Ранжирует по полезности

**Использование:**
```bash
npm run extract-ideas -- --days 7 --min-complexity 4
```

### 2. blog-post (generate-post.js)

Создаёт статью из темы:
- 🔍 Research через Exa (3-5 источников)
- ✍️ Генерация черновика
- 🧹 Deaify (4 параллельных критика)
- 📄 HTML + Markdown + meta.json

**Использование:**
```bash
npm run generate-post "MIDI-контроллер для OBS"
```

### 3. deaify-text

Удаляет "аишность" через 4 критика:
- **Шаблонные фразы** — "Важно отметить" → удалить
- **Ритм** — варьировать длину предложений
- **Конкретика** — добавить числа, версии
- **Общность** — добавить личное мнение

**Использование:**
```bash
npm run deaify ./draft.md --output ./clean.md
```

### 4. telegram-publisher

Публикует в Telegram:
```
📝 Заголовок

Описание...

#тег1 #тег2

🔗 Читать полностью: ссылка
```

**Использование:**
```bash
npm run publish-telegram ./output/article/
```

---

## 🌐 Сайт на Astro

- ⚡️ Статический генератор
- 🎨 Тёмная/светлая тема
- 📱 Адаптивный дизайн
- 🔍 SEO оптимизация
- 📡 RSS фид
- 🏷️ Теги

**Разработка:**
```bash
cd website
npm install
npm run dev
```

**Деплой:**
```bash
npm run build  # Собрать в ./dist
# Загрузить на GitHub Pages / Vercel / Netlify
```

---

## 📊 Пример workflow

### Ручной режим

```bash
# 1. Работаешь с Claude Code (решение задачи)
# Логи автоматически сохраняются

# 2. Извлекаешь идеи
npm run extract-ideas
# → Сохраняется в output/ideas.json

# 3. Выбираешь тему и создаёшь статью
npm run generate-post "Настройка Docker для Rails"
# → Сохраняется в output/2026-02-05-docker-rails/

# 4. Публикуешь
npm run publish-telegram ./output/2026-02-05-docker-rails/

# 5. Копируешь на сайт
cp ./output/2026-02-05-docker-rails/index.md ./website/src/content/blog/
```

### Автоматический режим (планируется)

```bash
npm run full-pipeline
```

---

## 📝 Структура статьи

```markdown
---
title: "Название статьи"
description: "Описание для SEO"
date: 2026-02-05
author: "Имя Автора"
tags: ["docker", "rails", "devops"]
---

# Заголовок H1

Введение — проблема и зачем это нужно.

## Основная часть

Пошаговое решение с примерами кода.

## Практический пример

```bash
# Команды
```

## Выводы

Личное мнение и рекомендации.
```

---

## 🎓 Учебные материалы

В папке `docs/`:
- 📄 `VIDEO_TRANSCRIPT.txt` — полная транскрипция видео (54KB)
- 📄 `TECHNICAL_DETAILS.md` — разбор из транскрипции
- 📄 `ARCHITECTURE.md` — архитектура системы
- 📄 `QUICKSTART.md` — подробное руководство

---

## 🚧 Roadmap

- [x] Базовая структура проекта
- [x] Реализация extract-ideas.js
- [x] Реализация generate-post.js
- [x] Реализация deaify.js (4 критика)
- [x] Реализация telegram-publisher.js
- [x] Сайт на Astro
- [x] RSS фид
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Автогенерация превью (Open Graph)
- [ ] Видео-агенты
- [ ] Комментарии на сайте

---

## 🤝 Вклад в проект

1. Форкни репозиторий
2. Создай ветку: `git checkout -b feature/amazing-feature`
3. Закоммить: `git commit -m 'Add amazing feature'`
4. Запушь: `git push origin feature/amazing-feature`
5. Открой Pull Request

---

## 📚 Источники

- [Дневник вайбкодера](https://www.sereja.tech/blog/vibecoder-diary/) — статья Серёжи
- [ris-claude-code](https://github.com/serejaris/ris-claude-code) — GitHub skills
- [Learn in Public](https://www.swyx.io/learn-in-public) — концепция
- [Claude Code Docs](https://docs.anthropic.com/en/docs/claude-code)

---

## 📄 Лицензия

MIT License — свободное использование

---

**Создано с ❤️ на основе опыта Серёжи Риса**
