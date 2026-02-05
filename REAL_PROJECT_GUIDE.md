# 🚀 Как превратить это в РЕАЛЬНЫЙ проект

## 🎯 Главное понимание

**Auto Blog System** — это **ОТДЕЛЬНОЕ** Node.js приложение, которое:
1. Работает в обычном терминале Linux (НЕ в Claude Code!)
2. Использует Claude API (HTTP) для генерации текста
3. Читает логи из разных AI агентов (Claude Code, OpenCode, и т.д.)
4. Создаёт файлы (HTML, Markdown) локально

---

## 📊 Полная архитектура (упрощённая)

```
┌─────────────────────────────────────────────────────────┐
│  1. ПОЛЬЗОВАТЕЛЬ работает с AI агентом                 │
│     (Claude Code ИЛИ OpenCode)                          │
│     → Логи сохраняются автоматически                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼ Логи сессий
┌─────────────────────────────────────────────────────────┐
│  2. AUTO BLOG SYSTEM (Node.js)                         │
│     Работает в ОТДЕЛЬНОМ терминале!                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  extract-ideas.js                                │   │
│  │  • Читает логи из ~/.claude/logs/               │   │
│  │  • Читает логи из ~/.opencode/logs/             │   │
│  │  • Отправляет в Claude API (HTTP)               │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│                         ▼                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  generate-post.js                                │   │
│  │  • Research через Exa API                        │   │
│  │  • Генерация через Claude API                    │   │
│  │  • Создаёт output/YYYY-MM-DD-slug/index.md      │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
                          ▼ Файлы
┌─────────────────────────────────────────────────────────┐
│  3. ВЫХОДНЫЕ ФАЙЛЫ                                     │
│     • output/2026-02-05-docker/index.md               │
│     • output/2026-02-05-docker/index.html             │
│     • output/2026-02-05-docker/meta.json              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼ Копирование
┌─────────────────────────────────────────────────────────┐
│  4. САЙТ (Astro)                                        │
│     • Берёт Markdown из website/src/content/blog/     │
│     • Генерирует статический сайт в website/dist/     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼ Загрузка
┌─────────────────────────────────────────────────────────┐
│  5. ХОСТИНГ (GitHub Pages / Vercel / Netlify)          │
│     • Сайт доступен по URL                             │
│     • Индексация поисковиками                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Что нужно для запуска

### Обязательно:
1. **Node.js 18+** (у вас есть ✅)
2. **API ключ Anthropic** (Claude API) — $5/месяц минимум

### Опционально:
3. **API ключ Exa** — для research (бесплатно 1000 запросов)
4. **Telegram Bot** — для публикации в канал

---

## 🚀 Пошаговый запуск

### ШАГ 0: Получить API ключ Anthropic

```bash
# 1. Перейти на https://console.anthropic.com/
# 2. Зарегистрироваться
# 3. Пополнить баланс минимум на $5
# 4. Создать API ключ (начинается с sk-ant-...)
```

### ШАГ 1: Настроить окружение

```bash
cd /home/debian/sereja-blog-project

# Создать .env файл
cat > .env << 'EOF'
# Обязательно
ANTHROPIC_API_KEY=sk-ant-ВАШ_КЛЮЧ_ЗДЕСЬ

# Опционально (для полного функционала)
EXA_API_KEY=exa-ВАШ_КЛЮЧ_ЕСЛИ_ЕСТЬ
TELEGRAM_BOT_TOKEN=123456:ВАШ_ТОКЕН_ЕСЛИ_ЕСТЬ
TELEGRAM_CHANNEL_ID=@ВАШ_КАНАЛ

# Настройки
LOGS_SOURCES=claude,opencode
CLAUDE_LOGS_DIR=~/.claude/logs
OPENCODE_LOGS_DIR=~/.opencode/logs
SITE_URL=https://yourblog.com
AUTHOR_NAME=Ваше Имя
EOF

# Заменить ВАШ_КЛЮЧ_ЗДЕСЬ на реальный ключ!
nano .env
```

### ШАГ 2: Установить зависимости

```bash
# В папке проекта
npm install

# Должно установить:
# - @anthropic-ai/sdk
# - exa-js
# - node-telegram-bot-api
# - и другие пакеты
```

### ШАГ 3: Проверить что работает

```bash
# Запустить демо (без API ключей работает)
node scripts/demo.js

# Должно создать:
# - demo-logs/
# - output/2026-02-05-docker-rails-setup/
```

### ШАГ 4: Извлечь идеи из реальных логов

```bash
# Убедиться что есть логи
ls -la ~/.claude/logs/ 2>/dev/null || echo "Claude Code логи не найдены"
ls -la ~/.opencode/logs/ 2>/dev/null || echo "OpenCode логи не найдены"

# Запустить извлечение идей
npm run extract-ideas

# Или универсальную версию (для обоих агентов)
node src/agents/extract-ideas-universal.js

# Результат: output/ideas.json
```

### ШАГ 5: Создать статью

```bash
# Вариант А: По теме из ideas.json
npm run generate-post "Название темы из ideas.json"

# Вариант Б: По своей теме
npm run generate-post "Настройка Kubernetes кластера"

# Результат: output/YYYY-MM-DD-slug/
```

### ШАГ 6: Просмотреть статью

```bash
# Markdown версия
cat output/2026-02-05-*/index.md

