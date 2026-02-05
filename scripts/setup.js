#!/usr/bin/env node

import { writeText, ensureDir } from './src/utils/files.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
  console.log('🚀 Настройка Auto Blog System\n');

  // Проверка Node.js версии
  const nodeVersion = process.version;
  console.log('📦 Node.js:', nodeVersion);

  if (parseInt(nodeVersion.split('.')[0].substring(1)) < 18) {
    console.error('❌ Требуется Node.js 18+');
    process.exit(1);
  }

  // Создание .env если не существует
  const envPath = path.join(__dirname, '.env');
  if (!await fs.pathExists(envPath)) {
    const envExample = await fs.readFile(path.join(__dirname, '.env.example'), 'utf-8');
    await writeText(envPath, envExample);
    console.log('✅ Создан файл .env');
    console.log('   ⚠️  Не забудьте заполнить переменные окружения!\n');
  }

  // Создание директорий
  const dirs = [
    'output',
    'website/src/content/blog',
    'logs',
  ];

  for (const dir of dirs) {
    await ensureDir(path.join(__dirname, dir));
  }
  console.log('✅ Созданы директории');

  // Установка зависимостей
  console.log('\n📥 Установка зависимостей...');
  const { execSync } = await import('child_process');
  
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Зависимости установлены');
  } catch (error) {
    console.error('❌ Ошибка установки зависимостей');
    process.exit(1);
  }

  // Создание примера статьи
  const exampleArticle = `---
title: "Пример статьи"
description: "Это пример статьи для вашего блога"
date: ${new Date().toISOString()}
author: "${process.env.AUTHOR_NAME || 'Автор'}"
tags: ["example", "blog"]
---

# Пример статьи

Это пример статьи, созданной автоматически. Замените его на свою первую настоящую статью!

## Как использовать

1. Запустите \`npm run extract-ideas\` для извлечения тем из логов
2. Запустите \`npm run generate-post\` для создания статьи
3. Запустите \`npm run publish-telegram\` для публикации
`;

  await writeText(
    path.join(__dirname, 'website/src/content/blog/example.md'),
    exampleArticle
  );
  console.log('✅ Создан пример статьи');

  console.log('\n' + '='.repeat(50));
  console.log('✨ Настройка завершена!');
  console.log('='.repeat(50) + '\n');
  console.log('Следующие шаги:');
  console.log('1. Отредактируйте .env и добавьте API ключи');
  console.log('2. Запустите: npm run extract-ideas');
  console.log('3. Запустите: npm run generate-post "Ваша тема"');
  console.log('4. Запустите: npm run publish-telegram');
  console.log('\n📖 Подробнее в README.md');
}

setup().catch(console.error);
