# SIGAH - Guía de Despliegue

**Versión:** 1.1.0 | **Fecha:** Julio 2026

> **⚠️ NOTA:** Esta guía de despliegue es para el sistema SIGAH completo. La implementación actual tiene los siguientes módulos **activos**:
> - Dashboard
> - Inventario (Gestión de productos, stock, movimientos)
> - Kits (Creación y egreso de kits)
> - Reportes (Generación de reportes)
> - Roles y Permisos (Gestión de roles)
> - Usuarios (Gestión de usuarios)
> - Copias de Seguridad (Backups de BD)
>
> **Módulos deshabilitados en esta implementación:**
> - Beneficiarios
> - Solicitudes
> - Entregas
> - Devoluciones
> - Notificaciones
>
> El despliegue funciona correctamente con solo los módulos activos.

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue Local](#despliegue-local)
3. [Despliegue en Producción](#despliegue-en-producción)
4. [Configuración de Entorno](#configuración-de-entorno)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
6. [Solución de Problemas](#solución-de-problemas)
7. [Arquitectura](#arquitectura)

## Requisitos Previos

### En tu máquina local (Windows)
- Git instalado ([descargar](https://git-scm.com/download/win))
- Cuenta en GitHub
- Docker Desktop (para desarrollo local)

### En el servidor On-Premise
- Docker instalado ([guía](https://docs.docker.com/engine/install/))
- Docker Compose instalado
- Git instalado
- Mínimo 4GB RAM, 50GB disco (recomendado 8GB RAM, 100GB disco)
- Acceso a internet para descargas iniciales

---

## Despliegue Local

### 1.1 Clonar y configurar

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/sigah.git
cd sigah

# Copiar variables de entorno
cp .env.example .env

# Editar variables (opcional para desarrollo)
nano .env
```

### 1.2 Iniciar servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Esperar 90 segundos para que inicien
sleep 90

# Cargar datos de prueba
docker exec sigah-github-backend npx prisma db seed
```

### 1.3 Acceder localmente

- Frontend: http://localhost:8082
- Backend API: http://localhost:3002
- Base de Datos: localhost:5432 (interno al stack Docker)

---

## Despliegue en Producción

### Paso 1: Subir a GitHub

### 1.1 Crear repositorio en GitHub
1. Ir a [github.com](https://github.com) e iniciar sesión
2. Click en **"+"** → **"New repository"**
3. Configurar:
   - **Name**: `sigah`
   - **Visibility**: Private (recomendado)
   - **NO** agregar README (ya existe)
4. Click **"Create repository"**
5. Copiar la URL del repositorio

### 1.2 Subir código (ejecutar en PowerShell)

```powershell
# Navegar al proyecto
cd C:\PruebaWindSurf\sigah

# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "feat: Initial commit - SIGAH v1.0"

# Crear rama main
git branch -M main

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/sigah.git

# Subir código
git push -u origin main
```

**Nota**: Te pedirá credenciales de GitHub. Usa tu usuario y un [Personal Access Token](https://github.com/settings/tokens).

---

## Paso 2: Desplegar en Servidor On-Premise

### 2.1 Clonar repositorio en el servidor

```bash
# Conectar al servidor via SSH
ssh usuario@IP_SERVIDOR

# Clonar repositorio
git clone https://github.com/ticinfraestructura/sigah.git
cd sigah
```

### 2.2 Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables importantes a cambiar:**
```env
DB_PASSWORD=TuPasswordSeguro2024!
JWT_SECRET=UnSecretoMuyLargoDeAlMenos64CaracteresParaJWT2024!
APP_PORT=80
ALLOWED_ORIGINS=http://tu-servidor.com,http://IP_SERVIDOR
```

### 2.3 Construir y ejecutar

```bash
# Construir imágenes y levantar servicios
docker-compose up -d --build

# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
```

### 2.4 Inicializar base de datos

La primera vez que se ejecuta, Prisma crea las tablas automáticamente. Para crear datos iniciales (usuario admin, roles, etc.):

```bash
# Entrar al contenedor backend
docker-compose exec backend sh

# Ejecutar seed (si existe)
npx prisma db seed

# Salir del contenedor
exit
```

---

## Paso 3: Verificar Despliegue

1. Abrir navegador: `http://IP_SERVIDOR:8082`
2. Debería verse la página de login de SIGAH
3. Verificar health check: `http://IP_SERVIDOR:3002/api/health`

---

## Configuración de Entorno

### Variables de Entorno (.env)

```env
# Base de Datos
DATABASE_URL="postgresql://sigah:password@postgres:5432/sigah"
POSTGRES_USER=sigah
POSTGRES_PASSWORD=TuPasswordSeguro2024!
POSTGRES_DB=sigah

# JWT
JWT_SECRET="UnSecretoMuyLargoDeAlMenos64CaracteresParaJWT2024!"
JWT_EXPIRES_IN="24h"

# Redis
REDIS_URL="redis://redis:6379"

# Frontend
VITE_API_URL="http://localhost:3001"
VITE_BASE_PATH="/sigah/"

# Servidor
APP_PORT=80
ALLOWED_ORIGINS="http://tu-servidor.com,http://IP_SERVIDOR"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
```

### Configuración de Producción Adicional

```env
# Producción
NODE_ENV=production
LOG_LEVEL=info

# SSL (opcional)
SSL_CERT_PATH="/path/to/cert.pem"
SSL_KEY_PATH="/path/to/key.pem"

# Monitoreo
ENABLE_METRICS=true
METRICS_PORT=9090
```

---

## Monitoreo y Mantenimiento

### Health Checks

```bash
# Verificar salud de servicios
curl http://localhost:3002/api/health
curl http://localhost:8082

# Verificar contenedores
docker-compose ps
docker-compose top
```

### Logs y Monitoreo

```bash
# Ver logs en tiempo real
docker-compose logs -f
docker logs sigah-github-backend -f
docker logs sigah-github-frontend -f

# Logs específicos
docker logs sigah-github-backend --tail=100
docker logs sigah-github-db --since=1h
```

### Backup Automático

El sistema incluye dos métodos de backup:

**1. Interfaz Web (Recomendado para backups manuales)**
- Acceso: `/backups` (Solo rol ADMIN)
- Funcionalidades: Listar, crear, restaurar y eliminar copias de seguridad
- Los backups se almacenan en `/backups/sigah` dentro del contenedor backend

**2. Script Automatizado (Para backups programados)**
```bash
#!/bin/bash
# backup.sh - Backup diario automático

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/sigah"

mkdir -p $BACKUP_DIR

# Backup base de datos usando pg_dump
docker exec sigah-github-db sh -c 'pg_dump -U sigah sigah' > $BACKUP_DIR/sigah_db_$DATE.sql

# Backup configuración
tar -czf $BACKUP_DIR/sigah_config_$DATE.tar.gz .env docker-compose.yml

# Limpiar backups antiguos (7 días)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
```

### Actualizaciones

```bash
# Actualizar aplicación
cd /ruta/a/sigah
git pull origin main
docker-compose up -d --build

# Verificar después de actualización
docker-compose ps
curl http://localhost:3001/api/health
```

---

## Comandos Útiles

### Gestión de Contenedores
```bash
# Detener servicios
docker-compose down

# Reiniciar un servicio
docker-compose restart backend

# Ver logs
docker-compose logs -f

# Actualizar después de cambios
git pull
docker-compose up -d --build

# Limpiar recursos no utilizados
docker system prune -f
```

### Base de Datos
```bash
# Acceder a PostgreSQL
docker exec -it sigah-github-db sh -c 'psql -U sigah -d sigah'

# Backup de base de datos
docker exec sigah-github-db sh -c 'pg_dump -U sigah sigah' > backup.sql

# Restaurar backup
docker exec -i sigah-github-db sh -c 'psql -U sigah sigah' < backup.sql

# Ver tamaño de BD
docker exec sigah-github-db sh -c 'psql -U sigah -d sigah -c "SELECT pg_size_pretty(pg_database_size(\x27sigah\x27));"'
```

### Prisma
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Ver estado de migraciones
docker-compose exec backend npx prisma migrate status

# Abrir Prisma Studio (debug)
docker-compose exec backend npx prisma studio

# Resetear base de datos (cuidado: pierde datos)
docker-compose exec backend npx prisma db push --force-reset
```

---

## Solución de Problemas

### Errores Comunes

#### Error: "DB_PASSWORD is required"
```bash
# Verificar que .env existe y tiene valores
cat .env

# Recrear archivo .env si falta
cp .env.example .env
nano .env
```

#### Error de conexión a base de datos
```bash
# Verificar que postgres está corriendo
docker-compose ps

# Ver logs de postgres
docker-compose logs postgres

# Verificar conexión
docker exec sigah-github-db sh -c 'psql -U sigah -d sigah -c "SELECT 1;"'
```

#### Página en blanco o error 502
```bash
# Verificar estado del backend
docker-compose logs backend

# Verificar estado del frontend
docker-compose logs frontend

# Reiniciar servicios
docker-compose restart
```

#### Error de permisos (permission denied)
```bash
# Verificar permisos de archivos
ls -la .env docker-compose.yml

# Corregir permisos si es necesario
chmod 644 .env docker-compose.yml
```

#### Contenedor no inicia
```bash
# Verificar recursos del sistema
docker system df
docker system prune -f

# Verificar puerto disponible
netstat -tulpn | grep :80
netstat -tulpn | grep :3001
```

#### Problemas de memoria
```bash
# Verificar uso de memoria
docker stats

# Aumentar límite de memoria si es necesario
# Editar docker-compose.yml y agregar:
# mem_limit: 2g
```

### Diagnóstico Avanzado

#### Verificar configuración de red
```bash
# Verificar redes Docker
docker network ls
docker network inspect sigah_default

# Verificar conectividad entre contenedores
docker exec sigah-github-backend ping sigah-github-db
docker exec sigah-github-frontend ping sigah-github-backend
```

#### Debug de contenedores
```bash
# Entrar a contenedor para debug
docker exec -it sigah-github-backend sh
docker exec -it sigah-github-frontend sh

# Ver variables de entorno
docker exec sigah-github-backend env | Select-String -Pattern '(DATABASE|JWT|REDIS)'
```

#### Logs detallados
```bash
# Logs con timestamp
docker-compose logs -f --tail=100 --timestamps

# Logs de último reinicio
docker-compose logs --since=$(docker inspect sigah-github-backend --format='{{.State.StartedAt}}')
```

### Recuperación de Desastres

#### Restaurar desde backup
```bash
# Detener servicios
docker-compose down

# Restaurar base de datos
docker-compose up -d
sleep 30
docker exec -i sigah-github-db sh -c 'psql -U sigah sigah' < backup.sql

# Iniciar todos los servicios
docker-compose up -d
```

#### Reset completo (último recurso)
```bash
# ⚠️ Esto elimina todos los datos
docker-compose down -v
docker system prune -f
docker-compose up -d
docker exec sigah-github-backend npx prisma db seed
```

### Actualización de la Aplicación
```bash
# Actualizar aplicación
cd /ruta/a/sigah
git pull origin main
docker-compose up -d --build

# Verificar después de actualización
docker-compose ps
curl http://localhost:3002/api/health
```

---

## Arquitectura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    SERVIDOR ON-PREMISE                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐         ┌──────────────┐             │
│   │   Frontend   │────────▶│   Backend    │             │
│   │   (Nginx)    │  /api   │  (Node.js)   │             │
│   │   Port: 80   │         │  Port: 3001  │             │
│   └──────────────┘         └──────┬───────┘             │
│                                   │                      │
│                     ┌─────────────┼─────────────┐       │
│                     ▼             ▼             ▼       │
│              ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│              │ PostgreSQL│  │  Redis   │  │  Logs    │   │
│              │   :5432   │  │  :6379   │  │          │   │
│              └──────────┘  └──────────┘  └──────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
Usuario → Nginx → Frontend (React)
                ↓
         Backend API (Express)
                ↓
         PostgreSQL + Redis
```

### Volúmenes y Persistencia

```yaml
volumes:
  postgres_data:    # Datos de PostgreSQL
  redis_data:       # Cache de Redis
  nginx_logs:       # Logs de Nginx
  app_logs:         # Logs de aplicación
```

### Redes

```yaml
networks:
  sigah-network:    # Red interna de contenedores
  external-network: # Conexión externa (opcional)
```

---

## Rendimiento y Escalabilidad

### Recursos Recomendados

| Componente | Mínimo | Recomendado | Producción |
|------------|--------|-------------|------------|
| CPU        | 2 cores | 4 cores     | 8 cores    |
| RAM        | 4 GB    | 8 GB        | 16 GB      |
| Disco      | 50 GB   | 100 GB      | 500 GB     |
| Red        | 100 Mbps| 1 Gbps      | 10 Gbps    |

### Optimizaciones

#### Base de Datos
```sql
-- Índices recomendados
CREATE INDEX CONCURRENTLY idx_products_category ON products(categoryId);
CREATE INDEX CONCURRENTLY idx_stock_movements_product_date ON stock_movements(productId, createdAt);
CREATE INDEX CONCURRENTLY idx_deliveries_status ON deliveries(status);
```

#### Nginx
```nginx
# Optimización para producción
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Cache estático
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Backend
```javascript
// Configuración de conexión a BD
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

// Pool de conexiones
// (Configurado en DATABASE_URL)
// postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
```

### Monitoreo de Rendimiento

```bash
# Métricas de contenedores
docker stats --no-stream

# Uso de disco
df -h
docker system df

# Conexiones a BD
docker-compose exec postgres psql -U sigah -d sigah -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
"
```

---

## Seguridad en Producción

### Hardening ya implementado localmente

El proyecto incluye endurecimiento básico aplicable desde el entorno local:

- Headers de seguridad en Nginx frontend: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- CORS configurable por `ALLOWED_ORIGINS`.
- En producción no se permite cualquier `localhost` automáticamente.
- Rate limit general para `/api`.
- Rate limit específico para login: 5 intentos fallidos por IP cada 15 minutos.
- Bloqueo por cuenta después de múltiples intentos fallidos.
- Headers backend con `helmet`.

Antes de publicar en internet se debe configurar HTTPS real y definir `ALLOWED_ORIGINS` con el dominio final.

### Configuración SSL/TLS

```nginx
server {
    listen 443 ssl http2;
    server_name tu-servidor.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Configuración SSL segura
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

### Firewall

```bash
# Reglas de firewall (ufw example)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3001/tcp   # Backend solo interno
sudo ufw deny 5432/tcp   # PostgreSQL solo interno
sudo ufw enable
```

### Backup y Recuperación

```bash
#!/bin/bash
# backup-produccion.sh

BACKUP_DIR="/backups/sigah/produccion"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Backup completo
docker-compose exec -T postgres pg_dump -U sigah sigah | gzip > $BACKUP_DIR/sigah_full_$DATE.sql.gz

# Backup incremental (logs)
docker-compose logs --since="24h" > $BACKUP_DIR/logs_$DATE.log

# Limpiar backups antiguos
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.log" -mtime +7 -delete

echo "Backup completado: $DATE"
```

---

## Contacto y Soporte

### Soporte Técnico
- **Email**: soporte@sigah.org
- **Issues**: [GitHub Issues](https://github.com/your-org/sigah/issues)
- **Documentación**: [Wiki del Proyecto](https://github.com/your-org/sigah/wiki)

### Canales de Comunicación
- **Slack**: #sigah-support (invitación requerida)
- **Teams**: Canal SIGAH (para organizaciones)
- **Email Urgente**: emergency@sigah.org

### Niveles de Soporte

| Nivel | Descripción | Tiempo de Respuesta |
|-------|-------------|-------------------|
| Crítico | Sistema caído, pérdida de datos | 1 hora |
| Alto | Funcionalidad principal afectada | 4 horas |
| Medio | Funcionalidad parcial afectada | 24 horas |
| Bajo | Mejoras, consultas generales | 72 horas |

---

*Última actualización: Julio 2026 — SIGAH v1.1.0*
