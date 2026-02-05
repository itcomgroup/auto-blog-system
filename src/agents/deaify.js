#!/usr/bin/env node

import { deaify } from './generate-post.js';
import { readText, writeText } from '../utils/files.js';
import path from 'path';

/**
 * CLI для деаификации текста
 */
async function main() {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const outputFile = args.find((_, i) => args[i - 1] === '--output');
  const iterations = parseInt(args.find((_, i) => args[i - 1] === '--iterations') || '2');

  if (!inputFile) {
    console.log('Использование: deaify.js <input-file> [--output <file>] [--iterations <n>]');
    process.exit(1);
  }

  console.log('🧹 Deaify: удаление "аишности" из текста\n');

  const text = await readText(inputFile);
  if (!text) {
    console.error('❌ Не удалось прочитать файл:', inputFile);
    process.exit(1);
  }

  console.log(`📄 Исходный размер: ${text.length} символов\n`);

  const result = await deaify(text, iterations);

  console.log('\n✅ Готово!');
  console.log(`   Score: ${result.score.toFixed(1)}/5`);
  console.log(`   Размер: ${result.text.length} символов`);

  if (outputFile) {
    await writeText(outputFile, result.text);
    console.log(`   Сохранено: ${outputFile}`);
  } else {
    console.log('\n--- Результат ---\n');
    console.log(result.text);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { deaify };
