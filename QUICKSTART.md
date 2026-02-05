# 🚀 Быстрый старт

## Предварительные требования

- Node.js 18+
- npm или yarn
- Git
- Аккаунт Anthropic (Claude API)
- Аккаунт Exa (для research)
- Telegram бот (для публикации)

## Установка

### 1. Клонирование и настройка

```bash
cd sereja-blog-project
npm install
```

### 2. Настройка окружения

Создай файл `.env`:

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Exa API (для research)
EXA_API_KEY=exa-...

# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHANNEL_ID=@your_channel_name

# Пути
CLAUDE_LOGS_DIR=~/.claude/logs
OUTPUT_DIR=./output
```

### 3. Установка skills для Claude Code

```bash
# Скопируй skills в директорию Claude Code
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/
```

### 4. Создание Telegram бота

1. Напиши @BotFather в Telegram
2. Создай бота: `/newbot`
3. Получи токен (вида `123456:ABC-DEF...`)
4. Добавь бота в канал администратором
5. Укажи токен в `.env`

## Использование

### Вариант 1: Ручной запуск

```bash
# Шаг 1: Извлечь идеи из логов
claude skill blog-ideas-from-logs --output ideas.json

# Шаг 2: Создать статью
claude skill blog-post "Название темы" --output ./output/

# Шаг 3: Опубликовать в Telegram
claude skill telegram-publisher ./output/article.html
```

### Вариант 2: Автоматический режим

```bash
# Сгенерировать пост из последней сессии
npm run generate-post

# Или с указанием темы
npm run generate-post --topic="Настройка Docker"
```

### Вариант 3: Полный pipeline

```bash
# Извлечь идеи → создать статьи → опубликовать
npm run full-pipeline
```

## Структура проекта

```
sereja-blog-project/
├── skills/                 # Skills для Claude Code
│   ├── blog-ideas-from-logs/
│   ├── blog-post/
│   ├── deaify-text/
│   └── telegram-publisher/
├── website/                # Сайт на Astro
│   ├── src/
│   ├── content/blog/
│   └── public/
├── src/                    # Исходный код агентов
│   ├── agents/
│   ├── utils/
│   └── config/
├── output/                 # Сгенерированные статьи
└── docs/                   # Документация
```

## Команды

```bash
# Разработка
npm run dev              # Запустить сайт локально
npm run build            # Собрать сайт
npm run preview          # Предпросмотр сборки

# Генерация контента
npm run extract-ideas    # Извлечь идеи из логов
npm run generate-post    # Создать одну статью
npm run generate-all     # Создать статьи из всех идей

# Публикация
npm run publish-telegram # Опубликовать в Telegram
npm run deploy           # Деплой на GitHub Pages

# Тестирование
npm run test             # Запустить тесты
npm run lint             # Проверка кода
```

## Пример рабочего процесса

### 1. Сессия с Claude Code

Ты работаешь над задачей:
```
Пользователь: Настраиваю MIDI-контроллер для OBS, 
не работают LED индикаторы

Claude: Нужно отправить SysEx команду...
```

Логи сохраняются автоматически в `~/.claude/logs/`

### 2. Извлечение темы

```bash
claude skill blog-ideas-from-logs --days 1
```

Результат:
```json
[
  {
    "topic": "Настройка MIDI-контроллера Akai MPK mini для OBS",
    "complexity": 4,
    "tags": ["obs", "midi", "hardware"]
  }
]
```

### 3. Генерация статьи

```bash
claude skill blog-post "Настройка MIDI-контроллера Akai MPK mini для OBS"
```

Что происходит:
1. 🔍 Exa ищет информацию о MIDI + OBS
2. ✍️ Генерируется черновик
3. 🧹 Deaify (4 критика) улучшает текст
4. 📄 Создаётся HTML с мета-тегами

### 4. Публикация

```bash
claude skill telegram-publisher ./output/2026-02-05-midi-obs/index.html
```

Результат в Telegram:
```
📝 Настройка MIDI-контроллера Akai MPK mini для OBS

Решение проблемы с LED индикацией через SysEx команды. 
Полное руководство по интеграции с OBS...

#obs #midi #hardware

🔗 Читать: https://yourblog.com/blog/midi-obs
```

### 5. Сайт

Статья автоматически появляется на сайте:
- Главная страница
- Страница статьи
- RSS фид
- Теги

## Настройка CI/CD

### GitHub Actions

`.github/workflows/blog.yml`:

```yaml
name: Generate Blog Post
on:
  schedule:
    - cron: '0 9 * * 1'  # Каждый понедельник в 9:00
  workflow_dispatch:

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
      
      - name: Generate post
        run: npm run generate-post
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          EXA_API_KEY: ${{ secrets.EXA_API_KEY }}
      
      - name: Build site
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Отладка

### Проблема: Нет идей из логов

**Решение:**
```bash
# Проверь путь к логам
ls ~/.claude/logs/

# Укажи правильный путь
claude skill blog-ideas-from-logs --logs-dir /path/to/logs
```

### Проблема: Текст слишком "гладкий"

**Решение:**
```bash
# Увеличь итерации deaify
claude skill blog-post "Тема" --deaify-iterations 3

# Или добавь больше контекста
claude skill blog-post "Тема" --context ./session.log
```

### Проблема: Не публикуется в Telegram

**Решение:**
```bash
# Проверь токен
curl -X GET "https://api.telegram.org/bot<TOKEN>/getMe"

# Проверь права бота в канале
# Бот должен быть администратором
```

## Лучшие практики

1. **Регулярность** — генерируй статьи раз в неделю
2. **Качество > количество** — лучше 1 хорошая статья, чем 5 средних
3. **Контекст** — всегда добавляй логи сессии
4. **Проверка** — читай статью перед публикацией
5. **Связи** — добавляй ссылки на прошлые статьи

## Roadmap

- [x] Базовая структура
- [x] Извлечение идей из логов
- [x] Генерация статей
- [x] Deaify (удаление аишности)
- [x] Публикация в Telegram
- [ ] Видео-агенты
- [ ] Автогенерация превью
- [ ] Комментарии на сайте
- [ ] Аналитика просмотров

## Поддержка

Если есть вопросы:
- 📖 Документация: `./docs/`
- 💡 Примеры: `./examples/`
- 🐛 Issues: GitHub Issues

## Лицензия

MIT
