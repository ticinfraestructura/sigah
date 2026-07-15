# Estado del Sistema SIGAH — 2026-07-15

## Ambiente de Ejecución
| Componente | Valor |
|---|---|
| **URL local** | http://localhost:3000 |
| **URL LAN** | http://192.168.1.45:3000 |
| **Docker Compose** | `docker-compose.yml` |
| **Versión** | v1.3.2 |

## Contenedores Docker
| Contenedor | Estado | Puerto |
|---|---|---|
| `sigah-github-backend` | ✅ Running | 3000→3000 |
| `sigah-github-db` (PostgreSQL) | ✅ Healthy | 5432 |
| `sigah-github-redis` | ✅ Healthy | 6379 |

> **Nota:** Contenedor `sigah-github-frontend` eliminado - backend ahora sirve archivos estáticos

---

## Módulos del Sistema

| Módulo | Ruta | Estado | Exporta Excel | Exporta PDF |
|---|---|---|---|---|
| Login / Autenticación | `/login` | ✅ | — | — |
| Dashboard | `/` | ✅ | — | — |
| Gestión de Inventario | `/inventory` | ✅ | ✅ | ✅ |
| — Ingresos de Kits | `/inventory` (pestaña) | ✅ | ✅ | ✅ |
| — Egresos de Kits | `/inventory` (pestaña) | ✅ | ✅ | ✅ |
| — Auditoría de Inventario | `/inventory` (pestaña) | ✅ | ✅ | ✅ |
| Auditoría de Inventario | `/inventory-audit` | ✅ | ✅ | ✅ |
| Kits | `/kits` | ✅ | ✅ | ✅ |
| Roles y Permisos | `/roles` | ✅ | ✅ | ✅ |
| Gestión de Usuarios | `/users` | ✅ | ✅ | ✅ |
| Reportes Avanzados | `/reports` | ✅ | ✅ | ✅ |
| Copias de Seguridad | `/backups` | ✅ | — | — |

### Módulos Deshabilitados
| Módulo | Estado |
|---|---|
| Beneficiarios | ❌ Deshabilitado |
| Solicitudes | ❌ Deshabilitado |
| Entregas | ❌ Deshabilitado |
| Devoluciones | ❌ Deshabilitado |
| Notificaciones | ❌ Deshabilitado |

---

## Configuración de Seguridad
| Componente | Estado |
|---|---|
| Helmet (CSP) | ⚠️ Deshabilitado (para LAN) |
| HSTS | ⚠️ Deshabilitado (para LAN) |
| Cross-Origin-Opener-Policy | ⚠️ Deshabilitado (para LAN) |
| Origin-Agent-Cluster | ⚠️ Deshabilitado (para LAN) |
| CORS | ✅ Deshabilitado (permite acceso desde cualquier origen) |

> **Nota:** Headers de seguridad deshabilitados para permitir acceso HTTP en LAN. Reactivar para producción en internet.

---

## Pruebas Automatizadas de Exportación (2026-07-15)

### Protocolo ejecutado: 12/12 PASS

| Reporte | Excel | PDF | Tamaño aprox. |
|---|---|---|---|
| `audit/inventory` | ✅ PASS | ✅ PASS | ~38 KB / ~9.5 KB |
| `roles/listado` | ✅ PASS | ✅ PASS | ~17.7 KB / ~2.4 KB |
| `users/listado` | ✅ PASS | ✅ PASS | ~18.6 KB / ~2.6 KB |
| `kits/ingresos` | ✅ PASS | ✅ PASS | — |
| `kits/egresos` | ✅ PASS | ✅ PASS | — |
| `inventory/stock_actual` | ✅ PASS | ✅ PASS | — |

> Nota: Los endpoints tienen rate limiting. En pruebas automáticas seguidas se recibe HTTP 429 que no es un error real — se resuelve esperando 30 segundos entre tandas.

---

## Fixes Aplicados en Esta Sesión (2026-07-06 / 2026-07-07)

### 1. Pantalla blanca — Egresos de Kits
- **Causa:** `ReferenceError: FileText is not defined` en `KitExitsTab.tsx`
- **Fix:** Agregar `FileText` al import de `lucide-react`
- **Archivo:** `frontend/src/components/KitExitsTab.tsx`

### 2. Error 400 — Exportación en Roles, Usuarios y Auditoría
- **Causa:** Se enviaban objetos con estructuras anidadas (`permissions[]`, `oldValues`, `newValues`) que no cumplen el esquema Zod `reportRowSchema` del backend
- **Fix:** Cambiar `data={localData}` por `data={[]}` en los tres componentes; el backend genera los datos con sus funciones `generateXxxReport()`
- **Archivos:** `RolesManagement.tsx`, `UsersManagement.tsx`, `InventoryAudit.tsx`

### 3. Ruta /inventory-audit sin acceso
- **Causa:** `module="roles"` incorrecto en `App.tsx`
- **Fix:** Corregido a `module="audit"`
- **Archivo:** `frontend/src/App.tsx`

### 4. Backend no incluía casos users/roles en exportación
- **Causa:** Switches de `reportType` en `/export/excel` y `/export/pdf` no tenían `case 'users'` ni `case 'roles'`
- **Fix:** Agregados ambos casos
- **Archivo:** `backend/src/routes/report.routes.ts`

### 5. ExportButtons — mejoras de UX/UI (refactoring)
- Spinner animado durante exportación
- Botones deshabilitados durante operación activa (previene doble clic)
- Texto dinámico "Exportando..."
- Eliminados 8 `console.log` de debug de producción
- Refactoring: funciones `buildRequestBody()` y `triggerDownload()` compartidas
- **Archivo:** `frontend/src/components/ExportButtons.tsx`

---

## Patrón Arquitectónico — ExportButtons

```
¿Los datos locales tienen estructuras anidadas (arrays, objetos)?
  ├── SÍ → usar data={[]}  (el backend genera con generateXxxReport())
  └── NO → usar data={localData}  (datos planos, compatible con reportRowSchema)
```

**Componentes que usan `data={[]}`** (backend genera):
- `InventoryAudit` → `generateAuditReport()`
- `RolesManagement` → `generateRolesReport()`
- `UsersManagement` → `generateUsersReport()`

**Componentes que usan datos locales planos:**
- `KitEntriesTab` → campos string/number planos
- `KitExitsTab` → campos string/number planos
- `ReportsAdvanced` → datos ya transformados por el backend

---

## Backups de Base de Datos

| Fecha | Archivo | Tamaño |
|---|---|---|
| 2026-07-07 10:13 | `C:\PROYECTOS\backups\sigah\sigah_backup_2026-07-07_10-13.sql` | 0.67 MB |

---

## Git — Commits de Esta Sesión

```
87a415e  refactor(ExportButtons): agregar estado loading, spinner, prevenir doble clic
b12116f  fix: pasar data=[] en Roles, Usuarios e InventoryAudit para que backend genere reportes
a37964b  fix: corregir exportacion PDF/Excel en Auditoria, Roles, Usuarios y Egresos de Kits
```
