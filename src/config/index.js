import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// NVIDIA API не требует клиента - используем fetch напрямую

// Exa API (для поиска)
let exa = null;
try {
  const Exa = (await import('exa-js')).default;
  exa = new Exa(process.env.EXA_API_KEY);
} catch (error) {
  console.warn('⚠️ Exa SDK не установлен. Установите: npm install exa-js');
}

// Конфигурация
export const config = {
  nvidia: {
    model: 'meta/llama-3.1-405b-instruct',
    maxTokens: 4096,
  },
  exa: {
    maxResults: parseInt(process.env.MAX_EXA_RESULTS) || 5,
  },
  output: {
    dir: process.env.OUTPUT_DIR || './output',
    websiteDir: process.env.WEBSITE_CONTENT_DIR || './website/src/content/blog',
  },
  logs: {
    dir: process.env.CLAUDE_LOGS_DIR || '~/.claude/logs',
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    channel: process.env.TELEGRAM_CHANNEL_ID,
  },
  site: {
    url: process.env.SITE_URL || 'https://yourblog.com',
    title: process.env.SITE_TITLE || 'Мой Автоблог',
    description: process.env.SITE_DESCRIPTION || 'Блог о программировании и AI',
    author: process.env.AUTHOR_NAME || 'Автор',
  },
  deaify: {
    iterations: parseInt(process.env.DEAIFY_ITERATIONS) || 2,
    minScore: 3.5,
  },
  ideas: {
    minComplexity: parseInt(process.env.MIN_COMPLEXITY) || 3,
    maxIdeas: 10,
  },
};

export { exa };

// Проверка конфигурации
export function validateConfig() {
  const required = ['NVIDIA_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log('✅ Конфигурация загружена');
  console.log(`   NVIDIA модель: ${config.nvidia.model}`);
}

export default config;
