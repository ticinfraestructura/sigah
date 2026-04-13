# Despliegue SIGAH en Linux (Producción)

> **Contexto:** Desarrollo en Windows con Docker → Despliegue en servidor Linux

## Pre-requisitos en servidor Linux

```bash
# Docker y Docker Compose instalados
docker --version
docker compose version

# Git instalado
git --version

# Directorio de despliegue
sudo mkdir -p /opt/sigah
sudo chown $USER:$USER /opt/sigah
```

## 1. Clonar y preparar (primera vez)

```bash
cd /opt/sigah
git clone https://github.com/ticinfraestructura/sigah.git .

# Copiar configuración de producción
cp .env.example .env
# Editar .env con valores de producción
nano .env
```

### Variables críticas en `.env` para Linux

```bash
# Base de datos
DB_HOST=sigah-db
DB_PORT=5432
DB_NAME=sigah_prod
DB_USER=sigah_user
DB_PASSWORD=TU_PASSWORD_SEGURO

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=TU_JWT_SECRET_LARGO
ALLOWED_ORIGINS=https://tudominio.gov.co

# Frontend
VITE_API_URL=/sigah-api
APP_BASE_PATH=/sigah/

# Redis
REDIS_HOST=sigah-redis
REDIS_PORT=6379
```

## 2. Despliegue con script automatizado

```bash
# Dar permisos y ejecutar
chmod +x scripts/start_sigah.sh
sudo ./scripts/start_sigah.sh
```

### ¿Qué hace el script?

1. Valida que exista el `.env`
2. Lee configuración desde `.env`
3. Levanta contenedores con `docker compose -p sigah -f docker-compose.subfolder.yml`
4. Espera que PostgreSQL esté listo
5. Ejecuta migraciones de Prisma
6. Verifica health endpoints

## 3. Verificación post-despliegue

```bash
# Estado de contenedores
docker compose -p sigah -f docker-compose.subfolder.yml ps

# Logs
docker logs sigah-backend --tail 50
docker logs sigah-frontend --tail 50

# Health checks
curl -s https://tudominio.gov.co/sigah-api/health
curl -s https://tudominio.gov.co/sigah/
```

## 4. Configurar arranque automático (systemd)

```bash
# Copiar servicio
sudo cp deploy/systemd/sigah-startup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sigah-startup.service
sudo systemctl start sigah-startup.service

# Verificar estado
sudo systemctl status sigah-startup.service --no-pager
```

## 5. Actualización de código (después del primer deploy)

```bash
cd /opt/sigah

# Guardar cambios locales si los hay (raro en prod)
git stash

# Pull de últimos cambios
git pull origin main

# Reconstruir y reiniciar
docker compose -p sigah -f docker-compose.subfolder.yml down
docker compose -p sigah -f docker-compose.subfolder.yml build --no-cache
docker compose -p sigah -f docker-compose.subfolder.yml up -d

# Verificar
docker compose -p sigah -f docker-compose.subfolder.yml ps
```

## 6. Backup manual de base de datos

```bash
cd /opt/sigah
mkdir -p backups

# Backup
docker exec sigah-db pg_dump -U sigah_user sigah_prod > backups/sigah_$(date +%Y%m%d_%H%M%S).sql

# Restaurar (si necesario)
docker exec -i sigah-db psql -U sigah_user -d sigah_prod < backups/sigah_20240115_120000.sql
```

## 7. Troubleshooting común

### Problema: Contenedores no levantan
```bash
# Ver logs de construcción
docker compose -f docker-compose.subfolder.yml build --no-cache 2>&1 | tee build.log

# Verificar puertos no ocupados
sudo netstat -tlnp | grep -E '3001|8080|5432'
```

### Problema: Error CORS al hacer login
```bash
# Verificar ALLOWED_ORIGINS en .env
grep ALLOWED_ORIGINS .env

# Debe coincidir con el dominio exacto
curl -v -H "Origin: https://tudominio.gov.co" https://tudominio.gov.co/sigah-api/health
```

### Problema: Migraciones fallan
```bash
# Resetear base de datos (⚠️ PÉRDIDA DE DATOS)
docker exec sigah-db psql -U sigah_user -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Reejecutar migraciones
docker exec sigah-backend npx prisma migrate deploy
```

## 8. Configuración con Nginx existente

Si ya tienes Nginx como reverse proxy:

```bash
# Incluir configuración en nginx.conf
# dentro de /etc/nginx/nginx.conf o sites-enabled/default:

location /sigah/ {
    proxy_pass http://localhost:8080/sigah/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
}

location /sigah-api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Luego:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Checklist final

- [ ] `.env` configurado con valores de producción
- [ ] Base de datos inicializada con migraciones
- [ ] Contenedores levantados y saludables
- [ ] HTTPS configurado (certbot/Let's Encrypt si aplica)
- [ ] Login funciona correctamente
- [ ] Permisos de entregas funcionan
- [ ] Backup automático configurado (cron)
- [ ] systemd service habilitado

## Referencias

- `DEVOPS_STRATEGY.md` - Estrategia completa DevOps
- `WORKFLOW_ENTREGAS.md` - Flujo de entregas y permisos
- `scripts/start_sigah.sh` - Script de arranque automatizado
