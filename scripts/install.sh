#!/bin/bash
#
# Auto Blog System - Master Installation Script
# Для серверного агента управления VPS
#

set -e  # Остановка при любой ошибке
set -u  # Ошибка при неопределённых переменных

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
INSTALL_DIR="/opt/auto-blog"
APP_DIR="$INSTALL_DIR/app"
DATA_DIR="$INSTALL_DIR/data"
LOG_DIR="/var/log/auto-blog"
USER="autoblog"
NODE_VERSION="18"

# Логирование
exec 1> >(tee -a "$LOG_DIR/install.log") 2>&1

# Функции
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен запускаться от root"
        exit 1
    fi
}

check_os() {
    log_info "Проверка операционной системы..."
    
    if ! command -v apt-get &> /dev/null; then
        log_error "Поддерживается только Debian/Ubuntu с apt"
        exit 1
    fi
    
    # Проверка версии Ubuntu/Debian
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        log_info "ОС: $NAME $VERSION_ID"
    fi
}

# ЭТАП 1: Подготовка системы
stage_1_prepare() {
    log_info "=== ЭТАП 1: Подготовка системы ==="
    
    # 1.1 Обновление системы
    log_info "[1/6] Обновление пакетов..."
    apt-get update -qq
    apt-get upgrade -y -qq
    
    # 1.2 Установка базовых зависимостей
    log_info "[2/6] Установка базовых пакетов..."
    apt-get install -y -qq \
        curl \
        wget \
        git \
        vim \
        nano \
        htop \
        tree \
        ufw \
        fail2ban \
        logrotate \
        cron \
        supervisor || true
    
    # 1.3 Настройка timezone
    log_info "[3/6] Настройка timezone..."
    timedatectl set-timezone UTC || true
    
    # 1.4 Создание пользователя
    log_info "[4/6] Создание пользователя $USER..."
    if ! id "$USER" &>/dev/null; then
        useradd -m -s /bin/bash "$USER"
        usermod -aG sudo "$USER" 2>/dev/null || true
        log_success "Пользователь $USER создан"
    else
        log_warning "Пользователь $USER уже существует"
    fi
    
    # 1.5 Создание директорий
    log_info "[5/6] Создание директорий..."
    mkdir -p "$INSTALL_DIR"/{app,data,config,scripts,docker}
    mkdir -p "$DATA_DIR"/{logs,articles,backups,cache}
    mkdir -p "$LOG_DIR"
    
    # 1.6 Настройка прав
    log_info "[6/6] Настройка прав..."
    chown -R "$USER:$USER" "$INSTALL_DIR"
    chown -R "$USER:$USER" "$LOG_DIR"
    chmod 755 "$INSTALL_DIR"
    
    log_success "ЭТАП 1 завершён"
}

# ЭТАП 2: Установка Node.js
stage_2_nodejs() {
    log_info "=== ЭТАП 2: Установка Node.js ==="
    
    # 2.1 Проверка, установлен ли уже Node.js
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_CURRENT" -ge "18" ]]; then
            log_warning "Node.js уже установлен: $(node --version)"
            return 0
        fi
    fi
    
    # 2.2 Установка Node.js через NodeSource
    log_info "[1/3] Установка Node.js $NODE_VERSION..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt-get install -y -qq nodejs
    
    # 2.3 Проверка
    log_info "[2/3] Проверка установки..."
    node --version
    npm --version
    
    # 2.4 Установка глобальных пакетов
    log_info "[3/3] Установка глобальных пакетов..."
    npm install -g npm@latest
    npm install -g pm2
    
    log_success "Node.js $(node --version) установлен"
}

