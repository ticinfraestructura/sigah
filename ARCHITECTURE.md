# SIGAH - Sistema de Gestión de Ayudas Humanitarias

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │Inventario│ │   Kits   │ │ Reportes │ │ Backups  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API REST (Express + TS)                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: Auth, Roles, Validation, Audit, Error Handler   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐  │
│  │Products│ │  Kits  │ │ Stock  │ │ Users  │ │Reports │ │Backups │  │
│  │  API   │ │  API   │ │  API   │ │  API   │ │  API   │ │  API  │  │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └───────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICIOS DE NEGOCIO                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │InventoryMgr│ │ FEFO Engine │ │ KitResolver │ │ AuditLogger │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRISMA ORM + PostgreSQL                         │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Modelo de Datos (Entidades Principales)

### Diagrama ER Simplificado (módulos activos v1.1.0)

```
User ──> Role ──> Permission

Category ──> Product ──> ProductLot (lote, cantidad, vencimiento)
                  │
                  ├──> KitProduct ──> Kit
                  │
                  └──> StockMovement ──> AuditLog
```


## 3. Roles y Permisos (v1.1.0)

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMIN | Administrador del sistema | Todo: CRUD completo, configuración, usuarios |
| WAREHOUSE | Operador de bodega | Inventario, kits, reportes |
| OPERATOR | Operador básico | Ver inventario, kits y reportes |
| READONLY | Consulta | Solo lectura, dashboard, reportes |

> Roles AUTHORIZER y DISPATCHER existen en BD pero están deshabilitados en la UI.

## 4. Pantallas Principales

### 4.1 Dashboard
- KPIs: Total productos, total kits, total usuarios, productos con stock bajo
- Alertas: Productos próximos a vencer, productos con stock bajo
- Gráfico: Distribución de inventario por categoría

### 4.2 Gestión de Productos
- Lista de productos con filtros y búsqueda
- Formulario de creación/edición
- Vista de lotes por producto (perecederos)
- Historial de movimientos

### 4.3 Gestión de Kits
- Lista de kits definidos
- Formulario de creación con composición de productos
- Vista previa de disponibilidad del kit

### 4.4 Reportes Avanzados
- Filtros por tipo y subtipo
- Reportes de inventario, kits, usuarios y roles
- Exportación PDF/Excel

### 4.5 Gestión de Usuarios
- CRUD de usuarios y asignación de roles

### 4.6 Roles y Permisos
- CRUD de roles con permisos granulares

### 4.7 Auditoría Inventario
- Log de operaciones con valores antes/después

### 4.8 Gestión de Backups (Solo ADMIN)
- Listar copias de seguridad
- Crear copia manual
- Restaurar desde copia
- Eliminar copias antiguas
- Estadísticas de backups

## 5. API Endpoints Principales

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Productos
- `GET /api/products` - Lista con filtros
- `POST /api/products` - Crear
- `GET /api/products/:id` - Detalle
- `PUT /api/products/:id` - Actualizar
- `DELETE /api/products/:id` - Desactivar
- `GET /api/products/:id/lots` - Lotes del producto
- `POST /api/products/:id/lots` - Agregar lote
- `GET /api/products/:id/movements` - Movimientos

### Categorías
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`

### Kits
- `GET /api/kits`
- `POST /api/kits`
- `GET /api/kits/:id`
- `PUT /api/kits/:id`
- `DELETE /api/kits/:id`
- `GET /api/kits/:id/availability` - Disponibilidad del kit

### Inventario
- `GET /api/inventory/stock` - Stock actual
- `GET /api/inventory/movements` - Movimientos
- `POST /api/inventory/adjustment` - Ajuste manual
- `GET /api/inventory/expiring` - Próximos a vencer

### Dashboard
- `GET /api/dashboard/summary` - KPIs
- `GET /api/dashboard/charts` - Datos para gráficos

### Reportes
- `GET /api/reports/generate` - Generar reporte
- `GET /api/reports/export/:type/:format` - Exportar PDF/Excel

### Backups (Solo ADMIN)
- `GET /api/backups` - Listar copias
- `POST /api/backups` - Crear copia
- `POST /api/backups/:name/restore` - Restaurar copia
- `DELETE /api/backups/:name` - Eliminar copia

## 6. Decisiones de Diseño

1. **FEFO (First Expired, First Out)**: Para productos perecederos, el sistema selecciona automáticamente lotes con fecha de vencimiento más próxima en operaciones de salida.

2. **Auditoría**: Todas las operaciones críticas se registran con usuario, timestamp y valores antes/después.

3. **Soft Delete**: Productos, kits y usuarios se desactivan en lugar de eliminarse para mantener integridad referencial.

4. **Stock Negativo**: No se permite; se valida antes de cada operación de salida.

5. **Cache de permisos**: Los permisos de roles se cachean en memoria con TTL de 5 minutos para mejorar rendimiento.

6. **Backup con pg_dump**: Las copias de seguridad usan `pg_dump` de PostgreSQL para volcados completos.

7. **Unificación de roles admin**: El sistema acepta tanto `ADMIN` como `Administrador` como roles de administrador.

