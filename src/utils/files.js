import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Чтение JSON файла
 */
export async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Ошибка чтения JSON: ${filePath}`, error.message);
    return null;
  }
}

/**
 * Запись JSON файла
 */
export async function writeJson(filePath, data) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи JSON: ${filePath}`, error.message);
    return false;
  }
}

/**
 * Чтение текстового файла
 */
export async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Ошибка чтения файла: ${filePath}`, error.message);
    return null;
  }
}

/**
 * Запись текстового файла
 */
export async function writeText(filePath, content) {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи файла: ${filePath}`, error.message);
    return false;
  }
}

/**
 * Получение списка файлов в директории
 */
export async function getFiles(dirPath, pattern = '**/*') {
  try {
    const { glob } = await import('glob');
    const files = await glob(pattern, {
      cwd: dirPath,
      absolute: true,
      nodir: true,
    });
    return files;
  } catch (error) {
    console.error(`❌ Ошибка получения файлов: ${dirPath}`, error.message);
    return [];
  }
}

/**
 * Проверка существования файла
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Создание директории
 */
export async function ensureDir(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка создания директории: ${dirPath}`, error.message);
    return false;
  }
}

/**
 * Копирование файла
 */
export async function copyFile(src, dest) {
  try {
    await fs.ensureDir(path.dirname(dest));
    await fs.copy(src, dest);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка копирования: ${src} -> ${dest}`, error.message);
    return false;
  }
}
