# Auto Blog System - Dockerfile
# Production-ready container for VPS deployment

FROM node:18-alpine

# Метаданные
LABEL maintainer="Auto Blog System"
LABEL description="Auto Blog System for VPS deployment"
LABEL version="1.0"

# Установка зависимостей для сборки
RUN apk add --no-cache \
    git \
    python3 \
    py3-pip \
    make \
    g++ \
    curl \
    bash \
    vim \
    tzdata

# Настройка timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Создание пользователя (не root для безопасности)
RUN addgroup -g 1001 -S autoblog && \
    adduser -S autoblog -u 1001 -G autoblog

# Рабочая директория
WORKDIR /app

# Копирование package.json файлов
COPY package*.json ./
COPY website/package*.json ./website/

# Установка зависимостей
# Сначала основные
RUN npm ci --production --silent && \
    npm cache clean --force

# Затем для сайта
RUN cd website && \
    npm ci --production --silent && \
    npm cache clean --force

# Копирование всего проекта
COPY . .

# Создание директорий для данных
RUN mkdir -p logs output backups data && \
    chown -R autoblog:autoblog /app && \
    chmod 755 /app

# Переключение на непривилегированного пользователя
USER autoblog

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node scripts/health-check.js || exit 1

# Порты (опционально, для dev server)
EXPOSE 3000 4321

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3000

# Тома для данных (чтобы сохранялись при пересоздании контейнера)
VOLUME ["/app/logs", "/app/output", "/app/backups", "/app/data"]

# Команда по умолчанию
CMD ["node", "src/agents/server.js"]