# ЭТАП 3: Клонирование проекта
stage_3_clone() {
    log_info "=== ЭТАП 3: Клонирование проекта ==="
    
    # Определение источника кода
    # По умолчанию - локальная копия
    if [[ -d "/home/debian/sereja-blog-project" ]]; then
        log_info "[1/2] Копирование локального проекта..."
        cp -r /home/debian/sereja-blog-project/* "$APP_DIR/"
    else
        log_info "[1/2] Клонирование из репозитория..."
        # Здесь можно указать URL репозитория
        # git clone https://github.com/user/auto-blog.git "$APP_DIR"
        log_error "Локальный проект не найден!"
        exit 1
    fi
    
    # 3.2 Установка прав
    log_info "[2/2] Настройка прав..."
    chown -R "$USER:$USER" "$APP_DIR"
    
    log_success "Проект размещён в $APP_DIR"
}

# ЭТАП 4: Установка зависимостей
stage_4_dependencies() {
    log_info "=== ЭТАП 4: Установка зависимостей ==="
    
    cd "$APP_DIR"
    
    # 4.1 Основные зависимости
    log_info "[1/3] Установка npm пакетов (основные)..."
    sudo -u "$USER" npm ci --production --silent
    
    # 4.2 Зависимости сайта
    log_info "[2/3] Установка npm пакетов (сайт)..."
    cd "$APP_DIR/website"
    sudo -u "$USER" npm ci --production --silent
    
    # 4.3 Проверка
    log_info "[3/3] Проверка..."
    cd "$APP_DIR"
    sudo -u "$USER" npm list --depth=0 2>/dev/null || true
    
    log_success "Зависимости установлены"
}

# ЭТАП 5: Конфигурация
stage_5_configure() {
    log_info "=== ЭТАП 5: Конфигурация ==="
    
    # 5.1 Создание .env
    log_info "[1/4] Создание конфигурации..."
    if [[ ! -f "$APP_DIR/.env" ]]; then
        if [[ -f "$APP_DIR/.env.example" ]]; then
            cp "$APP_DIR/.env.example" "$APP_DIR/.env"
            chown "$USER:$USER" "$APP_DIR/.env"
            chmod 600 "$APP_DIR/.env"
            log_warning "⚠️  Создан .env файл. Нужно отредактировать и добавить API ключи!"
        fi
    fi
    
    # 5.2 Создание директорий для данных
    log_info "[2/4] Создание директорий данных..."
    mkdir -p "$DATA_DIR"/{logs,articles,backups,cache}
    chown -R "$USER:$USER" "$DATA_DIR"
    chmod 755 "$DATA_DIR"
    
    # 5.3 Настройка логов
    log_info "[3/4] Настройка логирования..."
    mkdir -p "$LOG_DIR"
    chown -R "$USER:$USER" "$LOG_DIR"
    chmod 755 "$LOG_DIR"
    
    # 5.4 Создание симлинков на логи AI агентов (если существуют)
    log_info "[4/4] Настройка путей к логам AI..."
    if [[ -d "/home/$USER/.claude/logs" ]]; then
        ln -sf "/home/$USER/.claude/logs" "$DATA_DIR/logs/claude" 2>/dev/null || true
        log_info "Подключены логи Claude Code"
    fi
    
    if [[ -d "/home/$USER/.opencode/logs" ]]; then
        ln -sf "/home/$USER/.opencode/logs" "$DATA_DIR/logs/opencode" 2>/dev/null || true
        log_info "Подключены логи OpenCode"
    fi
    
    log_success "Конфигурация завершена"
}

# ЭТАП 6: Настройка автозапуска
stage_6_autostart() {
    log_info "=== ЭТАП 6: Настройка автозапуска ==="
    
    # 6.1 Создание systemd сервиса для PM2
    log_info "[1/4] Настройка PM2..."
    
    # Установка PM2 если ещё не установлен
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # Настройка PM2 для systemd
    env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$USER" --hp "/home/$USER" || true
    
    # 6.2 Создание ecosystem файла для PM2
    log_info "[2/4] Создание PM2 ecosystem..."
    
    cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'auto-blog',
    script: './src/agents/server.js',
    cwd: '/opt/auto-blog/app',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/auto-blog/app.log',
    out_file: '/var/log/auto-blog/out.log',
    error_file: '/var/log/auto-blog/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    chown "$USER:$USER" "$APP_DIR/ecosystem.config.js"
    
    # 6.3 Настройка cron
    log_info "[3/4] Настройка cron..."
    
    cat > /tmp/auto-blog-cron << EOF
# Auto Blog System - Cron задачи
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
HOME=/home/$USER

# Генерация идей каждый день в 9:00
0 9 * * * cd $APP_DIR && npm run extract-ideas >> $LOG_DIR/cron-extract.log 2>&1

# Бэкап каждый день в 2:00
0 2 * * * $INSTALL_DIR/scripts/backup.sh >> $LOG_DIR/backup.log 2>&1

# Очистка старых логов каждую неделю
0 3 * * 0 find $LOG_DIR -name "*.log" -type f -mtime +7 -delete

# Проверка здоровья каждые 10 минут
*/10 * * * * $INSTALL_DIR/scripts/health-check.sh >> $LOG_DIR/health.log 2>&1
EOF
    
    crontab -u "$USER" /tmp/auto-blog-cron
    rm /tmp/auto-blog-cron
    
    # 6.4 Настройка logrotate
    log_info "[4/4] Настройка logrotate..."
    
    cat > /etc/logrotate.d/auto-blog << EOF
$LOG_DIR/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs || true
    endscript
}
EOF
    
    log_success "Автозапуск настроен"
}

