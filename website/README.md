# Структура сайта блога

## Технологии

- **Фреймворк:** Astro (статический генератор)
- **Стили:** Tailwind CSS
- **Шрифты:** Inter (основной), JetBrains Mono (код)
- **Хостинг:** GitHub Pages / Vercel / Netlify

## Структура проекта

```
website/
├── src/
│   ├── components/          # Компоненты Astro
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── BlogCard.astro
│   │   ├── TagList.astro
│   │   └── ReadingTime.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── BlogLayout.astro
│   ├── pages/
│   │   ├── index.astro      # Главная
│   │   ├── blog/
│   │   │   ├── index.astro  # Список статей
│   │   │   └── [...slug].astro  # Статья
│   │   └── tags/
│   │       └── [tag].astro  # Статьи по тегу
│   ├── styles/
│   │   └── global.css
│   └── utils/
│       ├── date.ts
│       └── reading-time.ts
├── content/
│   └── blog/                # Markdown/MDX статьи
│       ├── 2026-01-15-midi-obs/
│       │   ├── index.md
│       │   └── images/
│       └── 2026-01-16-auto-blog/
│           ├── index.md
│           └── images/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── og-image.jpg
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Компоненты

### Header
- Логотип + название
- Навигация
- Ссылки на соцсети

### BlogCard
- Превью статьи
- Заголовок
- Дата + время чтения
- Теги
- Краткое описание

### TagList
- Облако тегов
- Счётчики статей

## Контент статьи

```markdown
---
title: "Название статьи"
description: "Краткое описание для SEO"
date: 2026-01-15
author: "Имя Автора"
tags: ["claude-code", "automation", "blog"]
cover: "./images/cover.jpg"
reading_time: 5
---

# Заголовок H1

Текст статьи...
```

## SEO

- Open Graph метатеги
- Twitter Cards
- Структурированные данные (JSON-LD)
- Sitemap.xml
- RSS фид

## Фичи

- [x] Тёмная/светлая тема
- [x] Поиск по статьям
- [x] Фильтрация по тегам
- [x] Оценка времени чтения
- [x] Поделиться в соцсетях
- [ ] Комментарии
- [ ] Новостная рассылка
