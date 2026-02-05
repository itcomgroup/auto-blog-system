#!/bin/bash
#
# API Key Security Checker
# Проверка безопасности API ключей на сервере
#

INSTALL_DIR="/opt/auto-blog"
APP_DIR="$INSTALL_DIR/app"
LOG_DIR="/var/log/auto-blog"
USER="autoblog"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

log_header() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

# 1. Проверка прав доступа к .env
check_env_permissions() {
    log_header "Проверка прав доступа к .env"
    
    if [ ! -f "$APP_DIR/.env" ]; then
        log_error ".env файл не найден!"
        return
    fi
    
    # Проверка прав
    PERMS=$(stat -c "%a" "$APP_DIR/.env")
    OWNER=$(stat -c "%U" "$APP_DIR/.env")
    
    if [ "$PERMS" = "600" ]; then
        log_info "Права доступа .env: 600 (корректно)"
    else
        log_error "Права доступа .env: $PERMS (должно быть 600)"
        log_info "Исправить: chmod 600 $APP_DIR/.env"
    fi
    
    if [ "$OWNER" = "$USER" ]; then
        log_info "Владелец .env: $OWNER (корректно)"
    else
        log_warn "Владелец .env: $OWNER (рекомендуется: $USER)"
    fi
}

# 2. Проверка .gitignore
check_gitignore() {
    log_header "Проверка .gitignore"
    
    if [ ! -f "$APP_DIR/.gitignore" ]; then
        log_error ".gitignore не найден!"
        return
    fi
    
    if grep -q "^\.env$" "$APP_DIR/.gitignore"; then
        log_info ".env добавлен в .gitignore"
    else
        log_error ".env НЕ добавлен в .gitignore!"
        log_info "Исправить: echo '.env' >> $APP_DIR/.gitignore"
    fi
    
    # Проверка других чувствительных файлов
    SENSITIVE_PATTERNS=("*.key" "*.pem" "*.cert" ".env.local" ".env.production")
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -q "$pattern" "$APP_DIR/.gitignore"; then
            log_info "$pattern в .gitignore"
        fi
    done
}

