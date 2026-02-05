import { exa, config } from '../config/index.js';

/**
 * Поиск информации через Exa
 */
export async function searchExa(query, options = {}) {
  try {
    const result = await exa.searchAndContents(query, {
      numResults: options.numResults || config.exa.maxResults,
      text: true,
      highlights: true,
      ...options,
    });

    return result.results.map(item => ({
      title: item.title,
      url: item.url,
      text: item.text,
      highlights: item.highlights,
      publishedDate: item.publishedDate,
    }));
  } catch (error) {
    console.error('❌ Ошибка Exa API:', error.message);
    return [];
  }
}

/**
 * Поиск с фильтрацией по дате
 */
export async function searchExaRecent(query, daysBack = 30, options = {}) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const result = await exa.searchAndContents(query, {
      numResults: options.numResults || config.exa.maxResults,
      text: true,
      startPublishedDate: startDate.toISOString(),
      ...options,
    });

    return result.results.map(item => ({
      title: item.title,
      url: item.url,
      text: item.text,
      publishedDate: item.publishedDate,
    }));
  } catch (error) {
    console.error('❌ Ошибка Exa API:', error.message);
    return [];
  }
}

/**
 * Получение контента по URL
 */
export async function getExaContents(urls, options = {}) {
  try {
    const result = await exa.getContents(urls, {
      text: true,
      highlights: true,
      ...options,
    });

    return result.results.map(item => ({
      title: item.title,
      url: item.url,
      text: item.text,
      highlights: item.highlights,
    }));
  } catch (error) {
    console.error('❌ Ошибка Exa API:', error.message);
    return [];
  }
}

/**
 * Поиск похожих статей
 */
export async function findSimilar(url, options = {}) {
  try {
    const result = await exa.findSimilar(url, {
      numResults: options.numResults || 3,
      text: true,
      ...options,
    });

    return result.results.map(item => ({
      title: item.title,
      url: item.url,
      text: item.text,
    }));
  } catch (error) {
    console.error('❌ Ошибка Exa API:', error.message);
    return [];
  }
}
