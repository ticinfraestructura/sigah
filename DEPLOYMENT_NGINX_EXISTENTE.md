# SIGAH - Guía de Despliegue con Nginx Existente

## Contexto
- Servidor Nginx ya configurado como reverse proxy
- Aplicación Tomcat existente funcionando
- SIGAH debe convivir sin afectar la aplicación actual

## Paso 1: Configurar Nginx Principal

### 1.1 Backup de configuración actual
```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
```

### 1.2 Integrar SIGAH en Nginx
Agregar el bloque de configuración (ver nginx-sigah.conf) al servidor existente:

```bash
# Editar configuración principal
sudo nano /etc/nginx/sites-available/default
```

### 1.3 Probar configuración Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Paso 2: Desplegar SIGAH

### 2.1 Usar Docker Compose modificado
```bash
# Descargar SIGAH
git clone <repo-url>
cd sigah

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Variables importantes para este escenario:**
```env
DB_PASSWORD=TuPasswordSeguro2024!
JWT_SECRET=UnSecretoMuyLargoDeAlMenos64CaracteresParaJWT2024!
ALLOWED_ORIGINS=http://tu-dominio.com,https://tu-dominio.com
```

### 2.2 Levantar contenedores
```bash
# Usar archivo modificado
docker-compose -f docker-compose.nginx.yml up -d --build
```

## Paso 3: Configurar Frontend SIGAH

### 3.1 Actualizar configuración de Vite
En `frontend/vite.config.ts`:
```typescript
export default defineConfig({
  // ... otras configuraciones
  base: '/sigah/',  // Importante: base path
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
```

### 3.2 Reconstruir frontend
```bash
docker-compose -f docker-compose.nginx.yml up -d --build frontend
```

## Paso 4: Verificación

### 4.1 Acceso a las aplicaciones
- **Aplicación existente**: `http://tu-dominio.com/app-antigua/`
- **SIGAH**: `http://tu-dominio.com/sigah/`
- **API SIGAH**: `http://tu-dominio.com/api/health`

### 4.2 Verificar logs
```bash
# Logs SIGAH
docker-compose -f docker-compose.nginx.yml logs -f

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Solución de Problemas

### Error 502 Bad Gateway
```bash
# Verificar que backend SIGAH está corriendo
curl http://localhost:3001/api/health

# Verificar configuración de proxy
sudo nginx -t
```

### Conflictos de puertos
```bash
# Ver puertos en uso
sudo netstat -tlnp | grep :8080
sudo netstat -tlnp | grep :3001

# Si hay conflictos, modificar docker-compose.nginx.yml
```

### Aplicación Tomcat afectada
```bash
# Verificar que Tomcat sigue funcionando
curl http://localhost:8080/app-antigua/

# Revisar logs de Tomcat
sudo tail -f /var/log/tomcat9/catalina.out
```

## Mantenimiento

### Actualizar SIGAH sin afectar Tomcat
```bash
cd sigah
git pull
docker-compose -f docker-compose.nginx.yml up -d --build
```

### Backup de base de datos SIGAH
```bash
# Backup sin afectar otras bases de datos
docker-compose -f docker-compose.nginx.yml exec postgres pg_dump -U sigah sigah > backup_sigah_$(date +%Y%m%d).sql
```

## Consideraciones de Seguridad

### Aislamiento de redes
- SIGAH usa su propia red Docker
- Solo puertos específicos expuestos
- Nginx como único punto de entrada

### SSL/TLS
Si usas HTTPS (recomendado):
```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... misma configuración de proxy
}
```

## Monitoreo

### Health checks automáticos
```bash
# Script de monitoreo
#!/bin/bash
# check_sigah.sh

# Verificar backend
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "SIGAH Backend down"
    # Enviar alerta
fi

# Verificar frontend
if ! curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "SIGAH Frontend down"
    # Enviar alerta
fi
```

## Resumen de Impacto

### Cambios mínimos al sistema existente:
1. **Nginx**: Solo agregar bloques `location`
2. **Red**: No se modifican configuraciones de red existentes
3. **Tomcat**: Continúa funcionando exactamente igual
4. **Puertos**: SIGAH usa puertos diferentes (8080, 3001)

### Ventajas:
- **Aislamiento completo**: SIGAH independiente de Tomcat
- **Cero downtime**: Tomcat nunca se detiene
- **Rollback fácil**: Basta con remover configuración Nginx
- **Escalabilidad**: Cada aplicación puede escalarse independientemente
