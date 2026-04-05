#!/bin/bash
# SIGAH - DevOps Workflow Script
# Gestión completa de entornos Dev/Staging/Prod

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
PROJECT_NAME="sigah"
BASE_DIR="/opt/sigah"
LOG_FILE="$BASE_DIR/logs/devops.log"

# Funciones de logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log_info() {
    echo -e "${PURPLE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Crear estructura de directorios
setup_directories() {
    log "Creando estructura de directorios DevOps..."
    mkdir -p $BASE_DIR/{logs,backups,configs,scripts,monitoring}
    mkdir -p $BASE_DIR/logs/{dev,staging,prod}
    mkdir -p $BASE_DIR/backups/{dev,staging,prod}
    mkdir -p $BASE_DIR/monitoring/{prometheus,grafana}
    log_success "Estructura de directorios creada"
}

# Entorno de Desarrollo
start_dev() {
    log "Iniciando entorno de DESARROLLO..."
    
    # Detener otros entornos
    stop_staging 2>/dev/null || true
    stop_prod 2>/dev/null || true
    
    # Variables para desarrollo
    export COMPOSE_PROJECT_NAME=sigah-dev
    export NODE_ENV=development
    
    # Iniciar servicios de desarrollo
    cd $BASE_DIR
    docker-compose -f docker-compose.dev.new.yml up -d --build
    
    # Esperar a que los servicios estén listos
    log "Esperando servicios de desarrollo..."
    sleep 30
    
    # Verificar health checks
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Backend desarrollo listo: http://localhost:3001"
    else
        log_error "Backend desarrollo no responde"
        return 1
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend desarrollo listo: http://localhost:3000"
    else
        log_error "Frontend desarrollo no responde"
        return 1
    fi
    
    # Herramientas de desarrollo
    log "Herramientas de desarrollo:"
    echo "  • pgAdmin: http://localhost:5050 (dev@sigah.com / dev123)"
    echo "  • Redis Commander: http://localhost:8081"
    echo "  • Backend API: http://localhost:3001/api/docs"
    
    log_success "Entorno de desarrollo iniciado completamente"
}

# Entorno de Staging
start_staging() {
    log "Iniciando entorno de STAGING/PRUEBAS..."
    
    # Detener otros entornos
    stop_dev 2>/dev/null || true
    stop_prod 2>/dev/null || true
    
    # Variables para staging
    export COMPOSE_PROJECT_NAME=sigah-staging
    export NODE_ENV=staging
    export STAGING_DB_PASSWORD="staging123"
    export STAGING_JWT_SECRET="staging-jwt-secret-2024"
    export STAGING_ALLOWED_ORIGINS="http://localhost:8080,https://staging.dominio.com"
    
    # Iniciar servicios de staging
    cd $BASE_DIR
    docker-compose -f docker-compose.staging.yml up -d --build
    
    # Esperar a que los servicios estén listos
    log "Esperando servicios de staging..."
    sleep 45
    
    # Verificar health checks
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log_success "Staging listo: http://localhost:8080"
    else
        log_error "Staging no responde"
        return 1
    fi
    
    # Herramientas de staging
    log "Herramientas de staging:"
    echo "  • Aplicación: http://localhost:8080/sigah/"
    echo "  • API: http://localhost:8080/sigah-api/health"
    echo "  • pgAdmin: http://localhost:5051"
    
    log_success "Entorno de staging iniciado completamente"
}

# Entorno de Producción
start_prod() {
    log "Iniciando entorno de PRODUCCIÓN..."
    
    # Verificar que tenemos credenciales
    if [ ! -f "$BASE_DIR/.env.prod" ]; then
        log_error "Archivo .env.prod no encontrado. Crear con credenciales de producción."
        return 1
    fi
    
    # Detener otros entornos
    stop_dev 2>/dev/null || true
    stop_staging 2>/dev/null || true
    
    # Cargar variables de producción
    source $BASE_DIR/.env.prod
    export COMPOSE_PROJECT_NAME=sigah-prod
    export NODE_ENV=production
    
    # Iniciar servicios de producción
    cd $BASE_DIR
    docker-compose -f docker-compose.subfolder.yml up -d --build
    
    # Esperar a que los servicios estén listos
    log "Esperando servicios de producción..."
    sleep 60
    
    # Verificar health checks
    if curl -f https://dominio.com/health > /dev/null 2>&1; then
        log_success "Producción lista: https://dominio.com"
    else
        log_error "Producción no responde"
        return 1
    fi
    
    log_success "Entorno de producción iniciado completamente"
}

