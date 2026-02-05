#!/usr/bin/env node

import { config, validateConfig } from '../config/index.js';
import { askNvidia } from '../utils/nvidia.js';
import { getFiles, writeJson, readText, ensureDir } from '../utils/files.js';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Парсинг логов Claude Code
 */
async function parseLogFile(filePath) {
  const content = await readText(filePath);
  if (!content) return null;

  // Извлечение диалогов
  const lines = content.split('\n');
  const dialogues = [];
  let currentDialogue = [];
  
  for (const line of lines) {
    if (line.includes('Human:') || line.includes('User:')) {
      if (currentDialogue.length > 0) {
        dialogues.push(currentDialogue.join('\n'));
      }
      currentDialogue = [line];
    } else if (line.includes('Assistant:') || line.includes('Claude:')) {
      currentDialogue.push(line);
    } else if (currentDialogue.length > 0) {
      currentDialogue.push(line);
    }
  }
  
  if (currentDialogue.length > 0) {
    dialogues.push(currentDialogue.join('\n'));
  }

  return {
    filePath,
    content,
    dialogues,
    lineCount: lines.length,
  };
}

/**
 * Анализ лога на предмет тем
 */
async function analyzeLogForTopics(logData) {
  const prompt = `Проанализируй следующий лог сессии с Claude Code и извлеки потенциальные темы для статей блога.

Лог:
${logData.content.substring(0, 8000)}

Определи:
1. Какие задачи решались в этой сессии?
2. Какие технологии использовались?
3. Какие ошибки возникали и как решались?
4. Есть ли интересные инсайты или решения?

Для каждой найденной темы укажи:
- Название темы (конкретное и понятное)
- Описание (2-3 предложения)
- Технологии (список тегов)
- Сложность (1-5, где 5 - очень сложная задача)
- Почему это интересно для блога

Ответь в формате JSON:
{
  "topics": [
    {
      "topic": "Название",
      "description": "Описание",
      "technologies": ["tag1", "tag2"],
      "complexity": 4,
      "rationale": "Почему интересно"
    }
  ]
}`;

  try {
    const response = await askNvidia(prompt, { temperature: 0.3 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { topics: [] };
  } catch (error) {
    console.error('❌ Ошибка анализа лога:', error.message);
    return { topics: [] };
  }
}

/**
 * Фильтрация тем по сложности
 */
function filterTopicsByComplexity(topics, minComplexity) {
  return topics.filter(topic => topic.complexity >= minComplexity);
}

/**
 * Ранжирование тем
 */
function rankTopics(topics) {
  return topics
    .map(topic => ({
      ...topic,
      score: topic.complexity * (topic.technologies?.length || 1),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Основная функция
 */
async function extractIdeas(options = {}) {
  console.log('🔍 Извлечение идей из логов Claude Code...\n');

  validateConfig();

  const logsDir = config.logs.dir.replace('~', os.homedir());
  const daysBack = options.days || 7;
  const minComplexity = options.minComplexity || config.ideas.minComplexity;
  const outputFile = options.output || path.join(config.output.dir, 'ideas.json');

  console.log(`📁 Директория логов: ${logsDir}`);
  console.log(`📅 Период: последние ${daysBack} дней`);
  console.log(`📊 Минимальная сложность: ${minComplexity}\n`);

  // Получение списка файлов логов
  const logFiles = await getFiles(logsDir, '**/*.log');
  console.log(`📄 Найдено файлов логов: ${logFiles.length}`);

  if (logFiles.length === 0) {
    console.log('⚠️  Логи не найдены. Убедитесь, что указан правильный путь.');
    return;
  }

  // Фильтрация по дате
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const recentLogs = logFiles.filter(file => {
    const stats = require('fs').statSync(file);
    return stats.mtime >= cutoffDate;
  });

  console.log(`📄 Файлов за последние ${daysBack} дней: ${recentLogs.length}\n`);

  // Анализ каждого лога
  const allTopics = [];
  
  for (let i = 0; i < recentLogs.length; i++) {
    const logFile = recentLogs[i];
    console.log(`[${i + 1}/${recentLogs.length}] Анализ: ${path.basename(logFile)}`);

    const logData = await parseLogFile(logFile);
    if (!logData) continue;

    const analysis = await analyzeLogForTopics(logData);
    
    if (analysis.topics && analysis.topics.length > 0) {
      const topicsWithMeta = analysis.topics.map(topic => ({
        ...topic,
        sourceFile: logFile,
        extractedAt: new Date().toISOString(),
      }));
      allTopics.push(...topicsWithMeta);
      console.log(`   ✅ Найдено тем: ${analysis.topics.length}`);
    } else {
      console.log(`   ℹ️  Тем не найдено`);
    }
  }

  console.log(`\n📊 Всего найдено тем: ${allTopics.length}`);

  // Фильтрация и ранжирование
  const filteredTopics = filterTopicsByComplexity(allTopics, minComplexity);
  const rankedTopics = rankTopics(filteredTopics);

  console.log(`📊 После фильтрации (сложность >= ${minComplexity}): ${rankedTopics.length}\n`);

  // Формирование результата
  const result = {
    generatedAt: new Date().toISOString(),
    totalLogs: recentLogs.length,
    totalTopics: allTopics.length,
    filteredTopics: rankedTopics.length,
    minComplexity,
    daysBack,
    ideas: rankedTopics.slice(0, config.ideas.maxIdeas).map((topic, index) => ({
      rank: index + 1,
      ...topic,
    })),
  };

  // Сохранение
  await ensureDir(path.dirname(outputFile));
  await writeJson(outputFile, result);

  console.log('✅ Идеи сохранены в:', outputFile);
  console.log('\n📋 Топ тем:');
  result.ideas.forEach((idea, i) => {
    console.log(`\n${i + 1}. ${idea.topic}`);
    console.log(`   Сложность: ${idea.complexity}/5 | Score: ${idea.score}`);
    console.log(`   Теги: ${idea.technologies?.join(', ')}`);
    console.log(`   ${idea.description?.substring(0, 100)}...`);
  });

  return result;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    days: parseInt(args.find((_, i) => args[i - 1] === '--days') || '7'),
    minComplexity: parseInt(args.find((_, i) => args[i - 1] === '--min-complexity') || '3'),
    output: args.find((_, i) => args[i - 1] === '--output'),
  };

  extractIdeas(options).catch(console.error);
}

export { extractIdeas };
export default extractIdeas;
