# Estado del Sistema SIGAH — 2026-06-25

## Ambiente
- **URL local:** http://localhost:8080/sigah
- **Docker Compose:** `docker-compose.subfolder.local.yml`
- **Contenedores activos:** sigah-db, sigah-backend, sigah-frontend, sigah-redis

## Estado de Tests

### Backend (Vitest)
| Suite | Tests | Estado |
|-------|-------|--------|
| auth.test.ts | 10 | ✅ |
| cache.test.ts | 8 | ✅ |
| pagination.test.ts | 11 | ✅ |
| roles-permissions.test.ts | 14 | ✅ |
| users-integration.test.ts | 6 | ✅ |
| inventory.test.ts | 7 | ✅ (nuevo) |
| kits.test.ts | 7 | ✅ (nuevo) |
| **TOTAL** | **63/63** | ✅ |

### Frontend E2E (Playwright — Chromium)
| Suite | Tests | Estado |
|-------|-------|--------|
| auth.spec.ts | 7 | ✅ |
| dashboard.spec.ts | 7 | ✅ |
| deliveries.spec.ts (→ Kits) | 5 | ✅ |
| inventory.spec.ts | 6 | ✅ |
| requests.spec.ts (→ Reports) | 5 | ✅ |
| **TOTAL** | **30/30** | ✅ |

## Cambios aplicados en esta sesión

### Seguridad — Botón Atrás post-logout
- **Problema:** Al hacer logout y presionar Atrás en el browser, se mostraban pantallas protegidas.
- **Fix 1:** `AuthContext.tsx` — `setLoading(false)` ahora espera la respuesta de `authApi.me()` (con timeout 3s) antes de renderizar rutas protegidas.
- **Fix 2:** `Layout.tsx` — `logout()` usa `navigate('/login', { replace: true })` para reemplazar el historial del browser, eliminando la posibilidad de volver con Atrás.
- **Aplica también a:** expiración por inactividad (`onTimeout`).

### Tests E2E
- `deliveries.spec.ts` reescrito para cubrir módulo **Kits** (activo).
- `requests.spec.ts` reescrito para cubrir módulo **Reportes** (activo).
- Correcciones de selectores según UI real: botón "Ingresar", dropdown avatar, `networkidle`, strict mode `.first()`.
- `playwright.config.ts`: baseURL corregida a `http://localhost:8080/sigah`.

### Tests Unitarios Backend
- Nuevo `inventory.test.ts`: CRUD productos, lotes, stock, movimientos.
- Nuevo `kits.test.ts`: CRUD kits, productos de kit, inventario, baja lógica.
- `schema.prisma` corregido: `RolePermission` usa `permissionId` FK → modelo `Permission`.

## UAT Manual
- **Acta generada:** `ACTA-PRUEBAS-UAT-2026-06-25.md` (62 casos)
- **Completado:** Módulo 1 — Autenticación (casos 1.1–1.5 ✅, 1.6 en corrección)
- **Pendiente:** Módulos 2–7 (Dashboard, Inventario, Kits, Reportes, Usuarios/Roles, Seguridad)

## Backup
- **Archivo:** `C:\PROYECTOS\backups\sigah\sigah_backup_20260625.dump`
- **Tamaño:** ~119 KB
- **Formato:** PostgreSQL custom (-F c), restaurar con `pg_restore`

## Credenciales de prueba
- **Admin:** admin@sigah.com / Admin123!
- **Playwright baseURL:** http://localhost:8080/sigah
