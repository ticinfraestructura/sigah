# SIGAH - Despliegue Full Docker con Recovery Automático

## Arquitectura Docker Completa

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCKER HOST                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 Nginx Proxy (80/443)                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │    │
│  │  │   Tomcat    │  │   SIGAH     │  │   Health Checks │   │    │
│  │  │  Existente  │  │   Full      │  │   & Monitoring  │   │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                        │
│                              ▼                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    SIGAH DOCKER NETWORKS                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │    │
│  │  │    Nginx    │  │   Backend   │  │    Frontend     │   │    │
│  │  │    Proxy    │  │   (3001)    │  │     (80)        │   │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │    │
│  │                              │                                        │
│  │                              ▼                                        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │    │
│  │  │ PostgreSQL  │  │    Redis    │  │   Volumes &     │   │    │
│  │  │  (5432)     │  │   (6379)    │  │   Persistence   │   │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Paso 1: Preparación del Entorno

### 1.1 Prerrequisitos Docker
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version

# Habilitar Docker para inicio automático
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.2 Preparar directorios
```bash
# Crear estructura de directorios
sudo mkdir -p /opt/sigah/{data/{postgres,redis,uploads},logs/{nginx,backend},backups/{postgres,redis,config}}
sudo chown -R $USER:$USER /opt/sigah
chmod 755 /opt/sigah

# Navegar al directorio del proyecto
cd /opt/sigah
```

### 1.3 Clonar y configurar
```bash
# Clonar repositorio
git clone <repo-url> .

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Variables críticas:**
```env
DB_PASSWORD=PasswordSuperSeguroSIGAH2024!
JWT_SECRET=SecretJWT64CaracteresMinimoParaProduccion2024!
ALLOWED_ORIGINS=https://tu-dominio.com,http://tu-dominio.com
```

## Paso 2: Configuración de Redes Docker

### 2.1 Crear redes para comunicación
```bash
# Red para SIGAH (aislada)
docker network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  sigah-network

# Red para Tomcat (conexión con app existente)
docker network create \
  --driver bridge \
  --subnet 172.21.0.0/16 \
  --gateway 172.21.0.1 \
  tomcat-network

# Verificar redes
docker network ls | grep sigah
```

### 2.2 Conectar Tomcat existente (opcional)
```bash
# Si Tomcat corre en Docker, conectar a la red
docker network connect tomcat-network nombre-contenedor-tomcat

# Si Tomcat corre nativo, crear conector
docker run -d --name tomcat-connector \
  --network tomcat-network \
  --restart always \
  alpine:latest \
  tail -f /dev/null
```

## Paso 3: Configuración SSL

### 3.1 Preparar certificados
```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Opción 1: Certificados existentes
cp /path/to/tu-certificado.crt nginx/ssl/
cp /path/to/tu-privada.key nginx/ssl/

# Opción 2: Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d tu-dominio.com
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem nginx/ssl/tu-certificado.crt
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem nginx/ssl/tu-privada.key
```

### 3.2 Configurar permisos
```bash
chmod 600 nginx/ssl/tu-privada.key
chmod 644 nginx/ssl/tu-certificado.crt
```

## Paso 4: Despliegue del Sistema

### 4.1 Construir y levantar contenedores
```bash
# Hacer ejecutable el script de recovery
chmod +x scripts/recovery.sh

# Iniciar sistema con recovery script
./scripts/recovery.sh start
```

### 4.2 Verificación del despliegue
```bash
# Verificar estado
./scripts/recovery.sh status

# Health checks
./scripts/recovery.sh monitor

# Acceso a las aplicaciones
curl http://localhost/health
curl http://localhost/health/sigah
```

## Paso 5: Configuración de Dominio

### 5.1 DNS y Firewall
```bash
# Configurar DNS para apuntar tu-dominio.com a la IP del servidor

# Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 5.2 Actualizar configuración Nginx
```bash
# Editar dominio en configuración
nano nginx/conf.d/default.conf
# Reemplazar "tu-dominio.com" con tu dominio real

# Recargar configuración
docker-compose -f docker-compose.full-docker.yml restart nginx-proxy
```

## Recuperación ante Apagones

### Escenario 1: Apagón del Servidor (Power Loss)

#### Recuperación automática al reiniciar:
```bash
# Docker debería iniciar automáticamente
# Los contenedores con "restart: unless-stopped" se iniciarán solos

# Verificar estado
./scripts/recovery.sh status

# Si algo no inició correctamente:
./scripts/recovery.sh disaster
```

#### Recuperación manual:
```bash
# 1. Verificar Docker
sudo systemctl status docker
sudo systemctl start docker

# 2. Verificar redes
docker network ls | grep sigah

# 3. Iniciar sistema
./scripts/recovery.sh start
```

### Escenario 2: Caída de Contenedores

