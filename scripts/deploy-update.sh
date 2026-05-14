#!/bin/bash
# Script de actualización rápida para servidor Linux
# Uso: ./scripts/deploy-update.sh [ambiente]
# Ejemplo: ./scripts/deploy-update.sh prod

set -e

ENV=${1:-prod}
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="sigah"

if [ "$ENV" == "prod" ]; then
    COMPOSE_FILE="docker-compose.subfolder.yml"
elif [ "$ENV" == "staging" ]; then
    COMPOSE_FILE="docker-compose.staging.yml"
fi

echo "🚀 Actualizando SIGAH en ambiente: $ENV"
echo "📁 Usando: $COMPOSE_FILE"

# Verificar que estamos en el directorio correcto
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: No se encontró $COMPOSE_FILE"
    echo "Asegúrate de ejecutar desde /opt/sigah"
    exit 1
fi

# Guardar estado actual de la base
echo "💾 Creando backup de seguridad..."
mkdir -p backups
docker exec ${PROJECT_NAME}-db pg_dump -U ${DB_USER:-sigah_user} ${DB_NAME:-sigah_prod} 2>/dev/null > backups/pre_update_$(date +%Y%m%d_%H%M%S).sql || echo "⚠️  No se pudo crear backup automático"

# Pull de cambios
echo "📥 Descargando cambios desde Git..."
git stash || true
git pull origin main

# Detener contenedores
echo "🛑 Deteniendo contenedores actuales..."
docker compose -p $PROJECT_NAME -f $COMPOSE_FILE down

# Reconstruir imágenes
echo "🔨 Reconstruyendo imágenes..."
docker compose -p $PROJECT_NAME -f $COMPOSE_FILE build --no-cache

# Levantar nuevos contenedores
echo "▶️  Iniciando nuevos contenedores..."
docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d

# Esperar que base de datos esté lista
echo "⏳ Esperando base de datos..."
sleep 5
until docker exec ${PROJECT_NAME}-db pg_isready -U ${DB_USER:-sigah_user} 2>/dev/null; do
    echo "   Base de datos no lista, esperando..."
    sleep 2
done

# Ejecutar migraciones
echo "🔄 Ejecutando migraciones..."
docker exec ${PROJECT_NAME}-backend npx prisma migrate deploy || echo "⚠️  Revisa migraciones manualmente"

# Verificación
echo "✅ Verificando despliegue..."
sleep 3

# Health check
HEALTH_STATUS=$(docker exec ${PROJECT_NAME}-backend wget -qO- http://localhost:3001/health 2>/dev/null || echo "unhealthy")

if [ "$HEALTH_STATUS" == "unhealthy" ]; then
    echo "⚠️  Health check falló. Revisa logs:"
    docker logs ${PROJECT_NAME}-backend --tail 30
    exit 1
fi

# Estado final
echo ""
echo "📊 Estado de contenedores:"
docker compose -p $PROJECT_NAME -f $COMPOSE_FILE ps

echo ""
echo "✅ Actualización completada exitosamente"
echo "🌐 Verifica en: https://$(grep DOMAIN .env 2>/dev/null | cut -d= -f2 || echo 'tu-dominio')/sigah/"