# 3. Проверка на утечки в логах
check_logs_for_leaks() {
    log_header "Проверка логов на утечки API ключей"
    
    # Паттерны API ключей
    PATTERNS=(
        "sk-ant-[a-zA-Z0-9]{20,}"
        "exa-[a-zA-Z0-9-]{20,}"
    )
    
    LEAKS_FOUND=0
    
    # Проверяем логи
    for logfile in "$LOG_DIR"/*.log; do
        if [ -f "$logfile" ]; then
            for pattern in "${PATTERNS[@]}"; do
                if grep -q -E "$pattern" "$logfile" 2>/dev/null; then
                    log_error "Найдены API ключи в: $(basename $logfile)"
                    grep -n -E "$pattern" "$logfile" | head -3
                    LEAKS_FOUND=$((LEAKS_FOUND + 1))
                fi
            done
        fi
    done
    
    if [ $LEAKS_FOUND -eq 0 ]; then
        log_info "Утечек API ключей в логах не обнаружено"
    else
        log_error "Обнаружено $LEAKS_FOUND файлов с утечками!"
        log_info "Очистить логи: truncate -s 0 $LOG_DIR/*.log"
    fi
}

# 4. Проверка bash_history
check_bash_history() {
    log_header "Проверка истории команд"
    
    HISTORY_FILES=(
        "/home/$USER/.bash_history"
        "/home/$USER/.zsh_history"
        "/root/.bash_history"
    )
    
    for histfile in "${HISTORY_FILES[@]}"; do
        if [ -f "$histfile" ]; then
            if grep -q -E "(sk-ant-|exa-|API_KEY=)" "$histfile" 2>/dev/null; then
                log_warn "Найдены API ключи в: $histfile"
                log_info "Очистить: grep -v 'sk-ant-' $histfile > temp && mv temp $histfile"
            fi
        fi
    done
    
    log_info "Проверка истории команд завершена"
}

# 5. Проверка запущенных процессов
check_processes() {
    log_header "Проверка запущенных процессов"
    
    # Проверяем, что процессы запущены от правильного пользователя
    NODE_PROCESSES=$(ps aux | grep "node" | grep -v grep | wc -l)
    
    if [ "$NODE_PROCESSES" -gt 0 ]; then
        log_info "Node.js процессов: $NODE_PROCESSES"
        
        # Проверяем владельца процессов
        ps aux | grep "node" | grep -v grep | awk '{print $1}' | sort | uniq -c | while read count user; do
            if [ "$user" = "root" ]; then
                log_warn "Node.js процессы запущены от root: $count"
            elif [ "$user" = "$USER" ]; then
                log_info "Node.js процессы от $user: $count (корректно)"
            fi
        done
    else
        log_warn "Node.js процессы не найдены"
    fi
}

# 6. Проверка API ключей
check_api_keys() {
    log_header "Проверка API ключей"
    
    if [ ! -f "$APP_DIR/.env" ]; then
        log_error ".env не найден"
        return
    fi
    
    # Проверка ANTHROPIC_API_KEY
    if grep -q "^ANTHROPIC_API_KEY=" "$APP_DIR/.env"; then
        KEY=$(grep "^ANTHROPIC_API_KEY=" "$APP_DIR/.env" | cut -d'=' -f2)
        if [ -z "$KEY" ] || [ "$KEY" = "your_claude_api_key_here" ]; then
            log_warn "ANTHROPIC_API_KEY не настроен (заглушка)"
        elif [[ "$KEY" =~ ^sk-ant-[a-zA-Z0-9]+$ ]]; then
            MASKED="${KEY:0:8}***${KEY: -4}"
            log_info "ANTHROPIC_API_KEY настроен: $MASKED"
        else
            log_error "ANTHROPIC_API_KEY имеет неверный формат"
        fi
    else
        log_error "ANTHROPIC_API_KEY не найден в .env"
    fi
    
    # Проверка EXA_API_KEY
    if grep -q "^EXA_API_KEY=" "$APP_DIR/.env"; then
        KEY=$(grep "^EXA_API_KEY=" "$APP_DIR/.env" | cut -d'=' -f2)
        if [ -z "$KEY" ] || [ "$KEY" = "your_exa_api_key_here" ]; then
            log_warn "EXA_API_KEY не настроен (заглушка)"
        else
            MASKED="${KEY:0:8}***${KEY: -4}"
            log_info "EXA_API_KEY настроен: $MASKED"
        fi
    else
        log_warn "EXA_API_KEY не найден в .env"
    fi
}

# 7. Проверка директорий
check_directories() {
    log_header "Проверка директорий"
    
    DIRS=(
        "$INSTALL_DIR:755:$USER"
        "$APP_DIR:755:$USER"
        "$LOG_DIR:755:$USER"
        "$INSTALL_DIR/data:755:$USER"
    )
    
    for dir_spec in "${DIRS[@]}"; do
        IFS=':' read -r dir perms owner <<< "$dir_spec"
        
        if [ ! -d "$dir" ]; then
            log_error "Директория не найдена: $dir"
            continue
        fi
        
        ACTUAL_PERMS=$(stat -c "%a" "$dir")
        ACTUAL_OWNER=$(stat -c "%U" "$dir")
        
        if [ "$ACTUAL_PERMS" = "$perms" ]; then
            log_info "$dir: права $ACTUAL_PERMS (корректно)"
        else
            log_warn "$dir: права $ACTUAL_PERMS (рекомендуется $perms)"
        fi
        
        if [ "$ACTUAL_OWNER" = "$owner" ]; then
            log_info "$dir: владелец $ACTUAL_OWNER (корректно)"
        else
            log_warn "$dir: владелец $ACTUAL_OWNER (рекомендуется $owner)"
        fi
    done
}

# 8. Рекомендации
show_recommendations() {
    log_header "Рекомендации по безопасности"
    
    echo -e "\n1. Регулярно меняйте API ключи (ротация)"
    echo "   Скрипт: ./scripts/rotate-keys.sh"
    
    echo -e "\n2. Мониторьте расходы API"
    echo "   Проверка: ./scripts/monitor-api-usage.sh"
    
    echo -e "\n3. Настройте алерты при аномалиях"
    echo "   Добавьте в cron: */30 * * * * /opt/auto-blog/scripts/monitor-api-usage.sh"
    
    echo -e "\n4. Ограничьте доступ по IP (в панелях управления API)"
    echo "   Добавьте IP сервера в whitelist"
    
    echo -e "\n5. Включите двухфакторную аутентификацию"
    echo "   На всех сервисах: Anthropic, Exa, Telegram"
    
    echo -e "\n6. Регулярно проверяйте эту безопасность"
    echo "   Запуск: ./scripts/check-api-security.sh"
}

# Главная функция
main() {
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     API Key Security Checker                               ║"
    echo "║     Проверка безопасности API ключей                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Дата: $(date)"
    echo "Сервер: $(hostname)"
    echo ""
    
    check_env_permissions
    check_gitignore
    check_logs_for_leaks
    check_bash_history
    check_processes
    check_api_keys
    check_directories
    show_recommendations
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo "║     ✅ БЕЗОПАСНОСТЬ НА ВЫСОТЕ!                             ║"
    elif [ $ERRORS -eq 0 ]; then
        echo "║     ⚠️  ЕСТЬ ПРЕДУПРЕЖДЕНИЯ ($WARNINGS)                    ║"
    else
        echo "║     ❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ БЕЗОПАСНОСТИ                    ║"
        echo "║        Ошибок: $ERRORS | Предупреждений: $WARNINGS         ║"
    fi
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    if [ $ERRORS -gt 0 ]; then
        echo "⚠️  Требуется немедленное действие!"
        echo "   См. ошибки выше и исправьте их."
        exit 1
    fi
    
    exit 0
}

main "$@"
