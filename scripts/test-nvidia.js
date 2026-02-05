#!/usr/bin/env node

import { validateConfig, config } from '../src/config/index.js';
import { askNvidia } from '../src/utils/nvidia.js';

async function testNvidia() {
  console.log('🧪 Тестирование NVIDIA API...\n');

  validateConfig();

  console.log('Конфигурация:');
  console.log('   Модель:', config.nvidia.model);
  console.log('   Max tokens:', config.nvidia.maxTokens);
  console.log('   API Key:', process.env.NVIDIA_API_KEY.substring(0, 15) + '...\n');

  const testPrompt = 'Напиши короткий абзац (3-4 предложения) о преимуществах NVIDIA NIM API для разработчиков.';

  console.log('Отправка тестового запроса...');
  console.log('Промпт:', testPrompt);
  console.log('');

  try {
    const response = await askNvidia(testPrompt, { 
      temperature: 0.7,
      maxTokens: 500 
    });

    console.log('✅ Успешно!');
    console.log('');
    console.log('Ответ:');
    console.log('---');
    console.log(response);
    console.log('---');
    console.log('');
    console.log('Размер ответа:', response.length, 'символов');
    console.log('Примерное количество токенов:', Math.ceil(response.length / 4));
    console.log('');
    console.log('🎉 NVIDIA API работает корректно!');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.message.includes('401')) {
      console.error('   Проверьте NVIDIA_API_KEY в .env файле');
    }
    process.exit(1);
  }
}

testNvidia().catch(error => {
  console.error('Фатальная ошибка:', error);
  process.exit(1);
});
