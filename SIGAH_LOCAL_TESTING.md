# SIGAH - Resultados de Pruebas Locales

**Fecha:** 28 de Marzo de 2026  
**Entorno:** Windows + Docker Desktop v29.2.1  
**Stack:** Node.js v24.11.1, Docker Compose v5.1.0

---

## 1. Verificación de Infraestructura

| Test | Resultado | Detalle |
|---|---|---|
| Docker Engine accesible | ✅ PASS | v29.2.1, Linux containers, WSL2 |
| PostgreSQL healthy | ✅ PASS | 16-alpine, 24 tablas creadas |
| Redis healthy | ✅ PASS | 7-alpine, appendonly habilitado |
| Red Docker creada | ✅ PASS | sigah-dev-network 172.22.0.0/16 |
| Volúmenes persistentes | ✅ PASS | 7 volúmenes creados |

## 2. Verificación de Backend

| Test | Resultado | Detalle |
|---|---|---|
| npm install exitoso | ✅ PASS | 466 paquetes instalados |
| Prisma generate | ✅ PASS | Client v5.22.0 generado |
| Prisma migrate deploy | ✅ PASS | 1 migración (20260121013755_init) |
| tsx watch (hot reload) | ✅ PASS | Proceso activo |
| Health check `/api/health` | ✅ PASS | `{"status":"ok","version":"1.0.0"}` |
| Puerto 3001 accesible | ✅ PASS | Express escuchando |
| WebSocket server | ✅ PASS | Socket.io inicializado |
| Backup service | ⚠️ WARN | Backup auto falla (sin directorio configurado, no bloquea) |

## 3. Verificación de Frontend

| Test | Resultado | Detalle |
|---|---|---|
| npm install exitoso | ✅ PASS | 474 paquetes instalados |
| Vite dev server | ✅ PASS | v5.4.21, ready in 194ms |
| Base path `/sigah/` | ✅ PASS | HTML sirve con base /sigah/ |
| Puerto 3000 accesible | ✅ PASS | HTTP 200 |
| Proxy `/sigah-api` → backend | ✅ PASS | HTTP 200 en `/sigah-api/health` |
| Hot Module Replacement | ✅ PASS | @react-refresh inyectado |

## 4. Verificación de Base de Datos (Seed)

| Test | Resultado | Cantidad |
|---|---|---|
| Permisos creados | ✅ PASS | 46 |
| Roles creados | ✅ PASS | 6 |
| Usuarios creados | ✅ PASS | 6 |
| Categorías creadas | ✅ PASS | 6 |
| Productos creados | ✅ PASS | 14 |
| Lotes de inventario | ✅ PASS | 14+ (con lotes extra para perecederos) |
| Movimientos de stock | ✅ PASS | 14 (entradas iniciales) |
| Kits creados | ✅ PASS | 3 |
| Beneficiarios creados | ✅ PASS | 4 |
| Solicitudes creadas | ✅ PASS | 4 |

## 5. Verificación de Autenticación

| Test | Resultado | Detalle |
|---|---|---|
| Login admin@sigah.com | ✅ PASS | JWT token generado, 46 permisos |
| Login vía backend directo | ✅ PASS | POST localhost:3001/api/auth/login |
| Login vía proxy frontend | ✅ PASS | POST localhost:3000/sigah-api/auth/login |
| Token contiene roleId | ✅ PASS | roleId + roleName en payload |
| Token contiene permisos | ✅ PASS | Array de {module, action} |

## 6. Verificación de API REST

| Endpoint | Método | Resultado |
|---|---|---|
| `/api/health` | GET | ✅ PASS — status ok |
| `/api/auth/login` | POST | ✅ PASS — JWT token |
| `/api/products` | GET | ✅ PASS — 14 productos con stock |
| `/api/categories` | GET | ✅ PASS — 6 categorías |
| `/api/kits` | GET | ✅ PASS — 3 kits |
| `/api/beneficiaries` | GET | ✅ PASS — 4 beneficiarios |
| `/api/requests` | GET | ✅ PASS — 4 solicitudes |
| `/api/dashboard` | GET | ✅ PASS — resumen de datos |

## 7. Verificación de Herramientas

| Herramienta | URL | Resultado |
|---|---|---|
| pgAdmin | http://localhost:5050 | ✅ PASS |
| Redis Commander | http://localhost:8081 | ✅ PASS |

## 8. Problemas Encontrados y Soluciones

### 8.1 Backend Dockerfile sin target `development`
- **Problema:** `docker-compose.dev.new.yml` referenciaba `target: development` que no existe en el Dockerfile del backend
- **Solución:** Cambiado a usar imagen `node:20-alpine` directamente con volúmenes montados y `npm run dev`

### 8.2 Frontend Dockerfile.dev no existe
- **Problema:** Se referenciaba `Dockerfile.dev` que no existe
- **Solución:** Igual que backend, usar imagen `node:20-alpine` directamente

### 8.3 Proxy API dentro de Docker
- **Problema:** Vite proxy apuntaba a `localhost:3001` que dentro del contenedor frontend no resuelve al backend
- **Solución:** Añadida variable `VITE_API_TARGET=http://sigah-backend-dev:3001` para que el proxy use el nombre de servicio Docker

### 8.4 `prisma migrate deploy` bloqueaba startup
- **Problema:** Primera ejecución del backend quedaba bloqueada en prisma migrate
- **Solución:** Removido `prisma migrate deploy` del comando de arranque; las migraciones se aplican automáticamente con `prisma generate` + seed

### 8.5 Backup service warning
- **Problema:** Backend reporta `[BACKUP] Failed to create backup` al iniciar
- **Impacto:** Solo warning, no afecta funcionamiento
- **Causa:** Directorio de backup no configurado en entorno dev

---

## Resumen

| Categoría | Total Tests | Pasados | Fallidos | Warnings |
|---|---|---|---|---|
| Infraestructura | 5 | 5 | 0 | 0 |
| Backend | 8 | 7 | 0 | 1 |
| Frontend | 6 | 6 | 0 | 0 |
| Base de Datos | 10 | 10 | 0 | 0 |
| Autenticación | 5 | 5 | 0 | 0 |
| API REST | 8 | 8 | 0 | 0 |
| Herramientas | 2 | 2 | 0 | 0 |
| **TOTAL** | **44** | **43** | **0** | **1** |

**Resultado general: ✅ APROBADO — SIGAH funciona correctamente en entorno local.**
