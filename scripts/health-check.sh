#!/bin/bash
#
# Health Check Script for Auto Blog System
# Проверяет состояние системы и отправляет алерты если нужно
#

INSTALL_DIR="/opt/auto-blog"
APP_DIR="$INSTALL_DIR/app"
LOG_DIR="/var/log/auto-blog"
USER="autoblog"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Счётчики
ERRORS=0
WARNINGS=0

log_info() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERRORS++))
}

check_disk_space() {
    echo "=== Проверка дискового пространства ==="
    
    USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ $USAGE -gt 90 ]]; then
        log_error "Диск заполнен на $USAGE%!"
    elif [[ $USAGE -gt 80 ]]; then
        log_warn "Диск заполнен на $USAGE%"
    else
        log_info "Диск: $USAGE% использовано"
    fi
}

check_memory() {
    echo "=== Проверка памяти ==="
    
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [[ $MEM_USAGE -gt 90 ]]; then
        log_error "Память использована на $MEM_USAGE%!"
    elif [[ $MEM_USAGE -gt 80 ]]; then
        log_warn "Память использована на $MEM_USAGE%"
    else
        log_info "Память: $MEM_USAGE% использовано"
    fi
}

check_processes() {
    echo "=== Проверка процессов ==="
    
    # Проверка PM2 процессов
    if pgrep -x "PM2" > /dev/null; then
        log_info "PM2 запущен"
    else
        log_warn "PM2 не запущен"
    fi
    
    # Проверка Node.js процессов
    NODE_COUNT=$(pgrep -c node)
    if [[ $NODE_COUNT -gt 0 ]]; then
        log_info "Node.js процессов: $NODE_COUNT"
    else
        log_warn "Node.js процессы не найдены"
    fi
}

check_logs() {
    echo "=== Проверка логов ==="
    
    # Проверка наличия логов
    if [[ -d "$LOG_DIR" ]]; then
        LOG_COUNT=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
        log_info "Лог файлов: $LOG_COUNT"
    else
        log_error "Директория логов не найдена: $LOG_DIR"
    fi
    
    # Проверка ошибок в логах за последний час
    if [[ -f "$LOG_DIR/app.log" ]]; then
        ERROR_COUNT=$(grep -c "ERROR" "$LOG_DIR/app.log" 2>/dev/null || echo "0")
        if [[ $ERROR_COUNT -gt 0 ]]; then
            log_warn "Найдено $ERROR_COUNT ошибок в app.log"
        fi
    fi
}

check_api_keys() {
    echo "=== Проверка API ключей ==="
    
    if [[ -f "$APP_DIR/.env" ]]; then
        # Проверка ANTHROPIC_API_KEY
        if grep -q "ANTHROPIC_API_KEY=sk-ant-" "$APP_DIR/.env"; then
            log_info "ANTHROPIC_API_KEY настроен"
        else
            log_warn "ANTHROPIC_API_KEY не настроен (или заглушка)"
        fi
        
        # Проверка EXA_API_KEY
        if grep -q "EXA_API_KEY=" "$APP_DIR/.env"; then
            log_info "EXA_API_KEY настроен"
        else
            log_warn "EXA_API_KEY не настроен"
        fi
    else
        log_error ".env файл не найден!"
    fi
}

check_files() {
    echo "=== Проверка файлов ==="
    
    # Проверка директорий
    for dir in "$APP_DIR" "$INSTALL_DIR/data" "$LOG_DIR"; do
        if [[ -d "$dir" ]]; then
            log_info "✓ $dir"
        else
            log_error "✗ $dir не найден"
        fi
    done
    
    # Проверка node_modules
    if [[ -d "$APP_DIR/node_modules" ]]; then
        log_info "✓ node_modules установлены"
    else
        log_error "✗ node_modules не найдены"
    fi
}

check_cron() {
    echo "=== Проверка cron ==="
    
    if crontab -u "$USER" -l 2>/dev/null | grep -q "auto-blog"; then
        log_info "Cron задачи настроены"
    else
        log_warn "Cron задачи не найдены"
    fi
}

# Главная функция
main() {
    echo "╔════════════════════════════════════════════════╗"
    echo "║     Auto Blog System - Health Check            ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Дата: $(date)"
    echo ""
    
    check_disk_space
    echo ""
    check_memory
    echo ""
    check_processes
    echo ""
    check_logs
    echo ""
    check_api_keys
    echo ""
    check_files
    echo ""
    check_cron
    echo ""
    
    # Итог
    echo "╔════════════════════════════════════════════════╗"
    if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
        echo "║     ✅ СИСТЕМА ЗДОРОВА                         ║"
    elif [[ $ERRORS -eq 0 ]]; then
        echo "║     ⚠️  ЕСТЬ ПРЕДУПРЕЖДЕНИЯ ($WARNINGS)        ║"
    else
        echo "║     ❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ                     ║"
        echo "║        Ошибок: $ERRORS | Предупреждений: $WARNINGS          ║"
    fi
    echo "╚════════════════════════════════════════════════╝"
    
    exit $ERRORS
}

main "$@"