# Funciones de detención
stop_dev() {
    log "Deteniendo entorno de desarrollo..."
    cd $BASE_DIR
    export COMPOSE_PROJECT_NAME=sigah-dev
    docker-compose -f docker-compose.dev.new.yml down
    log_success "Desarrollo detenido"
}

stop_staging() {
    log "Deteniendo entorno de staging..."
    cd $BASE_DIR
    export COMPOSE_PROJECT_NAME=sigah-staging
    docker-compose -f docker-compose.staging.yml down
    log_success "Staging detenido"
}

stop_prod() {
    log "Deteniendo entorno de producción..."
    cd $BASE_DIR
    export COMPOSE_PROJECT_NAME=sigah-prod
    docker-compose -f docker-compose.subfolder.yml down
    log_success "Producción detenido"
}

# Testing
run_tests() {
    log "Ejecutando tests automatizados..."
    
    cd $BASE_DIR
    
    # Tests backend
    log "Ejecutando tests backend..."
    docker-compose -f docker-compose.dev.new.yml exec sigah-backend-dev npm test
    
    # Tests frontend
    log "Ejecutando tests frontend..."
    docker-compose -f docker-compose.dev.new.yml exec sigah-frontend-dev npm test
    
    # E2E tests
    log "Ejecutando tests E2E..."
    docker-compose -f docker-compose.dev.new.yml exec sigah-frontend-dev npm run test:e2e
    
    log_success "Tests completados"
}

# Deploy automation
deploy_to_staging() {
    log "Iniciando deploy automatizado a staging..."
    
    # Backup actual de staging
    backup_staging
    
    # Pull latest code
    cd $BASE_DIR
    git pull origin main
    
    # Ejecutar tests
    run_tests
    
    # Deploy a staging
    start_staging
    
    # Verificación post-deploy
    log "Verificación post-deploy..."
    sleep 30
    
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log_success "Deploy a staging exitoso"
        
        # Notificación (opcional)
        if command -v notify-send &> /dev/null; then
            notify-send "SIGAH Deploy" "Deploy a staging exitoso"
        fi
    else
        log_error "Deploy a staging falló"
        return 1
    fi
}

deploy_to_prod() {
    log "Iniciando deploy automatizado a producción..."
    
    # Verificación manual
    echo "⚠️  ESTÁS POR DEPLOYAR A PRODUCCIÓN"
    read -p "¿Confirmas que quieres continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy cancelado"
        return 0
    fi
    
    # Backup actual de producción
    backup_prod
    
    # Pull latest code
    cd $BASE_DIR
    git pull origin main
    
    # Ejecutar tests
    run_tests
    
    # Deploy a producción
    start_prod
    
    # Verificación post-deploy
    log "Verificación post-deploy producción..."
    sleep 60
    
    if curl -f https://dominio.com/health > /dev/null 2>&1; then
        log_success "Deploy a producción exitoso"
        
        # Notificación
        if command -v notify-send &> /dev/null; then
            notify-send "SIGAH PROD DEPLOY" "Deploy a producción exitoso"
        fi
    else
        log_error "Deploy a producción falló - INICIANDO ROLLBACK"
        rollback_prod
        return 1
    fi
}

# Backup functions
backup_dev() {
    log "Creando backup de desarrollo..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BASE_DIR/backups/dev/sigah_dev_$TIMESTAMP.sql"
    
    docker-compose -f docker-compose.dev.new.yml exec -T sigah-db-dev pg_dump -U sigah sigah_dev > $BACKUP_FILE
    
    log_success "Backup de desarrollo creado: $BACKUP_FILE"
}

backup_staging() {
    log "Creando backup de staging..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BASE_DIR/backups/staging/sigah_staging_$TIMESTAMP.sql"
    
    docker-compose -f docker-compose.staging.yml exec -T sigah-db-staging pg_dump -U sigah sigah_staging > $BACKUP_FILE
    
    log_success "Backup de staging creado: $BACKUP_FILE"
}

backup_prod() {
    log "Creando backup de producción..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BASE_DIR/backups/prod/sigah_prod_$TIMESTAMP.sql"
    
    docker-compose -f docker-compose.subfolder.yml exec -T sigah-db pg_dump -U sigah sigah > $BACKUP_FILE
    
    log_success "Backup de producción creado: $BACKUP_FILE"
}