#### Diagnóstico:
```bash
# Ver contenedores caídos
docker-compose -f docker-compose.full-docker.yml ps

# Ver logs de contenedores problemáticos
docker-compose -f docker-compose.full-docker.yml logs [nombre-contenedor]
```

#### Recuperación:
```bash
# Reiniciar contenedor específico
docker-compose -f docker-compose.full-docker.yml restart [nombre-contenedor]

# O reiniciar todo
./scripts/recovery.sh restart
```

### Escenario 3: Corrupción de Datos

#### Recuperación desde backup:
```bash
# 1. Detener sistema
./scripts/recovery.sh stop

# 2. Restaurar desde backup más reciente
./scripts/recovery.sh restore /opt/sigah/backups/sigah_backup_YYYYMMDD_HHMMSS.tar.gz

# 3. Verificar restauración
./scripts/recovery.sh monitor
```

## Mantenimiento y Monitoreo

### Backups Automáticos
```bash
# Crear cron job para backups diarios
crontab -e

# Agregar línea (ejecutar todos los días a las 2 AM)
0 2 * * * /opt/sigah/scripts/recovery.sh backup

# Backup semanal completo
0 3 * * 0 /opt/sigah/scripts/recovery.sh backup && find /opt/sigah/backups -name "*.tar.gz" -mtime +30 -delete
```

### Monitoreo Continuo
```bash
# Script de monitoreo
cat > /opt/sigah/scripts/monitor.sh << 'EOF'
#!/bin/bash
/opt/sigah/scripts/recovery.sh monitor | logger -t sigah-monitor
EOF

chmod +x /opt/sigah/scripts/monitor.sh

# Monitoreo cada 5 minutos
crontab -e
*/5 * * * * /opt/sigah/scripts/monitor.sh
```

### Logs y Auditoría
```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.full-docker.yml logs -f

# Logs específicos
docker-compose -f docker-compose.full-docker.yml logs -f nginx-proxy
docker-compose -f docker-compose.full-docker.yml logs -f sigah-backend

# Logs del sistema
tail -f /opt/sigah/logs/nginx/access.log
tail -f /opt/sigah/logs/nginx/error.log
```

## Actualizaciones del Sistema

### Actualización segura:
```bash
# 1. Backup antes de actualizar
./scripts/recovery.sh backup

# 2. Actualizar código
git pull origin main

# 3. Reconstruir imágenes
docker-compose -f docker-compose.full-docker.yml build --no-cache

# 4. Reiniciar con nueva configuración
./scripts/recovery.sh restart

# 5. Verificar actualización
./scripts/recovery.sh monitor
```

## Troubleshooting Avanzado

### Problemas de Red
```bash
# Limpiar redes problemáticas
docker network prune -f

# Recrear redes manualmente
docker network create sigah-network --subnet 172.20.0.0/16
docker network create tomcat-network --subnet 172.21.0.0/16

# Reconectar contenedores
docker-compose -f docker-compose.full-docker.yml up -d
```

### Problemas de Volúmenes
```bash
# Verificar volúmenes
docker volume ls | grep sigah

# Inspeccionar volumen
docker volume inspect sigah-postgres-data

# Limpiar volúmenes huérfanos
docker volume prune -f
```

### Rendimiento
```bash
# Monitorear recursos
docker stats

# Limpiar imágenes no usadas
docker image prune -a

# Optimizar tamaño de imágenes
docker-compose -f docker-compose.full-docker.yml build --no-cache --parallel
```

## Comandos Rápidos de Emergencia

```bash
# Emergencia: Detener todo
docker-compose -f docker-compose.full-docker.yml down

# Emergencia: Iniciar solo servicios críticos
docker-compose -f docker-compose.full-docker.yml up -d sigah-db sigah-redis

# Emergencia: Verificar sistema
./scripts/recovery.sh status && ./scripts/recovery.sh monitor

# Emergencia: Backup inmediato
./scripts/recovery.sh backup

# Emergencia: Restaurar último backup
LATEST_BACKUP=$(ls -t /opt/sigah/backups/*.tar.gz | head -1)
./scripts/recovery.sh restore $LATEST_BACKUP
```

## Resumen de Características de Recovery

✅ **Auto-reinicio** de contenedores ante caídas  
✅ **Health checks** automáticos con monitoreo continuo  
✅ **Backups automáticos** programables  
✅ **Recuperación con un comando** desde backup  
✅ **Aislamiento total** de redes y volúmenes  
✅ **Logs centralizados** para auditoría  
✅ **Actualizaciones sin downtime**  
✅ **Recuperación ante apagones** automática  
✅ **Monitoreo de recursos** en tiempo real  

Esta arquitectura garantiza **cero pérdida de datos** y **recuperación automática** ante cualquier escenario de fallo.
