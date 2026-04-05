#!/bin/bash
# SIGAH - Recovery Scripts para Apagones y Recuperación
# Uso: ./recovery.sh [start|stop|restart|status|backup|restore]

set -e

# Configuración
COMPOSE_FILE="docker-compose.full-docker.yml"
PROJECT_NAME="sigah"
BACKUP_DIR="/opt/sigah/backups"
LOG_DIR="/opt/sigah/logs/recovery"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Crear directorios necesarios
create_directories() {
    log_info "Creando directorios necesarios..."
    mkdir -p $BACKUP_DIR/{postgres,redis,config}
    mkdir -p $LOG_DIR
    mkdir -p /opt/sigah/data/{postgres,redis,uploads}
    mkdir -p /opt/sigah/logs/{nginx,backend}
    chmod 755 /opt/sigah/data
    chmod 755 /opt/sigah/logs
    log_success "Directorios creados"
}

# Verificar estado del sistema
check_status() {
    log_info "Verificando estado del sistema..."
    
    echo "=== Docker Status ==="
    docker --version
    docker-compose --version
    
    echo "=== Contenedores SIGAH ==="
    docker-compose -f $COMPOSE_FILE ps
    
    echo "=== Redes Docker ==="
    docker network ls | grep sigah
    
    echo "=== Volúmenes ==="
    docker volume ls | grep sigah
    
    echo "=== Consumo de Recursos ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Iniciar sistema
start_system() {
    log_info "Iniciando sistema SIGAH..."
    
    # Verificar que Docker está corriendo
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker no está corriendo. Por favor inicie Docker."
        exit 1
    fi
    
    # Crear directorios
    create_directories
    
    # Iniciar redes primero
    log_info "Creando redes Docker..."
    docker network create sigah-network 2>/dev/null || true
    docker network create tomcat-network 2>/dev/null || true
    
    # Iniciar servicios en orden
    log_info "Iniciando servicios críticos..."
    docker-compose -f $COMPOSE_FILE up -d sigah-db sigah-redis
    
    # Esperar a que base de datos esté lista
    log_info "Esperando a que base de datos esté lista..."
    sleep 30
    
    # Iniciar backend
    log_info "Iniciando backend..."
    docker-compose -f $COMPOSE_FILE up -d sigah-backend
    
    # Esperar a que backend esté listo
    sleep 20
    
    # Iniciar frontend y proxy
    log_info "Iniciando frontend y proxy..."
    docker-compose -f $COMPOSE_FILE up -d sigah-frontend nginx-proxy
    
    # Verificar health checks
    log_info "Verificando health checks..."
    sleep 30
    
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Sistema SIGAH iniciado correctamente"
    else
        log_error "El sistema no está respondiendo correctamente"
        check_status
        exit 1
    fi
}

# Detener sistema
stop_system() {
    log_info "Deteniendo sistema SIGAH..."
    
    # Detener en orden inverso
    docker-compose -f $COMPOSE_FILE down
    
    log_success "Sistema detenido"
}

# Reiniciar sistema
restart_system() {
    log_info "Reiniciando sistema SIGAH..."
    stop_system
    sleep 10
    start_system
}

# Backup completo
backup_system() {
    log_info "Iniciando backup completo del sistema..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/sigah_backup_$TIMESTAMP.tar.gz"
    
    # Crear directorio temporal
    TEMP_DIR="/tmp/sigah_backup_$TIMESTAMP"
    mkdir -p $TEMP_DIR
    
    # Backup de base de datos
    log_info "Backup de base de datos PostgreSQL..."
    docker-compose -f $COMPOSE_FILE exec -T sigah-db pg_dump -U sigah sigah > $TEMP_DIR/postgres_$TIMESTAMP.sql
    
    # Backup de Redis
    log_info "Backup de Redis..."
    docker-compose -f $COMPOSE_FILE exec -T sigah-redis redis-cli BGSAVE
    sleep 5
    docker cp sigah-redis:/data/dump.rdb $TEMP_DIR/redis_$TIMESTAMP.rdb
    
    # Backup de configuración
    log_info "Backup de configuraciones..."
    cp -r nginx $TEMP_DIR/
    cp .env $TEMP_DIR/
    cp $COMPOSE_FILE $TEMP_DIR/
    
    # Backup de volúmenes de datos
    log_info "Backup de volúmenes de datos..."
    tar -czf $TEMP_DIR/data_volumes.tar.gz -C /opt/sigah data/
    
    # Comprimir todo
    log_info "Comprimiendo backup..."
    tar -czf $BACKUP_FILE -C $TEMP_DIR .
    
    # Limpiar temporal
    rm -rf $TEMP_DIR
    
    # Verificar backup
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h $BACKUP_FILE | cut -f1)
        log_success "Backup completado: $BACKUP_FILE ($SIZE)"
    else
        log_error "Error al crear backup"
        exit 1
    fi
}

