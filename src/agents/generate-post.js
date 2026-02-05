#!/usr/bin/env node

import { config, validateConfig } from '../config/index.js';
import { askNvidia, askNvidiaParallel } from '../utils/nvidia.js';
import { searchExa } from '../utils/exa.js';
import { writeText, writeJson, ensureDir, readJson } from '../utils/files.js';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Research через Exa
 */
async function doResearch(topic) {
  console.log('🔍 Research через Exa...');
  
  const queries = [
    `${topic} tutorial best practices`,
    `${topic} guide how to`,
    `${topic} common issues solutions`,
  ];

  const results = [];
  for (const query of queries.slice(0, 2)) {
    const searchResults = await searchExa(query, { numResults: 3 });
    results.push(...searchResults);
  }

  console.log(`   ✅ Найдено ${results.length} источников`);
  
  return results.map(r => ({
    title: r.title,
    url: r.url,
    content: r.text?.substring(0, 1500) || '',
  }));
}

/**
 * Генерация черновика
 */
async function generateDraft(topic, context, research) {
  console.log('✍️  Генерация черновика...');

  const researchText = research.map(r => 
    `Источник: ${r.title}\n${r.content}\nURL: ${r.url}`
  ).join('\n\n---\n\n');

  const prompt = `Напиши техническую статью на тему: "${topic}"

Контекст из сессии:
${context || 'Нет дополнительного контекста'}

Исследование (для справки):
${researchText}

Требования:
1. Структура:
   - Заголовок H1
   - Введение (проблема/зачем это нужно)
   - Основная часть (пошаговое решение)
   - Практический пример (код/команды)
   - Выводы
   
2. Стиль:
   - Технический, но понятный
   - Конкретные примеры
   - Код в блоках с подсветкой
   - Личный опыт ("я настроил", "я использую")

3. Объем: 1500-2500 слов

Напиши только текст статьи без мета-информации.`;

  const draft = await askNvidia(prompt, { temperature: 0.7 });
  console.log('   ✅ Черновик создан');
  
  return draft;
}

/**
 * 4 критика для деаификации (параллельно)
 */
async function runCritics(text) {
  console.log('🧹 Запуск 4 критиков...');

  const critics = [
    {
      name: 'Шаблонные фразы',
      prompt: `Проанализируй текст и найди шаблонные фразы, которые использует AI:

Текст:
${text}

Найди:
1. "Важно отметить", "Стоит отметить"
2. "Необходимо понимать", "Следует учитывать"
3. "Как известно", "Не секрет, что"
4. "В современном мире", "В эпоху цифровизации"
5. Другие шаблонные конструкции

Верни JSON:
{
  "issues": [
    {"phrase": "фраза", "suggestion": "чем заменить или удалить"}
  ]
}`,
    },
    {
      name: 'Ритм',
      prompt: `Проанализируй ритм текста:

${text}

Найди:
1. Одинаковую длину предложений
2. Однообразное начало абзацев
3. Отсутствие коротких фраз
4. Монотонность

Верни JSON:
{
  "issues": [
    {"location": "где", "problem": "проблема", "suggestion": "как исправить"}
  ]
}`,
    },
    {
      name: 'Конкретика',
      prompt: `Проанализируй текст на конкретность:

${text}

Найди общие фразы без деталей:
1. "Улучшает производительность" (на сколько?)
2. "Данный подход эффективен" (почему?)
3. "Многие разработчики используют" (кто конкретно?)
4. Места, где нужны числа, версии, имена файлов

Верни JSON:
{
  "issues": [
    {"location": "фраза", "suggestion": "конкретизация"}
  ]
}`,
    },
    {
      name: 'Общность',
      prompt: `Проанализируй текст на наличие личного мнения:

${text}

Найди безликие фразы:
1. "Каждый выбирает сам"
2. "Зависит от ситуации"
3. "Есть плюсы и минусы"
4. "Всё индивидуально"

Верни JSON:
{
  "issues": [
    {"phrase": "общая фраза", "suggestion": "личное мнение или конкретная рекомендация"}
  ]
}`,
    },
  ];

  const results = await askNvidiaParallel(
    critics.map(c => c.prompt),
    { temperature: 0.3, maxTokens: 2000 }
  );

  const allIssues = [];
  results.forEach((result, i) => {
    if (result.error) {
      console.log(`   ❌ Критик ${critics[i].name} ошибка`);
      return;
    }
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        allIssues.push(...(data.issues || []).map(issue => ({
          ...issue,
          critic: critics[i].name,
        })));
        console.log(`   ✅ ${critics[i].name}: ${data.issues?.length || 0} проблем`);
      }
    } catch (e) {
      console.log(`   ⚠️  ${critics[i].name}: не удалось распарсить`);
    }
  });

  return allIssues;
}

/**
 * Реврайт текста с учетом правок
 */
async function rewriteText(originalText, issues) {
  console.log('🔄 Реврайт текста...');

  const issuesText = issues.map(i => 
    `- ${i.critic}: "${i.phrase || i.location}" → ${i.suggestion}`
  ).join('\n');

  const prompt = `Улучши следующий текст, исправив указанные проблемы:

ИСХОДНЫЙ ТЕКСТ:
${originalText}

ПРОБЛЕМЫ ДЛЯ ИСПРАВЛЕНИЯ:
${issuesText}

Требования:
1. Сохрани структуру и смысл
2. Исправь ВСЕ указанные проблемы
3. Добавь конкретики (числа, примеры)
4. Добавь личное мнение
5. Убери шаблонные фразы
6. Разнообразь ритм

Верни только улучшенный текст без комментариев.`;

  const rewritten = await askNvidia(prompt, { temperature: 0.6 });
  console.log('   ✅ Текст улучшен');
  
  return rewritten;
}

