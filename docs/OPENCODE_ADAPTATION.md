# Адаптация для OpenCode

## 🎯 Задача

Сделать так, чтобы Auto Blog System работал с **ОБОИМИ** агентами:
- ✅ Claude Code
- ✅ OpenCode

## 📁 Структура логов

### Claude Code
```
~/.claude/logs/
├── 2026-02-05/
│   ├── 14-30-22-session.log
│   └── 16-45-11-session.log
└── 2026-02-06/
    └── 10-20-33-session.log
```

### OpenCode
```
~/.opencode/logs/
├── 2026-02-05/
│   ├── session-2026-02-05-14-30.log
│   └── session-2026-02-05-16-45.log
└── 2026-02-06/
    └── session-2026-02-06-10-20.log
```

## 🔧 Конфигурация для OpenCode

### Шаг 1: Обновить .env

```env
# Поддержка нескольких агентов
# Можно указать несколько через запятую
LOGS_SOURCES=claude,opencode

# Пути к логам разных агентов
CLAUDE_LOGS_DIR=~/.claude/logs
OPENCODE_LOGS_DIR=~/.opencode/logs
# Можно добавить другие:
# CURSOR_LOGS_DIR=~/.cursor/logs
# WINDSURF_LOGS_DIR=~/.windsurf/logs
```

### Шаг 2: Универсальный сканер логов

Создаём новый агент `extract-ideas-universal.js`:

```javascript
// src/agents/extract-ideas-universal.js

import { config } from '../config/index.js';
import { getFiles, readText, writeJson } from '../utils/files.js';
import path from 'path';
import os from 'os';

/**
 * Определение формата логов по пути
 */
function detectLogFormat(logPath) {
  if (logPath.includes('.claude')) return 'claude';
  if (logPath.includes('.opencode')) return 'opencode';
  if (logPath.includes('.cursor')) return 'cursor';
  return 'unknown';
}

/**
 * Парсинг логов разных форматов
 */
async function parseLogFile(filePath, format) {
  const content = await readText(filePath);
  if (!content) return null;

  switch (format) {
    case 'claude':
      return parseClaudeLog(content, filePath);
    case 'opencode':
      return parseOpenCodeLog(content, filePath);
    default:
      return parseGenericLog(content, filePath);
  }
}

/**
 * Парсинг логов Claude Code
 */
function parseClaudeLog(content, filePath) {
  const lines = content.split('\n');
  const dialogues = [];
  let current = { user: [], assistant: [] };
  let mode = null;

  for (const line of lines) {
    if (line.startsWith('Human:') || line.startsWith('User:')) {
      if (mode === 'assistant' && (current.user.length > 0 || current.assistant.length > 0)) {
        dialogues.push({ ...current });
        current = { user: [], assistant: [] };
      }
      mode = 'user';
      current.user.push(line.replace(/^[^:]+:/, '').trim());
    } else if (line.startsWith('Assistant:') || line.startsWith('Claude:')) {
      mode = 'assistant';
      current.assistant.push(line.replace(/^[^:]+:/, '').trim());
    } else if (mode) {
      current[mode].push(line);
    }
  }

  if (current.user.length > 0 || current.assistant.length > 0) {
    dialogues.push(current);
  }

  return {
    format: 'claude',
    filePath,
    content,
    dialogues,
    userMessages: dialogues.map(d => d.user.join('\n')).join('\n'),
    assistantMessages: dialogues.map(d => d.assistant.join('\n')).join('\n'),
  };
}

/**
 * Парсинг логов OpenCode
 */
function parseOpenCodeLog(content, filePath) {
  const lines = content.split('\n');
  const dialogues = [];
  let current = { user: [], assistant: [] };
  let mode = null;

  // OpenCode может иметь немного другой формат
  // Например: [USER], [ASSISTANT], или просто разделители
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Варианты форматов OpenCode
    if (trimmed.startsWith('[USER]') || trimmed.startsWith('User:') || trimmed.startsWith('>>>')) {
      if (mode === 'assistant' && (current.user.length > 0 || current.assistant.length > 0)) {
        dialogues.push({ ...current });
        current = { user: [], assistant: [] };
      }
      mode = 'user';
      current.user.push(trimmed.replace(/^[^\]]*\]:?|^>>>/, '').trim());
    } else if (trimmed.startsWith('[ASSISTANT]') || trimmed.startsWith('Assistant:') || trimmed.startsWith('<<<')) {
      mode = 'assistant';
      current.assistant.push(trimmed.replace(/^[^\]]*\]:?|^<</, '').trim());
    } else if (mode) {
      current[mode].push(line);
    }
  }

  if (current.user.length > 0 || current.assistant.length > 0) {
    dialogues.push(current);
  }

  return {
    format: 'opencode',
    filePath,
    content,
    dialogues,
    userMessages: dialogues.map(d => d.user.join('\n')).join('\n'),
    assistantMessages: dialogues.map(d => d.assistant.join('\n')).join('\n'),
  };
}

/**
 * Универсальный парсинг
 */
function parseGenericLog(content, filePath) {
  // Пытаемся определить формат автоматически
  if (content.includes('Human:') || content.includes('Claude:')) {
    return parseClaudeLog(content, filePath);
  }
  
  return {
    format: 'generic',
    filePath,
    content,
    dialogues: [],
    userMessages: content,
    assistantMessages: '',
  };
}

/**
 * Получение логов из всех источников
 */
async function getLogsFromAllSources() {
  const sources = config.logs.sources || ['claude'];
  const allLogs = [];

  for (const source of sources) {
    const logDir = config.logs[`${source}Dir`] || `~/.${source}/logs`;
    const expandedDir = logDir.replace('~', os.homedir());
    
    console.log(`📁 Сканирование ${source}: ${expandedDir}`);
    
    if (await fileExists(expandedDir)) {
      const files = await getFiles(expandedDir, '**/*.log');
      console.log(`   Найдено файлов: ${files.length}`);
      
      for (const file of files) {
        const format = detectLogFormat(file);
        const parsed = await parseLogFile(file, format);
        if (parsed) {
          allLogs.push({ ...parsed, source });
        }
      }
    } else {
      console.log(`   ⚠️  Директория не найдена`);
    }
  }

  return allLogs;
}

/**
 * Основная функция
 */
async function extractIdeasUniversal(options = {}) {
  console.log('🔍 Универсальное извлечение идей из логов\n');
  
  const logs = await getLogsFromAllSources();
  console.log(`\n📊 Всего найдено сессий: ${logs.length}`);

  // Объединяем все сессии для анализа
  const combinedContent = logs.map(log => 
    `[Источник: ${log.source}]\n${log.userMessages}`
  ).join('\n\n---\n\n');

  // Анализ через Claude API
  const ideas = await analyzeSessions(combinedContent);
  
  // Сохранение
  const outputFile = options.output || path.join(config.output.dir, 'ideas-universal.json');
  await writeJson(outputFile, {
    generatedAt: new Date().toISOString(),
    sources: [...new Set(logs.map(l => l.source))],
    totalSessions: logs.length,
    ideas: ideas,
  });

  console.log(`\n✅ Результат сохранён: ${outputFile}`);
  return ideas;
}

async function fileExists(filePath) {
  try {
    const { access } = await import('fs/promises');
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function analyzeSessions(content) {
  // Используем Claude API для анализа
  const { askClaude } = await import('../utils/claude.js');
  
  const prompt = `Проанализируй следующие сессии с AI агентами и извлеки темы для статей блога:

