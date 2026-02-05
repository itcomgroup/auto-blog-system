# 🎥 Video-to-Article Pipeline

## 📌 Концепция

Автоматическое превращение видео в полноценную статью с дополнительными материалами.

```
Видео → Транскрибация → Анализ идеи → Поиск материалов → Полная статья
```

## 🎯 Проблема

В видео (особенно обучающем) есть **отличная идея**, но:
- ❌ Не хватает деталей реализации
- ❌ Нет примеров кода
- ❌ Нет ссылок на документацию
- ❌ Нет контекста "как это работает у других"

## ✅ Решение

Система извлекает идею из видео и **дополняет** её через research:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. ВИДЕО                                                       │
│  https://youtube.com/watch?v=...                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ Скачивание + Транскрибация
┌─────────────────────────────────────────────────────────────────┐
│  2. ТРАНСКРИБАЦИЯ                                               │
│  "Вайп-кодеры. Здорово, клодкодеры..."                          │
│  (54KB текста)                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ Анализ Claude API
┌─────────────────────────────────────────────────────────────────┐
│  3. ИЗВЛЕЧЕНИЕ ИДЕИ                                             │
│  • Тема: "Автоблог из сессий Claude Code"                       │
│  • Концепция: "Сессия → статья"                                 │
│  • Ключевые компоненты: blog-ideas, blog-post, deaify          │
│  • Проблема: Знания растворяются после сессий                   │
│  ⚠️  НО: Нет примеров кода, нет конкретики реализации          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ Поиск через Exa API
┌─────────────────────────────────────────────────────────────────┐
│  4. ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ                                    │
│  • Как реализовать парсер логов (примеры)                       │
│  • Claude API SDK документация                                  │
│  • Exa API best practices                                       │
│  • Примеры проектов на GitHub                                   │
│  • Статьи про vibe coding                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ Генерация
┌─────────────────────────────────────────────────────────────────┐
│  5. ПОЛНОЦЕННАЯ СТАТЬЯ                                          │
│  • Идея из видео                                                │
│  + Конкретный код из research                                   │
│  + Ссылки на документацию                                       │
│  + Best practices из других источников                          │
│  + Реальные примеры реализации                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Техническая реализация

### Шаг 1: Получение транскрипции

```javascript
// src/agents/video-transcriber.js

import youtubedl from 'youtube-dl-exec';
import { transcribeAudio } from '../utils/whisper.js';

async function transcribeVideo(videoUrl, options = {}) {
  console.log('🎥 Скачивание и транскрибация видео...\n');
  
  // 1. Скачиваем аудио
  const audioPath = await downloadAudio(videoUrl);
  console.log('   ✅ Аудио скачано');
  
  // 2. Транскрибируем через Whisper
  const transcript = await transcribeAudio(audioPath, {
    model: 'medium', // или 'large' для лучшего качества
    language: 'ru',  // или 'auto' для автоопределения
  });
  console.log(`   ✅ Транскрибация готова: ${transcript.length} символов`);
  
  // 3. Сохраняем
  const outputDir = createOutputDir(videoUrl);
  await writeText(`${outputDir}/transcript.txt`, transcript);
  
  // 4. Извлекаем метаданные видео
  const metadata = await getVideoMetadata(videoUrl);
  
  return {
    transcript,
    metadata,
    outputDir,
    audioPath
  };
}

async function downloadAudio(videoUrl) {
  const output = await youtubedl(videoUrl, {
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: 0,
    output: 'audio-%(id)s.%(ext)s'
  });
  
  return output;
}
```

### Шаг 2: Извлечение идеи из транскрипции

```javascript
// src/agents/extract-video-idea.js

import { askClaude } from '../utils/claude.js';

async function extractIdeaFromTranscript(transcript, metadata) {
  console.log('🧠 Извлечение идеи из транскрипции...\n');
  
  const prompt = `Проанализируй транскрипцию видео и извлеки главную идею.

Название видео: ${metadata.title}
Описание: ${metadata.description}

Транскрипция (первые 15000 символов):
${transcript.substring(0, 15000)}