/**
 * Deaify - удаление "аишности"
 */
async function deaify(text, iterations = 2) {
  console.log('\n🧹 Deaify: удаление "аишности"...');

  let currentText = text;
  let currentScore = 0;

  for (let i = 0; i < iterations; i++) {
    console.log(`\n📊 Итерация ${i + 1}/${iterations}`);
    
    const issues = await runCritics(currentText);
    
    if (issues.length === 0) {
      console.log('   ✅ Проблем не найдено');
      currentScore = 5;
      break;
    }

    currentText = await rewriteText(currentText, issues);
    currentScore = Math.max(1, 5 - issues.length / 10);
    
    console.log(`   📊 Score: ${currentScore.toFixed(1)}/5`);
  }

  return {
    text: currentText,
    score: currentScore,
  };
}

/**
 * Создание HTML
 */
async function createHTML(title, content, meta = {}) {
  const date = new Date().toISOString();
  const slug = slugify(title, { lower: true, strict: true });
  
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${meta.description || title}">
  <meta name="keywords" content="${meta.tags?.join(', ') || ''}">
  <meta name="author" content="${config.site.author}">
  <meta name="date" content="${date}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${meta.description || title}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${config.site.url}/blog/${slug}">
  <meta property="article:published_time" content="${date}">
  <meta property="article:author" content="${config.site.author}">
  <meta property="article:tag" content="${meta.tags?.join(', ') || ''}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${meta.description || title}">
  
  <title>${title} | ${config.site.title}</title>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #2a2a2a; margin-top: 2rem; }
    h3 { color: #3a3a3a; }
    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code { padding: 0; background: none; }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 1rem;
      color: #666;
    }
    .meta {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .tags {
      margin-top: 2rem;
    }
    .tag {
      display: inline-block;
      background: #f0f0f0;
      padding: 0.2rem 0.6rem;
      border-radius: 3px;
      font-size: 0.85rem;
      margin-right: 0.5rem;
    }
  </style>
</head>
<body>
  <article>
    <h1>${title}</h1>
    <div class="meta">
      ${new Date(date).toLocaleDateString('ru-RU')} | 
      ${config.site.author}
    </div>
    
    ${content.split('\n').map(line => {
      if (line.startsWith('# ')) return '';
      if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
      if (line.startsWith('> ')) return `<blockquote>${line.substring(2)}</blockquote>`;
      if (line.startsWith('```')) return '';
      if (line.match(/^\d+\./)) return `<p><strong>${line}</strong></p>`;
      if (line.trim() === '') return '';
      return `<p>${line}</p>`;
    }).join('\n    ')}
    
    <div class="tags">
      ${meta.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
    </div>
  </article>
</body>
</html>`;

  return { html, slug };
}

/**
 * Создание Markdown версии
 */
async function createMarkdown(title, content, meta = {}) {
  const frontmatter = `---
title: "${title}"
description: "${meta.description || title}"
date: ${new Date().toISOString()}
author: "${config.site.author}"
tags: [${meta.tags?.map(t => `"${t}"`).join(', ') || ''}]
---

`;

  return frontmatter + content;
}

/**
 * Основная функция генерации поста
 */
async function generatePost(topic, options = {}) {
  console.log(`\n📝 Генерация статьи: "${topic}"\n`);

  validateConfig();

  // 1. Research
  const research = await doResearch(topic);

  // 2. Генерация черновика
  const draft = await generateDraft(topic, options.context, research);

  // 3. Deaify
  const deaified = await deaify(draft, config.deaify.iterations);

  // 4. Создание HTML
  const { html, slug } = await createHTML(topic, deaified.text, {
    description: options.description,
    tags: options.tags || ['vibecoding', 'claude-code'],
  });

  // 5. Создание Markdown
  const markdown = await createMarkdown(topic, deaified.text, {
    description: options.description,
    tags: options.tags || ['vibecoding', 'claude-code'],
  });

  // 6. Сохранение
  const outputDir = path.join(config.output.dir, `${new Date().toISOString().split('T')[0]}-${slug}`);
  await ensureDir(outputDir);

  await writeText(path.join(outputDir, 'index.html'), html);
  await writeText(path.join(outputDir, 'index.md'), markdown);
  await writeJson(path.join(outputDir, 'meta.json'), {
    title: topic,
    slug,
    date: new Date().toISOString(),
    score: deaified.score,
    tags: options.tags || ['vibecoding', 'claude-code'],
    researchSources: research.length,
  });

  console.log('\n✅ Статья сохранена:', outputDir);
  console.log(`   HTML: ${path.join(outputDir, 'index.html')}`);
  console.log(`   Markdown: ${path.join(outputDir, 'index.md')}`);
  console.log(`   Score: ${deaified.score.toFixed(1)}/5`);

  return {
    dir: outputDir,
    slug,
    title: topic,
    score: deaified.score,
  };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const topic = args[0] || 'Пример темы для статьи';
  
  generatePost(topic, {
    context: args.find((_, i) => args[i - 1] === '--context'),
    tags: args.find((_, i) => args[i - 1] === '--tags')?.split(','),
  }).catch(console.error);
}

export { generatePost, deaify };
export default generatePost;