# Или открыть в редакторе
nano output/2026-02-05-*/index.md

# HTML версия (если есть браузер)
firefox output/2026-02-05-*/index.html
```

### ШАГ 7: Добавить на сайт

```bash
# Копируем на сайт
cp output/2026-02-05-*/index.md website/src/content/blog/

# Или лучше — собрать сайт
cd website
npm install  # первый раз
npm run dev  # для разработки

# Открыть http://localhost:4321
```

### ШАГ 8: Опубликовать в Telegram (опционально)

```bash
# Сначала создать бота через @BotFather
# Добавить бота в канал администратором

# Потом:
npm run publish-telegram output/2026-02-05-*/
```

---

## 🆚 Claude Code vs OpenCode vs Auto Blog

| Что | Где работает | Зачем нужно |
|-----|--------------|-------------|
| **Claude Code** | Терминал | Среда разработки (IDE) с AI |
| **OpenCode** | Терминал | Альтернативная среда разработки |
| **Auto Blog** | Терминал | Отдельный инструмент для создания контента |
| **Claude API** | Облако | Используется Auto Blog для генерации текста |

**Ключевой момент:** Auto Blog запускается в ОТДЕЛЬНОМ терминале, НЕ внутри Claude Code!

---

## 🎓 Примеры использования

### Сценарий 1: Только OpenCode

```bash
# Терминал 1: Работа с OpenCode
$ opencode
# Решаешь задачу...
# Логи сохраняются в ~/.opencode/logs/

# Терминал 2: Auto Blog (ОТДЕЛЬНО!)
$ cd ~/sereja-blog-project
$ npm run extract-ideas
$ npm run generate-post "Тема из логов"
```

### Сценарий 2: Только Claude Code

```bash
# Терминал 1: Работа с Claude Code
$ claude
# Решаешь задачу...
# Логи сохраняются в ~/.claude/logs/

# Терминал 2: Auto Blog
$ cd ~/sereja-blog-project
$ npm run extract-ideas
$ npm run generate-post "Тема из логов"
```

### Сценарий 3: Оба агента

```bash
# .env
LOGS_SOURCES=claude,opencode

# Запуск
$ npm run extract-ideas-universal
# Система найдёт темы из ОБОИХ агентов!
```

---

## 💰 Стоимость

| Компонент | Стоимость | Примечание |
|-----------|-----------|------------|
| **Claude API** | ~$0.01-0.03 за статью | Зависит от длины |
| **Exa API** | $0 (1000 запросов/мес) | Бесплатный тариф |
| **Telegram Bot** | $0 | Бесплатно |
| **Хостинг** | $0 | GitHub Pages бесплатно |

**Итого:** ~$5-10/месяц если публиковать 2-3 статьи в неделю

---

## ⚠️ Частые ошибки

### Ошибка 1: "ANTHROPIC_API_KEY not found"
**Причина:** Не создан файл .env или неправильный ключ
**Решение:**
```bash
cd ~/sereja-blog-project
cp .env.example .env
nano .env  # Добавить реальный ключ
```

### Ошибка 2: "No logs found"
**Причина:** Неправильный путь к логам
**Решение:**
```bash
# Проверить где логи
ls -la ~/.claude/logs/ 2>/dev/null || ls -la ~/.opencode/logs/

# Исправить в .env
CLAUDE_LOGS_DIR=/правильный/путь
```

### Ошибка 3: "Cannot find module"
**Причина:** Не установлены зависимости
**Решение:**
```bash
cd ~/sereja-blog-project
npm install
```

### Ошибка 4: "ENOENT: no such file or directory"
**Причина:** Запуск из неправильной директории
**Решение:**
```bash
cd ~/sereja-blog-project
npm run extract-ideas  # Запускать из корня проекта!
```

---

## ✅ Чек-лист запуска

- [ ] Установлен Node.js 18+ (`node --version`)
- [ ] Получен API ключ Anthropic
- [ ] Создан файл `.env` с ключом
- [ ] Установлены зависимости (`npm install`)
- [ ] Есть логи сессий (Claude Code или OpenCode)
- [ ] Запущен `npm run extract-ideas` — работает!
- [ ] Запущен `npm run generate-post "тема"` — работает!
- [ ] Статья создана в `output/`
- [ ] Сайт запущен (`cd website && npm run dev`)

---

## 🚀 Быстрый старт (TL;DR)

```bash
# 1. Получить API ключ: https://console.anthropic.com/

# 2. Настроить
cd ~/sereja-blog-project
cp .env.example .env
# Отредактировать .env, добавить ключ

# 3. Установить
npm install

# 4. Запустить
npm run extract-ideas
npm run generate-post "Твоя тема"

# 5. Просмотреть
cat output/*/index.md

# 6. Добавить на сайт
cp output/*/index.md website/src/content/blog/
cd website && npm run dev
```

---

## 📚 Полезные ссылки

- **Anthropic Console:** https://console.anthropic.com/
- **Exa AI:** https://exa.ai/
- **Astro Docs:** https://docs.astro.build/
- **Оригинал:** https://sereja.tech/blog/vibecoder-diary/

---

**Готов начать?** Получи API ключ и запусти:

```bash
cd ~/sereja-blog-project && npm run extract-ideas
```
