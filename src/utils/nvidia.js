import { config } from '../config/index.js';

/**
 * Отправка сообщения к NVIDIA
 */
export async function askNvidia(prompt, options = {}) {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || config.nvidia.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || config.nvidia.maxTokens,
        top_p: options.topP || 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`NVIDIA API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Ошибка NVIDIA API:', error.message);
    throw error;
  }
}

/**
 * Отправка системного промпта + сообщения к NVIDIA
 */
export async function askNvidiaWithSystem(systemPrompt, userPrompt, options = {}) {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || config.nvidia.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || config.nvidia.maxTokens,
        top_p: options.topP || 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`NVIDIA API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Ошибка NVIDIA API:', error.message);
    throw error;
  }
}

/**
 * Параллельные запросы к NVIDIA (для критиков)
 */
export async function askNvidiaParallel(prompts, options = {}) {
  try {
    const promises = prompts.map(prompt => 
      askNvidia(prompt, options).catch(err => ({ error: err.message }))
    );
    
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('❌ Ошибка параллельных запросов:', error.message);
    throw error;
  }
}

/**
 * Стриминг ответа от NVIDIA (для длинных текстов)
 */
export async function* streamNvidia(prompt, options = {}) {
  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || config.nvidia.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || config.nvidia.maxTokens,
        top_p: options.topP || 0.9,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`NVIDIA API Error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

      for (const line of lines) {
        const jsonStr = line.replace('data: ', '');
        if (jsonStr === '[DONE]') continue;

        try {
          const json = JSON.parse(jsonStr);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка стриминга:', error.message);
    throw error;
  }
}