# Restaurar sistema
restore_system() {
    if [ -z "$1" ]; then
        log_error "Debe especificar el archivo de backup: ./recovery.sh restore /path/to/backup.tar.gz"
        exit 1
    fi
    
    BACKUP_FILE=$1
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Archivo de backup no encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log_warning "¡ATENCIÓN! Esto restaurará el sistema desde backup y sobreescribirá datos actuales."
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operación cancelada"
        exit 0
    fi
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    TEMP_DIR="/tmp/sigah_restore_$TIMESTAMP"
    
    # Detener sistema
    log_info "Deteniendo sistema actual..."
    stop_system
    
    # Extraer backup
    log_info "Extrayendo backup..."
    mkdir -p $TEMP_DIR
    tar -xzf $BACKUP_FILE -C $TEMP_DIR
    
    # Restaurar configuración
    log_info "Restaurando configuración..."
    cp $TEMP_DIR/.env .
    cp $TEMP_DIR/docker-compose*.yml .
    
    # Restaurar volúmenes de datos
    log_info "Restaurando volúmenes de datos..."
    if [ -f "$TEMP_DIR/data_volumes.tar.gz" ]; then
        tar -xzf $TEMP_DIR/data_volumes.tar.gz -C /opt/sigah
    fi
    
    # Iniciar sistema base
    log_info "Iniciando servicios base..."
    docker-compose -f $COMPOSE_FILE up -d sigah-db sigah-redis
    sleep 30
    
    # Restaurar base de datos
    if [ -f "$TEMP_DIR/postgres_*.sql" ]; then
        log_info "Restaurando base de datos..."
        docker-compose -f $COMPOSE_FILE exec -T sigah-db psql -U sigah -c "DROP DATABASE IF EXISTS sigah;"
        docker-compose -f $COMPOSE_FILE exec -T sigah-db psql -U sigah -c "CREATE DATABASE sigah;"
        docker-compose -f $COMPOSE_FILE exec -T sigah-db psql -U sigah sigah < $TEMP_DIR/postgres_*.sql
    fi
    
    # Restaurar Redis
    if [ -f "$TEMP_DIR/redis_*.rdb" ]; then
        log_info "Restaurando Redis..."
        docker cp $TEMP_DIR/redis_*.rdb sigah-redis:/data/dump.rdb
        docker-compose -f $COMPOSE_FILE restart sigah-redis
        sleep 10
    fi
    
    # Iniciar sistema completo
    log_info "Iniciando sistema completo..."
    start_system
    
    # Limpiar
    rm -rf $TEMP_DIR
    
    log_success "Sistema restaurado desde backup"
}

# Recuperación de desastres
disaster_recovery() {
    log_warning "Iniciando modo recuperación de desastres..."
    
    # Verificar estado actual
    check_status
    
    # Intentar reparar redes
    log_info "Reparando redes Docker..."
    docker network rm sigah-network 2>/dev/null || true
    docker network rm tomcat-network 2>/dev/null || true
    docker network create sigah-network 2>/dev/null || true
    docker network create tomcat-network 2>/dev/null || true
    
    # Limpiar contenedores zombies
    log_info "Limpiando contenedores problemáticos..."
    docker container prune -f
    
    # Reiniciar sistema
    restart_system
    
    log_success "Recuperación de desastres completada"
}

# Monitoreo de salud
health_monitor() {
    log_info "Iniciando monitoreo de salud..."
    
    # Health checks
    echo "=== Health Checks ==="
    
    # Nginx proxy
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "✓ Nginx Proxy OK"
    else
        log_error "✗ Nginx Proxy FALLÓ"
    fi
    
    # Tomcat (si está disponible)
    if curl -f http://localhost/health/tomcat > /dev/null 2>&1; then
        log_success "✓ Tomcat OK"
    else
        log_warning "⚠ Tomcat no responde (puede ser normal si no está integrado)"
    fi
    
    # SIGAH backend
    if curl -f http://localhost/health/sigah > /dev/null 2>&1; then
        log_success "✓ SIGAH Backend OK"
    else
        log_error "✗ SIGAH Backend FALLÓ"
    fi
    
    # Verificar contenedores
    echo "=== Estado de Contenedores ==="
    docker-compose -f $COMPOSE_FILE ps
}

# Menú principal
case "$1" in
    start)
        start_system
        ;;
    stop)
        stop_system
        ;;
    restart)
        restart_system
        ;;
    status)
        check_status
        ;;
    backup)
        backup_system
        ;;
    restore)
        restore_system "$2"
        ;;
    monitor)
        health_monitor
        ;;
    disaster)
        disaster_recovery
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|backup|restore|monitor|disaster}"
        echo ""
        echo "Comandos:"
        echo "  start     - Iniciar sistema SIGAH"
        echo "  stop      - Detener sistema SIGAH"
        echo "  restart   - Reiniciar sistema SIGAH"
        echo "  status    - Verificar estado del sistema"
        echo "  backup    - Crear backup completo"
        echo "  restore   - Restaurar desde backup (requiere archivo)"
        echo "  monitor   - Monitoreo de salud del sistema"
        echo "  disaster  - Recuperación de desastres"
        echo ""
        echo "Ejemplos:"
        echo "  $0 start"
        echo "  $0 backup"
        echo "  $0 restore /opt/sigah/backups/sigah_backup_20241201_120000.tar.gz"
        exit 1
        ;;
esac
