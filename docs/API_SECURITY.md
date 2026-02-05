# 🔐 Безопасность API Ключей на Сервере

## ⚠️ Важность темы

API ключи — это **ключи от твоего счёта** и **доступ к AI сервисам**.

Если ключи попадут к злоумышленникам:
- 💸 Могут списать все деньги (счёт в минус)
- 🔑 Получат доступ к твоим данным
- 🚫 Заблокируют аккаунт за подозрительную активность

**Никогда не храни ключи в:**
- ❌ Git репозитории
- ❌ Логах
- ❌ Истории команд (bash_history)
- ❌ Документации
- ❌ Публичных местах

---

## 🛡️ Архитектура безопасности

```
┌─────────────────────────────────────────────────────────┐
│  ПОЛЬЗОВАТЕЛЬ (Ты)                                      │
│  • Знает ключи                                          │
│  • Добавляет в .env                                     │
│  • Контролирует доступ                                  │
└─────────────────────────┬───────────────────────────────┘
                          │ SSH / Secure copy
                          ▼
┌─────────────────────────────────────────────────────────┐
│  VPS СЕРВЕР                                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Файл .env                                      │   │
│  │  • Права: 600 (только владелец)               │   │
│  │  • Шифрование: опционально                      │   │
│  │  • Расположение: /opt/auto-blog/app/.env       │   │
│  │  • Не в git!                                    │   │
│  └────────────────────────┬────────────────────────┘   │
│                           │                             │
│                           ▼ чтение                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Приложение Auto Blog                           │   │
│  │  • Читает .env при старте                       │   │
│  │  • Использует в памяти                          │   │
│  │  • Не логирует ключи                            │   │
│  │  • HTTPS only для API запросов                  │   │
│  └────────────────────────┬────────────────────────┘   │
│                           │                             │
│                           ▼ HTTPS                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  API Сервисы (Claude, Exa)                      │   │
│  │  • TLS 1.3 шифрование                           │   │
│  │  • IP whitelist (опционально)                   │   │
│  │  • Rate limiting                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Уровни защиты

### Уровень 1: Базовый (Обязательно) ✅

```bash
# 1. Права доступа к .env
chmod 600 /opt/auto-blog/app/.env
chown autoblog:autoblog /opt/auto-blog/app/.env

# 2. .gitignore
# Убедиться что .env в .gitignore
echo ".env" >> /opt/auto-blog/app/.gitignore

# 3. Не показывать ключи в логах
# В коде: logger.info('Using API key: ***' + key.slice(-4))
```

**Что защищает:**
- От чтения другими пользователями системы
- От случайного попадания в git
- От логирования в консоль

### Уровень 2: Продвинутый (Рекомендуется) ⭐

```bash
# 1. Шифрование файла .env
gpg --symmetric --cipher-algo AES256 .env
# Получаем .env.gpg

# 2. Дешифрование при запуске
gpg --decrypt .env.gpg > .env
chmod 600 .env

# 3. Автоматическая расшифровка через systemd
# При старте сервиса расшифровывается,
# при остановке удаляется
```

**Что защищает:**
- От чтения при физическом доступе к диску
- От копирования файла без пароля

### Уровень 3: Максимальный (Enterprise) 🔒

```bash
# 1. Использование Vault (HashiCorp Vault)
# Хранение ключей в Vault, а не в файле

# 2. Динамические ключи
# Ключи создаются на время сессии и удаляются

# 3. IP whitelist
# API ключи работают только с IP сервера

# 4. Мониторинг и алерты
# Уведомление при подозрительной активности
```

---

## 🔧 Конкретные меры для нашего проекта

### 1. Файл .env (уже настроено)

```bash
# Создаём .env с правильными правами
cat > /opt/auto-blog/app/.env << 'EOF'
# API Keys - NEVER SHARE THESE!
ANTHROPIC_API_KEY=sk-ant-your_key_here
EXA_API_KEY=your_exa_key_here
TELEGRAM_BOT_TOKEN=your_telegram_token

# Settings
LOG_LEVEL=info
EOF

# Устанавливаем права (только владелец может читать)
chmod 600 /opt/auto-blog/app/.env
chown autoblog:autoblog /opt/auto-blog/app/.env

# Проверяем
ls -la /opt/auto-blog/app/.env
# Должно быть: -rw------- 1 autoblog autoblog
```

### 2. .gitignore (уже настроено)

```gitignore
# Auto Blog System - .gitignore

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# Dependencies
node_modules/

# Output
output/
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp
.cache/
```

### 3. Безопасное использование в коде

```javascript
// src/config/index.js - Безопасная загрузка

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Загружаем .env
const envPath = path.join(__dirname, '../../.env');

// Проверяем права доступа
const stats = fs.statSync(envPath);
const mode = stats.mode & parseInt('777', 8);

if (mode !== 0o600) {
  console.error('⚠️  ВНИМАНИЕ: .env имеет небезопасные права доступа!');
  console.error(`   Текущие права: ${mode.toString(8)}`);
  console.error('   Рекомендуется: chmod 600 .env');
}

