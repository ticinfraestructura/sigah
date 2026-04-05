# SIGAH - Despliegue Final: dominio.com/sigah

## ✅ **Configuración Completada para dominio.com/sigah**

He ajustado todos los archivos para que funcionen exactamente con la ruta `dominio.com/sigah`.

## 📁 **Archivos Modificados**

### 1. Frontend Configurado
- ✅ **`frontend/vite.config.ts`** - Base path `/sigah/`
- ✅ **`frontend/src/services/api.ts`** - API URL `/sigah-api`
- ✅ **`frontend/src/main.tsx`** - BrowserRouter basename automático

### 2. Backend Configurado
- ✅ **`backend/src/index.ts`** - CORS para `dominio.com` y `dominio.com/sigah`

### 3. Nginx Proxy Listo
- ✅ **`nginx/conf.d/subfolder.conf`** - Mapeo `/sigah/` y `/sigah-api/`

### 4. Docker Compose Listo
- ✅ **`docker-compose.subfolder.yml`** - Build args para subfolder

## 🚀 **Despliegue Inmediato**

### Paso 1: Variables de Entorno
```bash
cp .env.example .env
nano .env
```

**Configuración crítica:**
```env
DB_PASSWORD=PasswordSuperSeguroSIGAH2024!
JWT_SECRET=SecretJWT64CaracteresMinimoParaProduccion2024!
ALLOWED_ORIGINS=https://dominio.com,https://dominio.com/sigah

# Notificaciones (canales)
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxxxxx
WHATSAPP_PHONE_ID=xxxxxxxxxxxxxxxx
WHATSAPP_ACCESS_TOKEN=xxxxxxxxxxxxxxxx
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

Notas importantes:
- En local dev, el runtime usa `backend/.env` (no `backend/.env.production.example`).
- Si cambian tokens, recrear backend para que tome variables nuevas.

### Paso 2: Preparar Certificados SSL
```bash
mkdir -p nginx/ssl

# Opción 1: Certificado wildcard
cp /path/to/dominio.com.crt nginx/ssl/
cp /path/to/dominio.com.key nginx/ssl/

# Opción 2: Let's Encrypt
sudo certbot certonly --standalone -d dominio.com
sudo cp /etc/letsencrypt/live/dominio.com/fullchain.pem nginx/ssl/dominio.com.crt
sudo cp /etc/letsencrypt/live/dominio.com/privkey.pem nginx/ssl/dominio.com.key
```

### Paso 3: Desplegar Sistema
```bash
# Crear redes Docker
docker network create sigah-network --subnet 172.20.0.0/16
docker network create tomcat-network --subnet 172.21.0.0/16

# Desplegar con configuración de subfolder
docker-compose -f docker-compose.subfolder.yml up -d --build

# Verificar estado
docker-compose -f docker-compose.subfolder.yml ps
```

## 🔍 **Verificación Final**

### Health Checks
```bash
# Health general
curl https://dominio.com/health

# Health SIGAH
curl https://dominio.com/health/sigah

# Health Tomcat
curl https://dominio.com/health/tomcat
```

### Acceso en Navegador
1. **App Tomcat existente**: `https://dominio.com/` ✅
2. **SIGAH Frontend**: `https://dominio.com/sigah/` ✅
3. **SIGAH Login**: `https://dominio.com/sigah/` → Login ✅

## 🔄 **Flujo de Trabajo Confirmado**

### URLs Finales
```
https://dominio.com/           → App Tomcat (intacta)
https://dominio.com/sigah/     → SIGAH Frontend
https://dominio.com/sigah-api/ → SIGAH Backend API
```

### Mapeo Interno Nginx
```
/sigah/        → http://sigah_frontend:80/
/sigah-api/    → http://sigah_backend:3001/api/
/              → http://tomcat_backend:8080/
```

## 🛠️ **Troubleshooting Rápido**

### Si SIGAH no carga:
```bash
# Verificar logs Nginx
docker logs sigah-nginx-proxy | grep sigah

# Verificar frontend
docker logs sigah-frontend

# Verificar backend
docker logs sigah-backend
```

### Si API calls fallan:
```bash
# Probar API directamente
curl https://dominio.com/sigah-api/health

# Verificar CORS
curl -H "Origin: https://dominio.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://dominio.com/sigah-api/auth/login
```

### Si Telegram aparece como simulado
```bash
# 1) Verificar status operativo de canales
curl -H "Authorization: Bearer <TOKEN_JWT>" \
  https://dominio.com/sigah-api/whatsapp-notifications/status

# 2) Validar token del bot desde runtime backend
docker exec sigah-backend printenv | grep TELEGRAM_BOT_TOKEN

# 3) Reaplicar variables y recrear backend
docker-compose -f docker-compose.subfolder.yml up -d --force-recreate sigah-backend
```

### Si routing de React no funciona:
```bash
# Verificar base path en build
docker exec sigah-frontend cat /usr/share/nginx/html/index.html | grep sigah
```

## 📋 **Checklist Final de Verificación**

- [ ] **App Tomcat** funciona en `https://dominio.com/`
- [ ] **SIGAH frontend** carga en `https://dominio.com/sigah/`
- [ ] **Login SIGAH** funciona correctamente
- [ ] **API calls** funcionan sin errores CORS
- [ ] **Assets estáticos** cargan correctamente
- [ ] **Routing interno** de React funciona
- [ ] **SSL/TLS** funciona para todo el dominio
- [ ] **Health checks** responden correctamente

## 🎯 **Resultado Final**

✅ **Una sola IP**: `123.45.67.89`  
✅ **Un dominio**: `dominio.com`  
✅ **Ruta SIGAH**: `dominio.com/sigah`  
✅ **Cero subcarpetas físicas**  
✅ **App Tomcat intacta**  
✅ **SSL unificado**  
✅ **Proxy inverso inteligente**  

## 🔄 **Comandos de Mantenimiento**

### Actualizar SIGAH
```bash
git pull origin main
docker-compose -f docker-compose.subfolder.yml up -d --build
```

### Backup
```bash
./scripts/recovery.sh backup
```

### Logs
```bash
# Logs específicos de SIGAH
docker logs -f sigah-nginx-proxy 2>&1 | grep sigah
```

---

**¡LISTO!** SIGAH está completamente configurado para funcionar en `dominio.com/sigah` con todo el stack ajustado y listo para producción.
