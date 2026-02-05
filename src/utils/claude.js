import { claude, config } from '../config/index.js';

/**
 * Отправка сообщения к Claude
 */
export async function askClaude(prompt, options = {}) {
  try {
    const response = await claude.messages.create({
      model: options.model || config.claude.model,
      max_tokens: options.maxTokens || config.claude.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('❌ Ошибка Claude API:', error.message);
    throw error;
  }
}

/**
 * Отправка системного промпта + сообщения к Claude
 */
export async function askClaudeWithSystem(systemPrompt, userPrompt, options = {}) {
  try {
    const response = await claude.messages.create({
      model: options.model || config.claude.model,
      max_tokens: options.maxTokens || config.claude.maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: options.temperature || 0.7,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('❌ Ошибка Claude API:', error.message);
    throw error;
  }
}

/**
 * Параллельные запросы к Claude (для критиков)
 */
export async function askClaudeParallel(prompts, options = {}) {
  try {
    const promises = prompts.map(prompt => 
      askClaude(prompt, options).catch(err => ({ error: err.message }))
    );
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('❌ Ошибка параллельных запросов:', error.message);
    throw error;
  }
}

/**
 * Стриминг ответа от Claude (для длинных текстов)
 */
export async function* streamClaude(prompt, options = {}) {
  try {
    const stream = await claude.messages.create({
      model: options.model || config.claude.model,
      max_tokens: options.maxTokens || config.claude.maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.temperature || 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    console.error('❌ Ошибка стриминга:', error.message);
    throw error;
  }
}
