# SIGAH - Guía de Implementación Local (Windows)

## Requisitos Previos

| Herramienta | Versión mínima | Verificado |
|---|---|---|
| Docker Desktop | 29.x+ | ✅ v29.2.1 |
| Node.js | 18.x+ | ✅ v24.11.1 |
| Git | 2.x+ | ✅ v2.51.1 |
| Docker Compose | v5.x+ | ✅ v5.1.0 |

**Docker Desktop debe estar en modo Linux containers.**

---

## Paso 1: Clonar y preparar

```powershell
cd C:\Entregas\sigah\sigah
mkdir logs, backups, configs
copy .env.example .env
```

Editar `.env` con credenciales de desarrollo (los valores por defecto de `docker-compose.dev.new.yml` ya incluyen todo para dev local).

---

## Paso 2: Levantar el stack

```powershell
docker compose -f docker-compose.dev.new.yml up -d
```

> **Nota:** La primera vez descarga imágenes (~500 MB) e instala dependencias (~2 min).  
> El backend ejecuta automáticamente: `apk add openssl → npm install → prisma generate → npm run dev`.

### Verificar que todo esté corriendo

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Resultado esperado:**

| Contenedor | Estado |
|---|---|
| sigah-backend-dev | Up |
| sigah-frontend-dev | Up |
| sigah-db-dev | Up (healthy) |
| sigah-redis-dev | Up (healthy) |
| sigah-pgadmin-dev | Up |
| sigah-redis-commander-dev | Up (healthy) |

---

## Paso 3: Poblar base de datos

```powershell
docker exec sigah-backend-dev npx prisma db seed
```

**Resultado esperado:**
```
🌱 Seeding database...
✅ 46 permissions created
✅ 6 roles created with permissions
✅ Users created with roles assigned
✅ Categories created
✅ Products created
✅ Inventory lots created
✅ Kits created
✅ Beneficiaries created
✅ Requests created
🎉 Seed completed successfully!
```

---

## Paso 4: Verificar servicios

### Health check backend
```powershell
curl -sS http://localhost:3001/api/health
```
**Esperado:** `{"status":"ok", ...}`

### Health check frontend
```powershell
curl -sS -o NUL -w "HTTP %{http_code}" http://localhost:3000/sigah/
```
**Esperado:** `HTTP 200`

### Proxy API (frontend → backend)
```powershell
curl -sS -o NUL -w "HTTP %{http_code}" http://localhost:3000/sigah-api/health
```
**Esperado:** `HTTP 200`

---

## Paso 5: Acceder a la aplicación

| Servicio | URL | Credenciales |
|---|---|---|
| **SIGAH Frontend** | http://localhost:3000/sigah/ | admin@sigah.com / admin123 |
| **Backend API Docs** | http://localhost:3001/api/docs | — |
| **pgAdmin** | http://localhost:5050 | dev@sigah.com / dev123 |
| **Redis Commander** | http://localhost:8081 | — |
| **PostgreSQL directo** | localhost:5433 | sigah / dev123 / sigah_dev |
| **Redis directo** | localhost:6380 | — |

---

## Cuentas de prueba

| Email | Password | Rol | Permisos |
|---|---|---|---|
| admin@sigah.com | admin123 | Administrador | Acceso total |
| autorizador@sigah.com | admin123 | Autorizador | Aprobar solicitudes y entregas |
| bodega@sigah.com | admin123 | Bodega | Inventario y preparación |
| despachador@sigah.com | admin123 | Despachador | Realizar entregas |
| operador@sigah.com | admin123 | Operador | Solicitudes y beneficiarios |
| consulta@sigah.com | admin123 | Consulta | Solo lectura |

---

## Datos de prueba incluidos

- **46** permisos (RBAC completo)
- **6** roles del sistema
- **6** usuarios
- **6** categorías (Alimentos, Aseo Personal, Aseo Hogar, Ropa, Medicamentos, Emergencia)
- **14** productos con stock y lotes
- **3** kits (Alimentario, Aseo, Emergencia)
- **4** beneficiarios
- **4** solicitudes en distintos estados

---

## Comandos útiles

### Gestión de contenedores
```powershell
# Detener todo
docker compose -f docker-compose.dev.new.yml down

# Reiniciar un servicio
docker compose -f docker-compose.dev.new.yml restart sigah-backend-dev

# Ver logs en tiempo real
docker logs -f sigah-backend-dev
docker logs -f sigah-frontend-dev

# Re-crear todo desde cero
docker compose -f docker-compose.dev.new.yml down -v
docker compose -f docker-compose.dev.new.yml up -d
```

### Base de datos
```powershell
# Acceder a psql
docker exec -it sigah-db-dev psql -U sigah -d sigah_dev

# Backup
docker exec sigah-db-dev pg_dump -U sigah sigah_dev > backups/sigah_dev_backup.sql

# Restaurar
Get-Content backups/sigah_dev_backup.sql | docker exec -i sigah-db-dev psql -U sigah -d sigah_dev

# Re-ejecutar seed
docker exec sigah-backend-dev npx prisma db seed
```

### Prisma
```powershell
# Ver estado de migraciones
docker exec sigah-backend-dev npx prisma migrate status

# Abrir Prisma Studio (explorar BD visualmente)
docker exec -it sigah-backend-dev npx prisma studio
```

---

## Arquitectura local

```
┌──────────────────────────────────────────────────────────────┐
│                     TU MÁQUINA WINDOWS                       │
│                                                              │
│  Navegador → http://localhost:3000/sigah/                     │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Docker (sigah-dev-network)                  │ │
│  │                                                         │ │
│  │  sigah-frontend-dev (:3000)                             │ │
│  │       │ proxy /sigah-api → backend:3001/api             │ │
│  │       ▼                                                 │ │
│  │  sigah-backend-dev  (:3001)                             │ │
│  │       │                                                 │ │
│  │       ├──→ sigah-db-dev    (PostgreSQL :5432)           │ │
│  │       └──→ sigah-redis-dev (Redis :6379)                │ │
│  │                                                         │ │
│  │  Herramientas:                                          │ │
│  │    pgadmin-dev          (:5050)                         │ │
│  │    redis-commander-dev  (:8081)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Puertos utilizados

| Puerto | Servicio |
|---|---|
| 3000 | Frontend (Vite dev server) |
| 3001 | Backend API (Express) |
| 5050 | pgAdmin |
| 5433 | PostgreSQL (mapeado de 5432) |
| 6380 | Redis (mapeado de 6379) |
| 8081 | Redis Commander |