Извлеки:
1. **Главная идея** (1-2 предложения)
2. **Концепция** (суть подхода/методологии)
3. **Проблема** (что решает)
4. **Решение** (как решает)
5. **Ключевые компоненты** (список)
6. **Чего НЕ ХВАТАЕТ** для реализации (что упомянуто но не раскрыто)
7. **Вопросы для research** (что нужно найти)

Ответь в формате JSON:
{
  "mainIdea": "...",
  "concept": "...",
  "problem": "...",
  "solution": "...",
  "components": ["..."],
  "missingDetails": ["..."],
  "researchQueries": ["..."]
}`;

  const response = await askClaude(prompt, { temperature: 0.3 });
  const idea = JSON.parse(extractJson(response));
  
  console.log('   ✅ Идея извлечена:', idea.mainIdea);
  console.log('   ⚠️  Не хватает:', idea.missingDetails.length, 'деталей');
  
  return idea;
}
```

### Шаг 3: Поиск дополнительных материалов

```javascript
// src/agents/research-supplements.js

import { searchExa, getExaContents } from '../utils/exa.js';

async function researchSupplements(idea, options = {}) {
  console.log('🔍 Поиск дополняющих материалов...\n');
  
  const researchResults = {
    queries: [],
    results: [],
    codeExamples: [],
    documentation: [],
    bestPractices: []
  };
  
  // 1. Поиск по запросам из идеи
  for (const query of idea.researchQueries) {
    console.log(`   Поиск: ${query}`);
    
    const results = await searchExa(query, {
      numResults: 5,
      text: true,
      startPublishedDate: '2024-01-01' // Только свежие материалы
    });
    
    researchResults.queries.push({ query, count: results.length });
    researchResults.results.push(...results);
  }
  
  // 2. Поиск примеров кода
  console.log('   Поиск примеров кода...');
  const codeQuery = `${idea.concept} implementation example code`;
  const codeResults = await searchExa(codeQuery, {
    numResults: 3,
    includeDomains: ['github.com', 'stackoverflow.com', 'dev.to']
  });
  researchResults.codeExamples = codeResults;
  
  // 3. Поиск документации
  console.log('   Поиск документации...');
  const docQuery = `${idea.components[0]} documentation tutorial`;
  const docResults = await searchExa(docQuery, {
    numResults: 3,
    text: true
  });
  researchResults.documentation = docResults;
  
  console.log(`   ✅ Найдено материалов: ${researchResults.results.length}`);
  
  return researchResults;
}
```

### Шаг 4: Генерация полноценной статьи

```javascript
// src/agents/generate-from-video.js

import { generatePost } from './generate-post.js';

async function generateArticleFromVideo(videoUrl, options = {}) {
  console.log('🎬 Video-to-Article Pipeline\n');
  console.log('=' .repeat(50));
  
  // 1. Транскрибация
  const { transcript, metadata, outputDir } = await transcribeVideo(videoUrl);
  
  // 2. Извлечение идеи
  const idea = await extractIdeaFromTranscript(transcript, metadata);
  
  // 3. Research дополнений
  const supplements = await researchSupplements(idea);
  
  // 4. Формирование полного контекста
  const fullContext = {
    video: {
      url: videoUrl,
      title: metadata.title,
      author: metadata.author,
      duration: metadata.duration
    },
    transcript: {
      full: transcript,
      summary: idea.mainIdea
    },
    idea,
    supplements
  };
  
  // 5. Генерация статьи
  console.log('\n✍️  Генерация полноценной статьи...\n');
  
  const article = await generateComprehensiveArticle(fullContext);
  
  // 6. Сохранение
  const articlePath = `${outputDir}/article.md`;
  await writeText(articlePath, article);
  
  console.log('\n✅ Статья создана!');
  console.log(`   📄 ${articlePath}`);
  console.log(`   🎥 Источник: ${metadata.title}`);
  console.log(`   📚 Дополнительных материалов: ${supplements.results.length}`);
  
  return {
    article,
    articlePath,
    context: fullContext
  };
}

async function generateComprehensiveArticle(context) {
  const prompt = `Напиши полноценную техническую статью на основе видео и дополнительных материалов.

## ИСТОЧНИК
Видео: "${context.video.title}"
Автор: ${context.video.author}
URL: ${context.video.url}

## ИДЕЯ ИЗ ВИДЕО
${context.idea.mainIdea}

