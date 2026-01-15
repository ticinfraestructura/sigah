# SIGAH - Guía de Despliegue

## Requisitos Previos

### En tu máquina local (Windows)
- Git instalado ([descargar](https://git-scm.com/download/win))
- Cuenta en GitHub

### En el servidor On-Premise
- Docker instalado ([guía](https://docs.docker.com/engine/install/))
- Docker Compose instalado
- Git instalado
- Mínimo 2GB RAM, 20GB disco

---

## Paso 1: Subir a GitHub

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
git clone https://github.com/TU_USUARIO/sigah.git
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

1. Abrir navegador: `http://IP_SERVIDOR`
2. Debería verse la página de login de SIGAH
3. Verificar health check: `http://IP_SERVIDOR/api/health`

---

## Comandos Útiles

### Gestión de contenedores
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
```

### Base de datos
```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U sigah -d sigah

# Backup de base de datos
docker-compose exec postgres pg_dump -U sigah sigah > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U sigah sigah < backup.sql
```

### Prisma
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Ver estado de migraciones
docker-compose exec backend npx prisma migrate status

# Abrir Prisma Studio (debug)
docker-compose exec backend npx prisma studio
```

---

## Solución de Problemas

### Error: "DB_PASSWORD is required"
```bash
# Verificar que .env existe y tiene valores
cat .env
```

### Error de conexión a base de datos
```bash
# Verificar que postgres está corriendo
docker-compose ps

# Ver logs de postgres
docker-compose logs postgres
```

### Página en blanco o error 502
```bash
# Verificar estado del backend
docker-compose logs backend

# Reiniciar servicios
docker-compose restart
```

### Actualizar la aplicación
```bash
cd sigah
git pull origin main
docker-compose up -d --build
```

---

## Arquitectura

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

---

## Contacto

Para soporte técnico o preguntas, contactar al administrador del sistema.
