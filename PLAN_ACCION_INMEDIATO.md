# SIGAH - Plan de Acción Inmediato

## 🎯 **Objetivo: Poner SIGAH en producción en dominio.com/sigah**

### **Paso 1: Preparación del Entorno (5 minutos)**

```bash
# 1. Ir al directorio del proyecto
cd C:\Entregas\sigah\sigah

# 2. Crear estructura de directorios
mkdir -p logs backups configs

# 3. Configurar variables de entorno
cp .env.example .env
```

**Editar `.env` con estos valores:**
```env
DB_PASSWORD=PasswordSuperSeguroSIGAH2024!
JWT_SECRET=SecretJWT64CaracteresMinimoParaProduccion2024!
ALLOWED_ORIGINS=https://dominio.com,https://dominio.com/sigah
```

### **Paso 2: Iniciar Entorno de Desarrollo (10 minutos)**

```bash
# 1. Iniciar desarrollo para probar todo
docker-compose -f docker-compose.dev.new.yml up -d --build

# 2. Esperar que esté listo (30 segundos)
sleep 30

# 3. Verificar que funciona
curl http://localhost:3001/api/health
curl http://localhost:3000
```

**Acceder en navegador:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api/docs`
- pgAdmin: `http://localhost:5050` (dev@sigah.com / dev123)

### **Paso 3: Probar Entorno de Staging (10 minutos)**

```bash
# 1. Detener desarrollo
docker-compose -f docker-compose.dev.new.yml down

# 2. Iniciar staging
docker-compose -f docker-compose.staging.yml up -d --build

# 3. Esperar que esté listo (45 segundos)
sleep 45

# 4. Verificar staging
curl http://localhost:8080/health
curl http://localhost:8080/sigah-api/health
```

**Acceder en navegador:**
- SIGAH Staging: `http://localhost:8080/sigah/`
- API: `http://localhost:8080/sigah-api/health`

### **Paso 4: Preparar Producción (15 minutos)**

```bash
# 1. Detener staging
docker-compose -f docker-compose.staging.yml down

# 2. Preparar certificados SSL
mkdir -p nginx/ssl

# Opción A: Usar certificados existentes
# cp /path/to/tu-certificado.crt nginx/ssl/dominio.com.crt
# cp /path/to/tu-privada.key nginx/ssl/dominio.com.key

# Opción B: Generar certificados auto-firmados (para testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/dominio.com.key \
  -out nginx/ssl/dominio.com.crt \
  -subj "/C=CO/ST=State/L=City/O=Organization/CN=dominio.com"

# 3. Configurar permisos
chmod 600 nginx/ssl/dominio.com.key
chmod 644 nginx/ssl/dominio.com.crt
```

### **Paso 5: Desplegar Producción (10 minutos)**

```bash
# 1. Iniciar producción
docker-compose -f docker-compose.subfolder.yml up -d --build

# 2. Esperar que esté listo (60 segundos)
sleep 60

# 3. Verificar producción
curl http://localhost/health
curl http://localhost/health/sigah
```

### **Paso 6: Verificación Final (5 minutos)**

```bash
# 1. Verificar todos los servicios
docker-compose -f docker-compose.subfolder.yml ps

# 2. Verificar logs
docker-compose -f docker-compose.subfolder.yml logs -f

# 3. Health checks completos
curl http://localhost/health          # Nginx OK
curl http://localhost/health/tomcat     # Tomcat OK
curl http://localhost/health/sigah      # SIGAH OK
```

**Acceder en navegador final:**
- App Tomcat: `http://localhost/`
- SIGAH: `http://localhost/sigah/`
- API SIGAH: `http://localhost/sigah-api/health`

## 🌐 **Paso 7: Configurar Dominio Real**

### **Si tienes dominio real:**

```bash
# 1. Reemplazar "dominio.com" con tu dominio real
# Editar nginx/conf.d/subfolder.conf
# Reemplazar todas las instancias de "dominio.com"

# 2. Configurar DNS
# Apuntar tu-dominio.com → IP del servidor

# 3. Usar certificados reales
# Let's Encrypt o certificado comprado

# 4. Reiniciar con dominio real
docker-compose -f docker-compose.subfolder.yml down
docker-compose -f docker-compose.subfolder.yml up -d --build
```

### **Si es solo para testing local:**

```bash
# 1. Agregar dominio a hosts file
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

# Agregar línea:
127.0.0.1  dominio.com

# 2. Acceder con dominio falso
# http://dominio.com/sigah/
```

## 🔍 **VERIFICACIÓN POST-DESPLIEGUE**

### **Checklist Final:**
- [ ] Frontend SIGAH carga en `dominio.com/sigah/`
- [ ] Login funciona correctamente
- [ ] API responde en `dominio.com/sigah-api/`
- [ ] App Tomcat sigue funcionando en `dominio.com/`
- [ ] No hay errores en los logs
- [ ] Health checks responden correctamente

### **Testing Básico:**
1. **Crear usuario** en SIGAH
2. **Iniciar sesión** correctamente
3. **Crear producto** de prueba
4. **Verificar** que aparece en inventario
5. **Probar** diferentes módulos

## 🚨 **TROUBLESHOOTING RÁPIDO**

### **Si SIGAH no carga:**
```bash
# Verificar logs de Nginx
docker logs sigah-nginx-proxy | grep sigah

# Verificar frontend
docker logs sigah-frontend

# Verificar backend
docker logs sigah-backend
```

### **Si API calls fallan:**
```bash
# Probar API directamente
curl http://localhost/sigah-api/health

# Verificar CORS
curl -H "Origin: http://dominio.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost/sigah-api/auth/login
```

### **Si Tomcat no funciona:**
```bash
# Verificar configuración de red
docker network ls | grep tomcat

# Probar conexión directa
curl http://localhost/health/tomcat
```

## 📋 **COMANDOS DE MANTENIMIENTO**

### **Ver estado:**
```bash
./scripts/devops-workflow.sh status
```

### **Reiniciar servicios:**
```bash
docker-compose -f docker-compose.subfolder.yml restart
```

### **Ver logs:**
```bash
docker-compose -f docker-compose.subfolder.yml logs -f
```

### **Actualizar código:**
```bash
git pull
docker-compose -f docker-compose.subfolder.yml up -d --build
```

---

## ✅ **¡LISTO PARA EMPEZAR!**

**Tiempo estimado total:** 45-60 minutos  
**Complejidad:** Media  
**Requisitos:** Docker, Git, dominio (opcional para testing)

**Próximo paso:** Ejecutar el Paso 1 ahora mismo
