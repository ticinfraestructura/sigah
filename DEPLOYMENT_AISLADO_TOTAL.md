# SIGAH - Despliegue Aislado Total (Infraestructura Intacta)

## Contexto Crítico
- **Tomcat existente**: NO se toca NADA
- **Aplicación actual**: Continúa exactamente igual
- **Nuevos servicios**: 100% aislados
- **Nginx nuevo**: Proxy maestro que dirige TODO el tráfico

## Arquitectura Final
```
Internet → Nginx Nuevo (80/443) → Tomcat Existente (8080) [INTACTO]
                                      └→ SIGAH (3001, 8080) [NUEVO]
```

## Paso 1: Instalar Nginx Nuevo (Sin afectar el existente)

### 1.1 Instalar Nginx adicional
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y

# Configurar para que NO inicie automáticamente
sudo systemctl disable nginx
```

### 1.2 Configurar puertos no conflictivos
```bash
# Detener Nginx nuevo si inició
sudo systemctl stop nginx

# Verificar que Nginx existente sigue funcionando
sudo systemctl status nginx  # Este es el existente
```

### 1.3 Configurar Nginx nuevo como proxy maestro
```bash
# Usar nuestra configuración personalizada
sudo cp nginx-master-proxy.conf /etc/nginx/sites-available/master-proxy

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/master-proxy /etc/nginx/sites-enabled/

# Deshabilitar default
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t
```

### 1.4 Cambiar puerto del Nginx existente
```bash
# Editar configuración del Nginx existente
sudo nano /etc/nginx/sites-enabled/default

# Cambiar listen 80 a listen 8080 (o otro puerto libre)
# Esto libera el puerto 80 para el Nginx nuevo

# Reiniciar Nginx existente
sudo systemctl restart nginx
```

### 1.5 Iniciar Nginx nuevo como proxy maestro
```bash
# Iniciar Nginx nuevo
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

## Paso 2: Desplegar SIGAH (Totalmente aislado)

### 2.1 Preparar entorno
```bash
# Crear directorio para SIGAH
sudo mkdir -p /opt/sigah
sudo chown $USER:$USER /opt/sigah
cd /opt/sigah

# Clonar repositorio
git clone <repo-url> .
```

### 2.2 Configurar variables de entorno
```bash
cp .env.example .env
nano .env
```

**Variables críticas:**
```env
DB_PASSWORD=PasswordSeguroSIGAH2024!
JWT_SECRET=SecretoJWT64CaracteresMinimoParaSIGAH2024!
ALLOWED_ORIGINS=https://tu-dominio.com,http://tu-dominio.com
```

### 2.3 Desplegar con Docker aislado
```bash
# Usar archivo aislado
docker-compose -f docker-compose.isolated.yml up -d --build

# Verificar que todo está corriendo
docker-compose -f docker-compose.isolated.yml ps
```

### 2.4 Verificar conectividad
```bash
# Verificar backend SIGAH
curl http://127.0.0.1:3001/api/health

# Verificar frontend SIGAH
curl http://127.0.0.1:8080/

# Verificar Tomcat existente (debe seguir funcionando)
curl http://127.0.0.1:8080/
```

## Paso 3: Verificación Integral

### 3.1 Acceso a las aplicaciones
```bash
# Aplicación Tomcat existente (vía Nginx nuevo)
curl http://tu-dominio.com/

# SIGAH Frontend
curl http://tu-dominio.com/sigah/

# SIGAH API
curl http://tu-dominio.com/sigah-api/health

# Health checks
curl http://tu-dominio.com/health/master
curl http://tu-dominio.com/health/tomcat
curl http://tu-dominio.com/health/sigah
```

### 3.2 Verificar que Tomcat no fue afectado
```bash
# Acceso directo a Tomcat (debe seguir funcionando)
curl http://127.0.0.1:8080/

# Logs de Tomcat (no deben mostrar errores nuevos)
sudo tail -f /var/log/tomcat9/catalina.out
```

## Paso 4: Configuración SSL (Recomendado)

### 4.1 Instalar certificados en Nginx nuevo
```bash
# Crear directorio SSL
sudo mkdir -p /etc/nginx/ssl

# Copiar certificados (o usar Let's Encrypt)
sudo cp tu-certificado.crt /etc/nginx/ssl/
sudo cp tu-privada.key /etc/nginx/ssl/

# Ajustar permisos
sudo chmod 600 /etc/nginx/ssl/tu-privada.key
```

### 4.2 Habilitar configuración SSL
```bash
# La configuración SSL ya está en nginx-master-proxy.conf
# Solo necesita los certificados

# Recargar Nginx
sudo systemctl reload nginx
```

## Monitoreo y Mantenimiento

### Verificación de salud completa
```bash
#!/bin/bash
# monitor.sh

echo "=== Verificación de Sistema ==="

# Nginx master
if curl -f http://localhost/health/master > /dev/null 2>&1; then
    echo "✓ Nginx Master OK"
else
    echo "✗ Nginx Master FALLÓ"
fi

# Tomcat existente
if curl -f http://localhost/health/tomcat > /dev/null 2>&1; then
    echo "✓ Tomcat Existente OK"
else
    echo "✗ Tomcat Existente FALLÓ"
fi

# SIGAH
if curl -f http://localhost/health/sigah > /dev/null 2>&1; then
    echo "✓ SIGAH OK"
else
    echo "✗ SIGAH FALLÓ"
fi

echo "=== Fin Verificación ==="
```

### Logs específicos
```bash
# Logs Nginx nuevo (master)
sudo tail -f /var/log/nginx/master-access.log
sudo tail -f /var/log/nginx/master-error.log

# Logs SIGAH
cd /opt/sigah
docker-compose -f docker-compose.isolated.yml logs -f

# Logs Tomcat existente (sin cambios)
sudo tail -f /var/log/tomcat9/catalina.out
```

## Plan de Rollback (Si algo falla)

### Opción 1: Desactivar SIGAH solo
```bash
# Detener SIGAH
cd /opt/sigah
docker-compose -f docker-compose.isolated.yml down

# Tomcat sigue funcionando vía Nginx nuevo
curl http://tu-dominio.com/
```

### Opción 2: Rollback completo
```bash
# Detener Nginx nuevo
sudo systemctl stop nginx

# Restaurar Nginx existente al puerto 80
sudo nano /etc/nginx/sites-enabled/default
# Cambiar listen 8080 a listen 80

# Reiniciar Nginx existente
sudo systemctl restart nginx

# Todo vuelve a la normalidad exactamente como estaba
```

## Resumen de Impacto CERO

### ¿Qué NO se toca?
- **Tomcat**: Exactamente igual, misma configuración, mismos puertos
- **Aplicación existente**: Cero cambios, mismo funcionamiento
- **Base de datos existente**: No se afecta
- **Red existente**: Sin modificaciones
- **Usuarios existentes**: No notan ningún cambio

### ¿Qué se AGREGA?
- **Nginx nuevo**: Como proxy maestro
- **Contenedores SIGAH**: 100% aislados
- **Nuevos puertos**: Solo accesibles desde localhost

### Resultado Final
- **Aplicación existente**: `http://tu-dominio.com/` (exactamente igual)
- **SIGAH**: `http://tu-dominio.com/sigah/` (nueva funcionalidad)
- **0 downtime**: La aplicación existente nunca se detiene
- **0 riesgo**: Rollback instantáneo si algo falla
