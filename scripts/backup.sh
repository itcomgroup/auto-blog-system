#!/bin/bash
#
# Backup Script for Auto Blog System
# Создаёт резервные копии данных
#

INSTALL_DIR="/opt/auto-blog"
DATA_DIR="$INSTALL_DIR/data"
APP_DIR="$INSTALL_DIR/app"
BACKUP_DIR="$DATA_DIR/backups"
USER="autoblog"

# Настройки
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="auto-blog-backup-$DATE"
RETENTION_DAYS=30

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Создание бэкапа
create_backup() {
    log_info "Создание бэкапа: $BACKUP_NAME"
    
    # Создаём временную директорию
    TMP_DIR=$(mktemp -d)
    
    # Копируем данные
    log_info "Копирование статей..."
    cp -r "$DATA_DIR/articles" "$TMP_DIR/" 2>/dev/null || true
    
    log_info "Копирование логов..."
    cp -r "$DATA_DIR/logs" "$TMP_DIR/" 2>/dev/null || true
    
    log_info "Копирование конфигурации..."
    cp "$APP_DIR/.env" "$TMP_DIR/" 2>/dev/null || true
    cp "$APP_DIR/package.json" "$TMP_DIR/" 2>/dev/null || true
    
    log_info "Копирование сгенерированных статей..."
    cp -r "$APP_DIR/output" "$TMP_DIR/" 2>/dev/null || true
    
    # Архивируем
    log_info "Архивация..."
    cd "$TMP_DIR"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" .
    
    # Удаляем временную директорию
    rm -rf "$TMP_DIR"
    
    # Проверяем размер
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)
    log_info "Бэкап создан: $BACKUP_NAME.tar.gz ($BACKUP_SIZE)"
}

# Очистка старых бэкапов
cleanup_old_backups() {
    log_info "Очистка старых бэкапов (старше $RETENTION_DAYS дней)..."
    
    DELETED=$(find "$BACKUP_DIR" -name "auto-blog-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    log_info "Удалено старых бэкапов: $DELETED"
}

# Проверка свободного места
check_disk_space() {
    AVAILABLE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    USAGE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log_info "Свободно на диске: $AVAILABLE"
    
    if [[ $USAGE -gt 90 ]]; then
        log_error "Мало места на диске! ($USAGE% использовано)"
        exit 1
    fi
}

# Список бэкапов
list_backups() {
    log_info "Список бэкапов:"
    ls -lh "$BACKUP_DIR"/auto-blog-backup-*.tar.gz 2>/dev/null || log_warn "Бэкапы не найдены"
}

# Главная функция
main() {
    echo "╔════════════════════════════════════════════════╗"
    echo "║     Auto Blog System - Backup                  ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "Дата: $(date)"
    echo ""
    
    # Создаём директорию для бэкапов
    mkdir -p "$BACKUP_DIR"
    chown "$USER:$USER" "$BACKUP_DIR"
    
    # Проверка места
    check_disk_space
    echo ""
    
    # Создание бэкапа
    create_backup
    echo ""
    
    # Очистка старых
    cleanup_old_backups
    echo ""
    
    # Список
    list_backups
    echo ""
    
    log_info "Бэкап завершён!"
}

main "$@"
