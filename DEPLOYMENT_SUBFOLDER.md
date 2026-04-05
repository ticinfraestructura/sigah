# SIGAH - Despliegue con Subfolder /sigah

## Arquitectura Final

```
Internet → IP ÚNICA → Nginx Proxy → dominio.com (Tomcat existente)
                                    └──> dominio.com/sigah (SIGAH)
```

**Características clave:**
- ✅ **Una sola IP** para todo
- ✅ **Un dominio** principal
- ✅ **Ruta /sigah** sin crear subcarpetas físicas
- ✅ **Proxy inverso** mapea /sigah → contenedores SIGAH
- ✅ **Tomcat intacto** en el resto del dominio

## Flujo de Navegación

### URLs Finales
- **App Tomcat existente**: `https://dominio.com/`
- **SIGAH Frontend**: `https://dominio.com/sigah/`
- **SIGAH API**: `https://dominio.com/sigah-api/`
- **Health checks**: `https://dominio.com/health`

### Mapeo Interno
```
https://dominio.com/sigah/        → http://sigah_frontend:80/
https://dominio.com/sigah-api/     → http://sigah_backend:3001/api/
https://dominio.com/               → http://tomcat_backend:8080/
```

## Paso 1: Configuración del Frontend SIGAH

### 1.1 Actualizar Vite Config
```bash
# Usar configuración para subfolder
cp frontend/vite.config.subfolder.ts frontend/vite.config.ts
```

### 1.2 Actualizar configuración de API
En `frontend/src/api/config.ts`:
```typescript
// Para desarrollo
const API_BASE_URL = import.meta.env.DEV 
  ? '/sigah-api' 
  : '/sigah-api';

// Para producción
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};
```

### 1.3 Actualizar React Router
En `frontend/src/App.tsx`:
```typescript
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter basename="/sigah">
      {/* Tu aplicación */}
    </BrowserRouter>
  );
}
```

## Paso 2: Configuración del Backend SIGAH

### 2.1 Actualizar CORS y URLs
En `backend/src/config/app.ts`:
```typescript
export const config = {
  port: 3001,
  cors: {
    origin: [
      'https://dominio.com',
      'https://dominio.com/sigah'
    ],
    credentials: true,
  },
  // API sin prefijo, Nginx lo maneja
  apiBasePath: '/',
};
```

## Paso 3: Despliegue con Docker

### 3.1 Variables de Entorno
```bash
cp .env.example .env
nano .env
```

**Configuración crítica:**
```env
DB_PASSWORD=PasswordSuperSeguroSIGAH2024!
JWT_SECRET=SecretJWT64CaracteresMinimoParaProduccion2024!
ALLOWED_ORIGINS=https://dominio.com,https://dominio.com/sigah
```

### 3.2 Desplegar Sistema
```bash
# Crear redes Docker
docker network create sigah-network --subnet 172.20.0.0/16
docker network create tomcat-network --subnet 172.21.0.0/16

# Desplegar con configuración de subfolder
docker-compose -f docker-compose.subfolder.yml up -d --build

# Verificar estado
docker-compose -f docker-compose.subfolder.yml ps
```

## Paso 4: Configuración SSL

### 4.1 Certificados
```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Opción 1: Certificados existentes
cp /path/to/dominio.com.crt nginx/ssl/
cp /path/to/dominio.com.key nginx/ssl/

# Opción 2: Let's Encrypt con wildcard
sudo certbot certonly --standalone -d dominio.com -d www.dominio.com
sudo cp /etc/letsencrypt/live/dominio.com/fullchain.pem nginx/ssl/dominio.com.crt
sudo cp /etc/letsencrypt/live/dominio.com/privkey.pem nginx/ssl/dominio.com.key
```

### 4.2 Reiniciar Nginx
```bash
docker-compose -f docker-compose.subfolder.yml restart nginx-proxy
```

## Paso 5: Verificación Integral

### 5.1 Health Checks
```bash
# Health general
curl https://dominio.com/health

# Health Tomcat
curl https://dominio.com/health/tomcat

# Health SIGAH
curl https://dominio.com/health/sigah
```

### 5.2 Acceso a Aplicaciones
```bash
# App Tomcat existente
curl https://dominio.com/

# SIGAH Frontend
curl https://dominio.com/sigah/

# SIGAH API
curl https://dominio.com/sigah-api/health
```

### 5.3 Verificar en Navegador
1. **App existente**: `https://dominio.com/` (debe funcionar exactamente igual)
2. **SIGAH**: `https://dominio.com/sigah/` (nueva aplicación)
3. **Login SIGAH**: `https://dominio.com/sigah/` → login → debe funcionar

## Troubleshooting Específico

### Problema 1: Assets estáticos no cargan
```bash
# Verificar configuración de Nginx
docker logs sigah-nginx-proxy | grep sigah

# Verificar que el frontend está sirviendo correctamente
docker exec sigah-frontend ls -la /usr/share/nginx/html/
```

### Problema 2: API calls fallan
```bash
# Verificar backend logs
docker logs sigah-backend | grep ERROR

# Verificar que API responde internamente
docker exec sigah-nginx-proxy wget -qO- http://sigah-backend:3001/api/health
```

### Problema 3: Routing de React no funciona
```bash
# Verificar basename en React Router
grep -r "basename" frontend/src/

# Verificar configuración de Vite
cat frontend/vite.config.ts | grep base
```

### Problema 4: CORS errors
```bash
# Verificar configuración CORS del backend
docker logs sigah-backend | grep CORS

# Probar CORS manualmente
curl -H "Origin: https://dominio.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://dominio.com/sigah-api/auth/login
```

## Mantenimiento y Monitoreo

### Logs Específicos
```bash
# Logs Nginx (muy útiles para debugging)
docker logs -f sigah-nginx-proxy

# Logs SIGAH
docker logs -f sigah-backend
docker logs -f sigah-frontend

# Logs específicos de /sigah
docker logs sigah-nginx-proxy 2>&1 | grep sigah
```

### Monitoreo de Rutas
```bash
# Script para verificar todas las rutas
#!/bin/bash
echo "=== Verificación de Rutas ==="

echo "1. Health general:"
curl -s https://dominio.com/health

echo -e "\n2. App Tomcat:"
curl -s -I https://dominio.com/ | head -1

echo -e "\n3. SIGAH Frontend:"
curl -s -I https://dominio.com/sigah/ | head -1

echo -e "\n4. SIGAH API:"
curl -s https://dominio.com/sigah-api/health

echo -e "\n5. Estado de contenedores:"
docker-compose -f docker-compose.subfolder.yml ps
```

## Actualizaciones

### Actualizar SIGAH sin afectar Tomcat
```bash
# 1. Backup
./scripts/recovery.sh backup

# 2. Actualizar código
git pull origin main

# 3. Reconstruir imágenes
docker-compose -f docker-compose.subfolder.yml build --no-cache

# 4. Reiniciar solo SIGAH
docker-compose -f docker-compose.subfolder.yml restart sigah-backend sigah-frontend

# 5. Verificar
curl https://dominio.com/sigah/
```

## Resumen de Ventajas

✅ **Cero impacto** en aplicación Tomcat existente  
✅ **URL limpia**: `dominio.com/sigah`  
✅ **Sin subcarpetas físicas** (todo es proxy)  
✅ **SSL unificado** para todo el dominio  
✅ **Mismo certificado** para ambas aplicaciones  
✅ **Rollback instantáneo** si algo falla  
✅ **Escalabilidad independiente**  

Esta solución cumple exactamente con tu requerimiento: **dominio.com/sigah** sin crear subcarpetas físicas, usando proxy inverso inteligente.