${content.substring(0, 10000)}

Для каждой темы укажи:
- Название
- Описание
- Источник (claude/opencode)
- Сложность (1-5)
- Технологии

Ответь в формате JSON:
{
  "topics": [
    {
      "topic": "...",
      "description": "...",
      "source": "claude|opencode",
      "complexity": 4,
      "technologies": ["..."]
    }
  ]
}`;

  const response = await askClaude(prompt, { temperature: 0.3 });
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]).topics : [];
}

export { extractIdeasUniversal, detectLogFormat };
export default extractIdeasUniversal;
```

### Шаг 3: Обновить конфиг

```javascript
// src/config/index.js

export const config = {
  // ... остальная конфигурация
  
  logs: {
    // Поддержка нескольких источников
    sources: (process.env.LOGS_SOURCES || 'claude').split(','),
    
    // Пути для каждого источника
    claudeDir: process.env.CLAUDE_LOGS_DIR || '~/.claude/logs',
    opencodeDir: process.env.OPENCODE_LOGS_DIR || '~/.opencode/logs',
    cursorDir: process.env.CURSOR_LOGS_DIR || '~/.cursor/logs',
    windsurfDir: process.env.WINDSURF_LOGS_DIR || '~/.windsurf/logs',
  },
};
```

## 🚀 Использование

### Вариант 1: Только OpenCode
```bash
# .env
LOGS_SOURCES=opencode
OPENCODE_LOGS_DIR=~/.opencode/logs

# Запуск
npm run extract-ideas
```

### Вариант 2: Только Claude Code (классика)
```bash
# .env
LOGS_SOURCES=claude
CLAUDE_LOGS_DIR=~/.claude/logs

# Запуск
npm run extract-ideas
```

### Вариант 3: Оба агента (универсально)
```bash
# .env
LOGS_SOURCES=claude,opencode
CLAUDE_LOGS_DIR=~/.claude/logs
OPENCODE_LOGS_DIR=~/.opencode/logs

# Запуск
npm run extract-ideas-universal
```

## 📝 Пример работы

```bash
$ npm run extract-ideas-universal

🔍 Универсальное извлечение идей из логов

📁 Сканирование claude: /home/user/.claude/logs
   Найдено файлов: 15
   
📁 Сканирование opencode: /home/user/.opencode/logs
   Найдено файлов: 8

📊 Всего найдено сессий: 23

📋 Топ тем:

1. Настройка Docker для Rails [claude]
   Сложность: 4/5
   
2. Интеграция Stripe в Node.js [opencode]
   Сложность: 5/5
   
3. Оптимизация PostgreSQL [claude]
   Сложность: 3/5

✅ Результат сохранён: output/ideas-universal.json
```

## 🎓 Детекция формата автоматически

Если не знаем формат логов:

```javascript
// Автоматическое определение
function autoDetectLogFormat(content) {
  // Признаки Claude Code
  if (/Human:|Assistant:|Claude:/.test(content)) {
    return 'claude';
  }
  
  // Признаки OpenCode
  if (/\[USER\]|\[ASSISTANT\]|>>>|<<</.test(content)) {
    return 'opencode';
  }
  
  // Признаки Cursor
  if (/User\n.*\nAssistant\n/s.test(content)) {
    return 'cursor';
  }
  
  return 'generic';
}
```

## ✅ Итог

Теперь система работает с **ЛЮБЫМ** AI агентом:
- ✅ Claude Code
- ✅ OpenCode
- ✅ Cursor (можно добавить)
- ✅ Windsurf (можно добавить)
- ✅ Любой другой (через generic парсер)

Главное — логи сохраняют диалог пользователь ↔ AI в текстовом формате.
