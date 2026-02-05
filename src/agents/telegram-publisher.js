#!/usr/bin/env node

import TelegramBot from 'node-telegram-bot-api';
import { config, validateConfig } from '../config/index.js';
import { readText, readJson, getFiles } from '../utils/files.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Инициализация бота
 */
function initBot() {
  if (!config.telegram.token) {
    throw new Error('TELEGRAM_BOT_TOKEN не указан в .env');
  }
  return new TelegramBot(config.telegram.token, { polling: false });
}

/**
 * Парсинг HTML статьи
 */
async function parseArticle(articlePath) {
  const html = await readText(path.join(articlePath, 'index.html'));
  const meta = await readJson(path.join(articlePath, 'meta.json'));
  
  if (!html || !meta) {
    throw new Error('Не удалось прочитать файлы статьи');
  }

  // Извлечение текста из HTML (простая версия)
  const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
  const title = titleMatch ? titleMatch[1] : meta.title;

  // Извлечение первых 200 символов текста
  const textContent = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 400);

  const description = textContent.length > 200 
    ? textContent.substring(0, 200) + '...'
    : textContent;

  return {
    title,
    description,
    url: `${config.site.url}/blog/${meta.slug}`,
    tags: meta.tags || [],
    date: meta.date,
  };
}

/**
 * Форматирование сообщения для Telegram
 */
function formatMessage(article) {
  const emoji = '📝';
  const tags = article.tags.map(tag => `#${tag}`).join(' ');
  
  return `${emoji} <b>${article.title}</b>

${article.description}

${tags}

🔗 <a href="${article.url}">Читать полностью</a>`;
}

/**
 * Публикация статьи
 */
async function publishArticle(articlePath, options = {}) {
  console.log('📤 Публикация в Telegram...\n');

  validateConfig();

  const bot = initBot();
  const channelId = config.telegram.channel;

  if (!channelId) {
    throw new Error('TELEGRAM_CHANNEL_ID не указан в .env');
  }

  // Парсинг статьи
  const article = await parseArticle(articlePath);
  console.log('📄 Статья:', article.title);
  console.log('🔗 URL:', article.url);

  // Форматирование
  const message = formatMessage(article);

  if (options.dryRun) {
    console.log('\n--- Предпросмотр ---');
    console.log(message);
    console.log('-------------------\n');
    return { preview: message };
  }

  // Публикация
  try {
    const sent = await bot.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });

    console.log('✅ Опубликовано!');
    console.log(`   ID сообщения: ${sent.message_id}`);
    console.log(`   Дата: ${new Date(sent.date * 1000).toLocaleString()}`);

    return {
      messageId: sent.message_id,
      chatId: sent.chat.id,
      date: sent.date,
    };
  } catch (error) {
    console.error('❌ Ошибка публикации:', error.message);
    throw error;
  }
}

/**
 * Публикация нескольких статей
 */
async function publishBatch(outputDir, options = {}) {
  console.log('📚 Массовая публикация...\n');

  const dirs = await getFiles(outputDir, '*/meta.json');
  const results = [];

  for (const metaFile of dirs) {
    const articleDir = path.dirname(metaFile);
    const meta = await readJson(metaFile);

    if (meta.published) {
      console.log(`⏭️  Пропущено (уже опубликовано): ${meta.title}`);
      continue;
    }

    try {
      const result = await publishArticle(articleDir, options);
      
      // Отметить как опубликованное
      meta.published = true;
      meta.publishedAt = new Date().toISOString();
      meta.telegramMessageId = result.messageId;
      
      const { writeJson } = await import('../utils/files.js');
      await writeJson(metaFile, meta);
      
      results.push({ success: true, title: meta.title });
      console.log('');
    } catch (error) {
      results.push({ success: false, title: meta.title, error: error.message });
    }
  }

  console.log('\n📊 Итоги:');
  console.log(`   Успешно: ${results.filter(r => r.success).length}`);
  console.log(`   Ошибок: ${results.filter(r => !r.success).length}`);

  return results;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const options = {
    dryRun: args.includes('--dry-run'),
  };

  if (command === '--batch') {
    const outputDir = args[1] || config.output.dir;
    publishBatch(outputDir, options).catch(console.error);
  } else {
    const articlePath = command || path.join(config.output.dir, 'latest');
    publishArticle(articlePath, options).catch(console.error);
  }
}

export { publishArticle, publishBatch };
export default publishArticle;