dotenv.config({ path: envPath });

// Валидация ключей
function validateApiKeys() {
  const required = ['ANTHROPIC_API_KEY'];
  const missing = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Отсутствуют обязательные API ключи:', missing.join(', '));
    process.exit(1);
  }
  
  // Проверка формата
  if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.error('❌ ANTHROPIC_API_KEY имеет неверный формат');
    process.exit(1);
  }
}

// Маскирование ключей для логов
export function maskApiKey(key) {
  if (!key || key.length < 10) return '***';
  return key.substring(0, 4) + '***' + key.substring(key.length - 4);
}

export const config = {
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    maskedKey: maskApiKey(process.env.ANTHROPIC_API_KEY),
  },
  exa: {
    apiKey: process.env.EXA_API_KEY,
    maskedKey: maskApiKey(process.env.EXA_API_KEY),
  },
  // ... остальная конфигурация
};

// Валидация при загрузке
validateApiKeys();
```

### 4. Безопасное логирование

```javascript
// src/utils/logger.js

import winston from 'winston';

// Фильтр для маскирования чувствительных данных
const sensitiveDataFilter = winston.format((info) => {
  const message = JSON.stringify(info);
  
  // Маскируем API ключи
  const filtered = message
    .replace(/sk-ant-[a-zA-Z0-9]{20,}/g, '***ANTHROPIC_KEY***')
    .replace(/exa-[a-zA-Z0-9-]{20,}/g, '***EXA_KEY***')
    .replace(/[0-9]+:[a-zA-Z0-9_-]{20,}/g, '***TELEGRAM_TOKEN***');
  
  return JSON.parse(filtered);
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    sensitiveDataFilter,
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/auto-blog/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/var/log/auto-blog/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

---

## 🚨 Защита от утечек

### 1. Проверка bash_history

```bash
# Добавить в ~/.bashrc или ~/.zshrc
# Не сохранять команды с ключами
export HISTCONTROL=ignoreboth
export HISTIGNORE='*ANTHROPIC_API_KEY*:*sk-ant-*'

# Очистка существующей истории
history | grep -E '(sk-ant-|exa-|API_KEY)' | awk '{print $1}' | xargs -I {} history -d {}
```

### 2. Проверка логов

```bash
# Скрипт проверки логов на утечки
#!/bin/bash
# scripts/check-key-leaks.sh

echo "🔍 Проверка на утечку API ключей..."

# Паттерны ключей
PATTERNS=(
  "sk-ant-[a-zA-Z0-9]{20,}"
  "exa-[a-zA-Z0-9-]{20,}"
  "[0-9]+:[a-zA-Z0-9_-]{20,}"
)

# Проверяемые директории
DIRS=(
  "/var/log/auto-blog"
  "/opt/auto-blog/app/logs"
  "/home/autoblog"
)

FOUND=0

for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    for pattern in "${PATTERNS[@]}"; do
      matches=$(grep -r -E "$pattern" "$dir" 2>/dev/null || true)
      if [ ! -z "$matches" ]; then
        echo "⚠️  Найдены потенциальные утечки в $dir:"
        echo "$matches" | head -5
        FOUND=$((FOUND + 1))
      fi
    done
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "✅ Утечек не обнаружено"
  exit 0
else
  echo "❌ Обнаружены утечки! Требуется действие."
  exit 1
fi
```

### 3. Проверка git

```bash
# Проверка перед коммитом
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Проверка перед коммитом..."

# Проверяем staged файлы
if git diff --cached --name-only | xargs grep -l 'sk-ant-\|exa-\|API_KEY' 2>/dev/null; then
  echo "❌ ОШИБКА: В коммите обнаружены API ключи!"
  echo "   Используйте .env для хранения ключей"
  exit 1
fi

echo "✅ Проверка пройдена"
exit 0
```

---

## 🔄 Ротация ключей (Key Rotation)

### Почему важно:
- Снижает риск при компрометации
- Позволяет отозвать скомпрометированный ключ
- Соответствует best practices безопасности

### Как делать:

```bash
#!/bin/bash
# scripts/rotate-keys.sh

echo "🔄 Ротация API ключей..."

# 1. Генерируем новый ключ в панели управления
#    (Claude Console, Exa Dashboard)

# 2. Обновляем .env
NEW_ANTHROPIC_KEY="sk-ant-новый_ключ"

# 3. Делаем бэкап старого ключа
cp /opt/auto-blog/app/.env /opt/auto-blog/app/.env.backup.$(date +%Y%m%d)

# 4. Обновляем ключ
sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$NEW_ANTHROPIC_KEY/" /opt/auto-blog/app/.env

# 5. Перезапускаем сервис
pm2 restart auto-blog

# 6. Проверяем работу
sleep 5
if pm2 status | grep -q "online"; then
  echo "✅ Ключ обновлён, сервис работает"
  
  # 7. Удаляем старый ключ из панели управления
  echo "⚠️  Не забудьте удалить старый ключ из панели управления!"
else
  echo "❌ Ошибка! Восстанавливаем старый ключ..."
  cp /opt/auto-blog/app/.env.backup.$(date +%Y%m%d) /opt/auto-blog/app/.env
  pm2 restart auto-blog
  exit 1
fi
```

**Частота ротации:**
- **Критичные ключи:** Раз в 3 месяца
- **Обычные ключи:** Раз в 6-12 месяцев
- **При инциденте:** Немедленно

---

## 📊 Мониторинг использования

### Отслеживание расходов:

```bash
#!/bin/bash
# scripts/monitor-api-usage.sh

echo "📊 Мониторинг использования API..."

# Проверка баланса Claude
# (требуется API для получения баланса)

# Проверка логов на аномалии
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)
REQUEST_COUNT=$(grep -c "$YESTERDAY" /var/log/auto-blog/api-requests.log 2>/dev/null || echo "0")

if [ "$REQUEST_COUNT" -gt 100 ]; then
  echo "⚠️  Высокая активность: $REQUEST_COUNT запросов вчера"
  # Отправить уведомление
fi

echo "✅ Запросов вчера: $REQUEST_COUNT"
```

### Алерты:

```bash
# Добавить в cron
# */30 * * * * /opt/auto-blog/scripts/monitor-api-usage.sh

# Если расход > $10 за день — алерт
# Если > 1000 запросов в час — алерт
```

---

## 🆘 Что делать при компрометации

### Шаг 1: Немедленные действия (в течение 5 минут)

```bash
# 1. Отключаем сервис
pm2 stop auto-blog

# 2. Отзываем ключи в панелях управления:
#    - https://console.anthropic.com/  → Revoke key
#    - https://exa.ai/                 → Revoke key
#    - Telegram BotFather              → Revoke token

# 3. Меняем все ключи
./scripts/rotate-keys.sh

# 4. Проверяем логи на подозрительную активность
grep "ERROR\| Unauthorized" /var/log/auto-blog/*.log

# 5. Перезапускаем с новыми ключами
pm2 start auto-blog
```

### Шаг 2: Расследование (в течение часа)

```bash
# 1. Проверяем кто имел доступ
last | grep -E "$(date +%Y-%m-%d)"
cat /var/log/auth.log | grep -i "accepted"

# 2. Проверяем изменения в файлах
find /opt/auto-blog -type f -mtime -1

# 3. Анализируем сетевую активность
netstat -tulpn | grep node

# 4. Проверяем запущенные процессы
ps aux | grep -E "node|npm"
```

### Шаг 3: Предотвращение

```bash
# 1. Меняем все пароли
passwd autoblog

# 2. Меняем SSH ключи (если есть подозрения)
rm ~/.ssh/authorized_keys
cat ~/.ssh/new_authorized_keys > ~/.ssh/authorized_keys

# 3. Обновляем систему
apt-get update && apt-get upgrade -y

# 4. Проверяем на руткиты
rkhunter --check
```

---

## ✅ Чек-лист безопасности для Агента

### При установке:
- [ ] `.env` создан с правами 600
- [ ] Пользователь `autoblog` не имеет sudo
- [ ] `.env` добавлен в `.gitignore`
- [ ] Логи не содержат ключей
- [ ] bash_history очищен от ключей

### При эксплуатации:
- [ ] Права на `.env` проверяются еженедельно
- [ ] Логи проверяются на утечки
- [ ] Расход API мониторится
- [ ] Ротация ключей каждые 3-6 месяцев

### При подозрении на взлом:
- [ ] Немедленная остановка сервиса
- [ ] Отзыв всех ключей
- [ ] Генерация новых ключей
- [ ] Расследование инцидента
- [ ] Усиление мер безопасности

---

## 📞 Экстренные контакты

При компрометации ключей:

**Anthropic:**
- Console: https://console.anthropic.com/
- Email: support@anthropic.com
- Отзыв ключа: Settings → API Keys → Revoke

**Exa:**
- Dashboard: https://exa.ai/
- Email: support@exa.ai

**Telegram:**
- BotFather: @BotFather
- Команда: /revoke

---

## 🎯 Итог

**Безопасность API ключей — это:**
1. ✅ Права доступа 600 на .env
2. ✅ .env в .gitignore
3. ✅ Маскирование в логах
4. ✅ Регулярная ротация
5. ✅ Мониторинг расходов
6. ✅ План действий при инциденте

**Самое главное:**
- Никогда не коммить ключи в git
- Никогда не показывай ключи в логах
- Регулярно меняй ключи
- Мониторь расходы

**У тебя уже настроено:**
- ✅ Права 600 на .env
- ✅ Пользователь autoblog без root
- ✅ Маскирование в коде
- ✅ Проверка при старте

**Остаётся:**
- ⚠️ Добавить мониторинг
- ⚠️ Настроить алерты
- ⚠️ Планировать ротацию