# Rollback
rollback_prod() {
    log "Iniciando rollback de producción..."
    
    # Encontrar backup más reciente
    LATEST_BACKUP=$(ls -t $BASE_DIR/backups/prod/*.sql | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No se encontró backup para rollback"
        return 1
    fi
    
    log "Usando backup: $LATEST_BACKUP"
    
    # Restaurar backup
    docker-compose -f docker-compose.subfolder.yml exec -T sigah-db psql -U sigah -c "DROP DATABASE IF EXISTS sigah;"
    docker-compose -f docker-compose.subfolder.yml exec -T sigah-db psql -U sigah -c "CREATE DATABASE sigah;"
    docker-compose -f docker-compose.subfolder.yml exec -T sigah-db psql -U sigah sigah < $LATEST_BACKUP
    
    # Reiniciar backend
    docker-compose -f docker-compose.subfolder.yml restart sigah-backend
    
    log_success "Rollback completado"
}

# Status general
status() {
    log "Estado general del sistema..."
    echo ""
    
    echo "=== ENTORNOS ACTIVOS ==="
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep sigah
    
    echo ""
    echo "=== ESPACIO EN DISCO ==="
    df -h | grep -E "(Filesystem|/opt/sigah)"
    
    echo ""
    echo "=== CONSUMO DE RECURSOS ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    
    echo ""
    echo "=== HEALTH CHECKS ==="
    
    # Desarrollo
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Desarrollo: http://localhost:3001"
    else
        echo "❌ Desarrollo: No responde"
    fi
    
    # Staging
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Staging: http://localhost:8080"
    else
        echo "❌ Staging: No responde"
    fi
    
    # Producción
    if curl -f https://dominio.com/health > /dev/null 2>&1; then
        echo "✅ Producción: https://dominio.com"
    else
        echo "❌ Producción: No responde"
    fi
}

# Limpiar recursos
cleanup() {
    log "Limpiando recursos Docker..."
    
    # Detener todos los contenedores SIGAH
    docker ps --filter "name=sigah" -q | xargs -r docker stop
    
    # Limpiar imágenes no usadas
    docker image prune -f
    
    # Limpiar volúmenes huérfanos
    docker volume prune -f
    
    # Limpiar redes no usadas
    docker network prune -f
    
    log_success "Limpieza completada"
}

# Menú principal
case "$1" in
    setup)
        setup_directories
        ;;
    dev)
        start_dev
        ;;
    staging)
        start_staging
        ;;
    prod)
        start_prod
        ;;
    stop-dev)
        stop_dev
        ;;
    stop-staging)
        stop_staging
        ;;
    stop-prod)
        stop_prod
        ;;
    test)
        run_tests
        ;;
    deploy-staging)
        deploy_to_staging
        ;;
    deploy-prod)
        deploy_to_prod
        ;;
    backup-dev)
        backup_dev
        ;;
    backup-staging)
        backup_staging
        ;;
    backup-prod)
        backup_prod
        ;;
    rollback-prod)
        rollback_prod
        ;;
    status)
        status
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Uso: $0 {setup|dev|staging|prod|test|deploy-staging|deploy-prod|status|cleanup}"
        echo ""
        echo "Entornos:"
        echo "  setup          - Crear estructura inicial"
        echo "  dev            - Iniciar entorno de desarrollo"
        echo "  staging        - Iniciar entorno de staging/pruebas"
        echo "  prod           - Iniciar entorno de producción"
        echo ""
        echo "Control:"
        echo "  stop-dev       - Detener desarrollo"
        echo "  stop-staging   - Detener staging"
        echo "  stop-prod      - Detener producción"
        echo ""
        echo "Operaciones:"
        echo "  test           - Ejecutar tests automatizados"
        echo "  deploy-staging - Deploy a staging"
        echo "  deploy-prod    - Deploy a producción"
        echo "  status         - Ver estado general"
        echo "  cleanup        - Limpiar recursos"
        echo ""
        echo "Backups:"
        echo "  backup-dev     - Backup desarrollo"
        echo "  backup-staging - Backup staging"
        echo "  backup-prod    - Backup producción"
        echo "  rollback-prod  - Rollback producción"
        exit 1
        ;;
esac
