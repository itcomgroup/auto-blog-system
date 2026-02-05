#!/usr/bin/env node

/**
 * ПРАКТИЧЕСКАЯ ДЕМОНСТРАЦИЯ
 * 
 * Этот скрипт показывает как работает система БЕЗ API ключей
 * и БЕЗ необходимости запуска веб-сервера
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     AUTO BLOG SYSTEM - ПРАКТИЧЕСКАЯ ДЕМОНСТРАЦИЯ       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// ==================== ШАГ 1: ПРОВЕРКА СТРУКТУРЫ ====================
console.log('📁 ШАГ 1: Проверка структуры проекта\n');

const projectDir = path.join(__dirname, '..', '..');
const structure = {
  'src/agents': ['extract-ideas.js', 'generate-post.js', 'telegram-publisher.js'],
  'src/utils': ['claude.js', 'exa.js', 'files.js'],
  'src/config': ['index.js'],
  'website/src/content/blog': [],
  'output': [],
  'docs': ['ARCHITECTURE_EXPLAINED.md', 'OPENCODE_ADAPTATION.md'],
};

console.log('Структура проекта:');
for (const [dir, files] of Object.entries(structure)) {
  const fullPath = path.join(projectDir, dir);
  const exists = fs.existsSync(fullPath);
  const icon = exists ? '✅' : '❌';
  console.log(`  ${icon} ${dir}/`);
  
  if (exists && files.length > 0) {
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const fileExists = fs.existsSync(filePath);
      console.log(`      ${fileExists ? '✓' : '✗'} ${file}`);
    }
  }
}

console.log('\n');

// ==================== ШАГ 2: ДЕМОНСТРАЦИЯ РАБОТЫ ====================
console.log('🔍 ШАГ 2: Демонстрация работы системы\n');

// Создаём демо-лог (имитация сессии с AI)
const demoLogContent = `[2026-02-05 14:30:00] Сессия начата
[USER] 
Привет! Помоги настроить Docker для Rails приложения.
У меня есть приложение на Rails 7 и я хочу упаковать его в Docker
для продакшена. Какой Dockerfile лучше использовать?

[ASSISTANT]
Привет! Отличная задача. Давай настроим Docker для Rails 7.

Вот оптимальный Dockerfile:

FROM ruby:3.2-slim

RUN apt-get update -qq && apt-get install -y \
  build-essential \
  libpq-dev \
  nodejs \
  npm

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install

COPY . .

RUN npm install && \
    npm run build

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

[USER]
Спасибо! А как настроить docker-compose.yml для разработки?

[ASSISTANT]
Вот docker-compose.yml для разработки:

version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  web:
    build: .
    command: bundle exec rails server -b 0.0.0.0
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/myapp_development

volumes:
  postgres_data:

[USER]
Отлично, работает! Ещё вопрос - как оптимизировать размер образа?

[ASSISTANT]
Для оптимизации размера используй многоэтапную сборку:

# Этап 1: Сборка
FROM ruby:3.2-slim AS builder
WORKDIR /app
COPY Gemfile* ./
RUN bundle install

# Этап 2: Финальный образ
FROM ruby:3.2-slim
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY . .
EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

Это уменьшит образ с 1.5GB до ~200MB.
`;

// Сохраняем демо-лог
const demoLogsDir = path.join(projectDir, 'demo-logs', '2026-02-05');
fs.mkdirSync(demoLogsDir, { recursive: true });
fs.writeFileSync(path.join(demoLogsDir, 'docker-rails-session.log'), demoLogContent);

console.log('✅ Создан демо-лог сессии:');
console.log(`   📄 ${path.join(demoLogsDir, 'docker-rails-session.log')}`);
console.log(`   📊 Размер: ${demoLogContent.length} символов`);
console.log(`   💬 Сообщений: 6 (3 user + 3 assistant)`);
console.log(`   🔧 Технологии: Docker, Rails, PostgreSQL\n`);

// ==================== ШАГ 3: ИЗВЛЕЧЕНИЕ ТЕМЫ ====================
console.log('📝 ШАГ 3: Извлечение темы из лога\n');

// Анализируем лог вручную (без API)
const extractedTopic = {
  topic: "Настройка Docker для Rails 7: от разработки до продакшена",
  description: "Полное руководство по контейнеризации Rails приложения с использованием Docker и docker-compose. Включает оптимизацию размера образа через многоэтапную сборку.",
  complexity: 4,
  technologies: ["docker", "rails", "postgresql", "ruby"],
  keyPoints: [
    "Создание Dockerfile для Rails",
    "Настройка docker-compose для разработки",
    "Оптимизация размера образа (1.5GB → 200MB)",
    "Многоэтапная сборка (multi-stage builds)"
  ],
  codeExamples: [
    "Dockerfile для production",
    "docker-compose.yml для разработки",
    "Оптимизированный Dockerfile с multi-stage"
  ],
  source: "demo-session",
  extractedAt: new Date().toISOString()
};

console.log('📋 Извлечённая тема:');
console.log(`   📝 ${extractedTopic.topic}`);
console.log(`   📊 Сложность: ${extractedTopic.complexity}/5`);
console.log(`   🔧 Теги: ${extractedTopic.technologies.join(', ')}`);
console.log(`   🎯 Ключевые моменты: ${extractedTopic.keyPoints.length}`);
console.log(`   💻 Примеры кода: ${extractedTopic.codeExamples.length}\n`);

// ==================== ШАГ 4: СОЗДАНИЕ СТАТЬИ ====================
console.log('✍️  ШАГ 4: Создание статьи (демо)\n');

const articleContent = `# ${extractedTopic.topic}

5 февраля 2026

${extractedTopic.description}

## Введение

Контейнеризация Rails приложений — стандарт де-факто в 2026 году. В этой статье разберём полный цикл: от базового Dockerfile до оптимизированного production-образа.

## Базовый Dockerfile

Начнём с простого Dockerfile для Rails:

\`\`\`dockerfile
FROM ruby:3.2-slim

RUN apt-get update -qq && apt-get install -y \\
  build-essential \\
  libpq-dev \\
  nodejs \\
  npm

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \\
    bundle config set --local without 'development test' && \\
    bundle install

COPY . .

RUN npm install && \\
    npm run build

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
\`\`\`

## Docker Compose для разработки

Для локальной разработки удобно использовать docker-compose:

\`\`\`yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  web:
    build: .
    command: bundle exec rails server -b 0.0.0.0
    volumes:
      - .:/app
    ports:
      - "3000:3000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/myapp_development

volumes:
  postgres_data:
\`\`\`

## Оптимизация: Multi-stage Build

Главная проблема — размер образа. Базовый вариант занимает ~1.5GB!

Решение — многоэтапная сборка:

\`\`\`dockerfile
# Этап 1: Сборка
FROM ruby:3.2-slim AS builder
WORKDIR /app
COPY Gemfile* ./
RUN bundle install

# Этап 2: Финальный образ
FROM ruby:3.2-slim
RUN apt-get update && apt-get install -y libpq5 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY . .
EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
\`\`\`

**Результат:** 1.5GB → ~200MB (в 7.5 раз меньше!)

## Выводы

1. Используйте multi-stage builds для production
2. Разделяйте конфигурации для development и production
3. Кэшируйте bundle install через правильный порядок COPY
4. Удаляйте ненужные зависимости (build-essential только для сборки)

Эти простые шаги сделают ваше Rails приложение готовым к production.

---

*Статья создана автоматически из сессии с AI*  
*Теги: #docker #rails #postgresql #ruby*
`;

// Создаём структуру выходного файла
const outputSlug = 'docker-rails-setup';
const outputDir = path.join(projectDir, 'output', `2026-02-05-${outputSlug}`);
fs.mkdirSync(outputDir, { recursive: true });

// Сохраняем Markdown
const mdPath = path.join(outputDir, 'index.md');
fs.writeFileSync(mdPath, articleContent);

// Сохраняем meta.json
const metaPath = path.join(outputDir, 'meta.json');
fs.writeFileSync(metaPath, JSON.stringify({
  title: extractedTopic.topic,
  slug: outputSlug,
  date: new Date().toISOString(),
  complexity: extractedTopic.complexity,
  tags: extractedTopic.technologies,
  source: extractedTopic.source,
  wordCount: articleContent.split(/\s+/).length,
  generatedAt: new Date().toISOString()
}, null, 2));

console.log('✅ Статья создана:');
console.log(`   📄 Markdown: ${mdPath}`);
console.log(`   📊 Размер: ${articleContent.length} символов`);
console.log(`   📝 Слов: ~${articleContent.split(/\s+/).length}`);
console.log(`   📋 Meta: ${metaPath}\n`);

// ==================== ШАГ 5: ПРОСМОТР СТАТЬИ ====================
console.log('👀 ШАГ 5: Просмотр результата\n');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║                   СТАТЬЯ ГОТОВА!                       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📖 Вы можете:');
console.log('   1. Открыть в браузере:');
console.log(`      firefox ${mdPath}`);
console.log('      ');
console.log('   2. Просмотреть в терминале:');
console.log(`      cat ${mdPath}`);
console.log('      ');
console.log('   3. Отредактировать:');
console.log(`      nano ${mdPath}`);
console.log('      ');
console.log('   4. Добавить на сайт:');
console.log(`      cp ${mdPath} website/src/content/blog/`);
console.log('      ');
console.log('   5. Открыть демо-статью (уже создана):');
console.log(`      firefox ${path.join(projectDir, 'output/demo-article/index.html')}`);
console.log('\n');

// ==================== ШАГ 6: ЧТО ДАЛЬШЕ ====================
console.log('🚀 ШАГ 6: Что дальше?\n');

console.log('Для полной автоматизации нужны API ключи:');
console.log('   1. ANTHROPIC_API_KEY - для генерации текста');
console.log('   2. EXA_API_KEY - для research (опционально)');
console.log('   3. TELEGRAM_BOT_TOKEN - для публикации (опционально)');
console.log('\n');

console.log('Без API ключей вы можете:');
console.log('   ✅ Создавать статьи вручную (как выше)');
console.log('   ✅ Использовать готовые шаблоны');
console.log('   ✅ Редактировать Markdown файлы');
console.log('   ✅ Собирать сайт на Astro (статика)');
console.log('   ❌ Автоматическую генерацию (нужен Claude API)');
console.log('   ❌ Research через Exa (нужен Exa API)');
console.log('\n');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║              ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА!                  ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📚 Полезные файлы:');
console.log('   • docs/ARCHITECTURE_EXPLAINED.md - как всё работает');
console.log('   • docs/OPENCODE_ADAPTATION.md - адаптация для OpenCode');
console.log('   • NEXT_STEPS.md - следующие шаги');
console.log('   • output/demo-article/index.html - пример статьи');
console.log('   • output/2026-02-05-docker-rails-setup/index.md - ваша новая статья\n');