Концепция: ${context.idea.concept}
Проблема: ${context.idea.problem}
Решение: ${context.idea.solution}

Компоненты:
${context.idea.components.map(c => `- ${c}`).join('\n')}

## ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ
Из research найдено:
${context.supplements.results.map(r => `- ${r.title}: ${r.url}`).join('\n')}

Примеры кода:
${context.supplements.codeExamples.map(e => `- ${e.title}`).join('\n')}

## ТРЕБОВАНИЯ К СТАТЬЕ
1. Начни с описания идеи из видео (с указанием источника)
2. Добавь недостающие детали из research
3. Включи конкретные примеры кода
4. Добавь ссылки на документацию
5. Укажи best practices из найденных материалов
6. Заверши практическими рекомендациями

Структура:
- Заголовок (привлекательный)
- Введение (откуда идея)
- Проблема (подробно)
- Решение (с деталями из research)
- Реализация (код + пояснения)
- Дополнительные материалы (ссылки)
- Выводы

Объем: 2000-3000 слов`;

  return await askClaude(prompt, { 
    temperature: 0.7,
    maxTokens: 4000 
  });
}
```

## 🎯 Пример использования

```bash
# Полный pipeline
npm run video-to-article "https://youtube.com/watch?v=BxkAfHxQ9BU"

# Или с опциями
npm run video-to-article "https://youtube.com/watch?v=..." \
  --language=ru \
  --model=large \
  --output=./articles/
```

### Что получится:

```markdown
# Как я автоматизировал блог через Claude Code

*На основе видео Серёжи Риса + дополнительные материалы*

## Введение

Вдохновлён видео "[Название]" от [Автор], где была представлена 
концепция превращения сессий с Claude Code в статьи...

## Идея из видео

[Краткое изложение концепции из транскрипции]

## Что не было раскрыто в видео

После анализа и research, вот что нужно для реализации:

### 1. Парсер логов

Пример реализации из [GitHub источник]:

\`\`\`javascript
// Код из research
\`\`\`

### 2. Интеграция с Claude API

Согласно документации [ссылка на docs.anthropic.com]:
...

## Полная реализация

[Код с пояснениями, собранный из видео + research]

## Дополнительные материалы

- [Оригинальное видео](https://...)
- [Документация Claude API](https://...)
- [Пример реализации на GitHub](https://...)
- [Статья по теме](https://...)

## Выводы

[Синтез идеи из видео с практическими материалами]
```

## 💡 Преимущества подхода

### Было (только видео):
- ❌ Идея понятна
- ❌ Нет кода
- ❌ Нет ссылок
- ❌ Нет деталей

### Стало (видео + research):
- ✅ Идея понятна
- ✅ Рабочий код
- ✅ Документация
- ✅ Best practices
- ✅ Примеры реализации

## 🔮 Расширение

### Автоматический pipeline для канала YouTube

```javascript
// Мониторинг новых видео
async function monitorYouTubeChannel(channelId) {
  // 1. Получаем новые видео
  const newVideos = await getNewVideos(channelId);
  
  for (const video of newVideos) {
    // 2. Транскрибируем
    const result = await generateArticleFromVideo(video.url);
    
    // 3. Публикуем
    await publishToBlog(result.article);
    await publishToTelegram(result.article);
  }
}
```

### Поддержка разных платформ

- **YouTube** — основной источник
- **Vimeo** — профессиональные видео
- **PeerTube** — децентрализованный
- **Локальные файлы** — mp4, mkv, avi

## 📋 План внедрения

- [ ] Интеграция youtube-dl
- [ ] Интеграция Whisper (транскрибация)
- [ ] Модуль extract-video-idea.js
- [ ] Модуль research-supplements.js
- [ ] Модуль generate-from-video.js
- [ ] CLI команда `video-to-article`
- [ ] Поддержка batch обработки (плейлисты)
- [ ] Автоматическая публикация

## 🎯 Итог

**Video-to-Article Pipeline** превращает:
- Пассивное просмотр видео → Активное создание контента
- Идеи без деталей → Полноценные гайды с кодом
- Один источник → Синтез множества материалов

**Это решает главную проблему:**
> "Посмотрел видео, идея крутая, но как реализовать — непонятно"

Теперь будет: 
> "Посмотрел видео → получил полноценную статью с кодом"