# ЭТАП 7: Проверка установки
stage_7_verify() {
    log_info "=== ЭТАП 7: Проверка установки ==="
    
    local ERRORS=0
    
    # 7.1 Node.js
    log_info "[1/6] Проверка Node.js..."
    if command -v node &> /dev/null; then
        log_success "Node.js: $(node --version)"
    else
        log_error "Node.js не найден!"
        ((ERRORS++))
    fi
    
    # 7.2 Директории
    log_info "[2/6] Проверка директорий..."
    for dir in "$APP_DIR" "$DATA_DIR" "$LOG_DIR"; do
        if [[ -d "$dir" ]]; then
            log_success "✓ $dir"
        else
            log_error "✗ $dir не найден!"
            ((ERRORS++))
        fi
    done
    
    # 7.3 Зависимости
    log_info "[3/6] Проверка зависимостей..."
    if [[ -d "$APP_DIR/node_modules" ]]; then
        log_success "✓ node_modules установлены"
    else
        log_error "✗ node_modules не найдены!"
        ((ERRORS++))
    fi
    
    # 7.4 Конфигурация
    log_info "[4/6] Проверка конфигурации..."
    if [[ -f "$APP_DIR/.env" ]]; then
        log_success "✓ .env существует"
        # Проверка что он не пустой
        if grep -q "ANTHROPIC_API_KEY=your_" "$APP_DIR/.env"; then
            log_warning "⚠️  .env содержит заглушки! Нужно добавить реальные API ключи"
        fi
    else
        log_warning "⚠️  .env не найден!"
    fi
    
    # 7.5 Cron
    log_info "[5/6] Проверка cron..."
    if crontab -u "$USER" -l | grep -q "auto-blog"; then
        log_success "✓ Cron задачи настроены"
    else
        log_warning "⚠️  Cron задачи не найдены"
    fi
    
    # 7.6 Пользователь
    log_info "[6/6] Проверка пользователя..."
    if id "$USER" &>/dev/null; then
        log_success "✓ Пользователь $USER существует"
    else
        log_error "✗ Пользователь $USER не найден!"
        ((ERRORS++))
    fi
    
    if [[ $ERRORS -eq 0 ]]; then
        log_success "Все проверки пройдены!"
        return 0
    else
        log_error "Обнаружено $ERRORS ошибок"
        return 1
    fi
}

# Главная функция
main() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     Auto Blog System - Installation Script                 ║"
    echo "║     For Server Agent VPS Deployment                        ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Проверки
    check_root
    check_os
    
    # Запрос подтверждения
    log_warning "Этот скрипт установит Auto Blog System в $INSTALL_DIR"
    log_warning "Пользователь: $USER"
    log_warning "Node.js: $NODE_VERSION"
    echo ""
    read -p "Продолжить установку? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Установка отменена"
        exit 0
    fi
    
    # Запуск этапов
    stage_1_prepare
    stage_2_nodejs
    stage_3_clone
    stage_4_dependencies
    stage_5_configure
    stage_6_autostart
    stage_7_verify
    
    # Финальное сообщение
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     ✅ УСТАНОВКА ЗАВЕРШЕНА!                                ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📁 Директория: $INSTALL_DIR"
    echo "👤 Пользователь: $USER"
    echo "📊 Логи: $LOG_DIR"
    echo ""
    echo "⚠️  ВАЖНО: Для завершения настройки:"
    echo "   1. Отредактируйте $APP_DIR/.env"
    echo "   2. Добавьте ANTHROPIC_API_KEY"
    echo "   3. Добавьте EXA_API_KEY (уже есть: dc2820...)"
    echo ""
    echo "🚀 Быстрый старт:"
    echo "   sudo su - $USER"
    echo "   cd $APP_DIR"
    echo "   npm run generate-post 'Тестовая тема'"
    echo ""
    echo "📖 Документация: $APP_DIR/docs/"
    echo ""
}

# Запуск
main "$@"
