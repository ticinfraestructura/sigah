# SIGAH - Sistema de Gestión de Ayudas Humanitarias

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │Inventario│ │Solicitud │ │ Entregas │ │ Reportes │  │
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
│  │Products│ │  Kits  │ │Requests│ │Delivery│ │ Stock  │ │Reports│  │
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

### Diagrama ER Simplificado

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    User      │      │   Category   │      │   Product    │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id           │      │ id           │      │ id           │
│ email        │      │ name         │      │ code         │
│ password     │      │ description  │      │ name         │
│ name         │      │ isActive     │      │ description  │
│ role         │      └──────────────┘      │ categoryId   │
│ isActive     │              │             │ unit         │
└──────────────┘              │             │ isPerishable │
       │                      └─────────────│ minStock     │
       │                                    │ isActive     │
       │                                    └──────────────┘
       │                                           │
       │                                           │
       │      ┌──────────────┐              ┌──────────────┐
       │      │  ProductLot  │              │     Kit      │
       │      ├──────────────┤              ├──────────────┤
       │      │ id           │              │ id           │
       │      │ productId    │              │ code         │
       │      │ lotNumber    │              │ name         │
       │      │ quantity     │              │ description  │
       │      │ expiryDate   │              │ isActive     │
       │      │ entryDate    │              └──────────────┘
       │      └──────────────┘                     │
       │                                           │
       │                                    ┌──────────────┐
       │                                    │  KitProduct  │
       │                                    ├──────────────┤
       │                                    │ kitId        │
       │                                    │ productId    │
       │                                    │ quantity     │
       │                                    └──────────────┘
       │
       │      ┌──────────────┐       ┌──────────────┐
       │      │ Beneficiary  │       │   Request    │
       │      ├──────────────┤       ├──────────────┤
       └──────│ id           │───────│ id           │
              │ documentType │       │ code         │
              │ documentNum  │       │ beneficiaryId│
              │ firstName    │       │ requestDate  │
              │ lastName     │       │ status       │
              │ phone        │       │ notes        │
              │ address      │       │ createdBy    │
              │ population   │       └──────────────┘
              └──────────────┘              │
                                           │
                     ┌─────────────────────┴───────────────────┐
                     │                                         │
              ┌──────────────┐                          ┌──────────────┐
              │RequestProduct│                          │  RequestKit  │
              ├──────────────┤                          ├──────────────┤
              │ requestId    │                          │ requestId    │
              │ productId    │                          │ kitId        │
              │ quantity     │                          │ quantity     │
              └──────────────┘                          └──────────────┘


┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Delivery   │      │DeliveryDetail│      │StockMovement │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id           │──────│ deliveryId   │      │ id           │
│ requestId    │      │ productId    │      │ productId    │
│ deliveryDate │      │ kitId        │      │ lotId        │
│ deliveredBy  │      │ quantity     │      │ type         │
│ receivedBy   │      │ lotId        │      │ quantity     │
│ notes        │      └──────────────┘      │ reason       │
│ isPartial    │                            │ reference    │
└──────────────┘                            │ userId       │
                                            │ createdAt    │
                                            └──────────────┘

┌──────────────┐      ┌──────────────┐
│    Return    │      │ ReturnDetail │
├──────────────┤      ├──────────────┤
│ id           │──────│ returnId     │
│ deliveryId   │      │ productId    │
│ returnDate   │      │ quantity     │
│ reason       │      │ condition    │
│ processedBy  │      │ lotId        │
│ notes        │      └──────────────┘
└──────────────┘

┌──────────────┐
│  AuditLog    │
├──────────────┤
│ id           │
│ entity       │
│ entityId     │
│ action       │
│ oldValues    │
│ newValues    │
│ userId       │
│ createdAt    │
└──────────────┘
```

## 3. Roles y Permisos

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMIN | Administrador del sistema | Todo: CRUD completo, configuración, usuarios |
| WAREHOUSE | Operador de bodega | Inventario, entregas, devoluciones |
| VIEWER | Consulta | Solo lectura, dashboard, reportes |

## 4. Pantallas Principales

### 4.1 Dashboard
- KPIs: Total productos, solicitudes pendientes, entregas del mes, alertas vencimiento
- Gráfico de barras: Movimientos de inventario por mes
- Gráfico de torta: Distribución por categoría
- Tabla: Productos próximos a vencer
- Tabla: Últimas solicitudes

### 4.2 Gestión de Productos
- Lista de productos con filtros y búsqueda
- Formulario de creación/edición
- Vista de lotes por producto (perecederos)
- Historial de movimientos

### 4.3 Gestión de Kits
- Lista de kits definidos
- Formulario de creación con composición de productos
- Vista previa de disponibilidad del kit

### 4.4 Solicitudes
- Lista de solicitudes con estados
- Formulario de nueva solicitud
- Vista detalle con historial de cambios
- Acciones: aprobar, rechazar, marcar entregado

### 4.5 Entregas
- Lista de entregas realizadas
- Formulario de nueva entrega vinculada a solicitud
- Selección FEFO automática para perecederos
- Registro de entrega parcial

### 4.6 Devoluciones
- Registro de devolución sobre entregas
- Selección de productos/cantidades
- Motivo y condición del producto

### 4.7 Reportes
- Filtros por rango de fechas
- Reporte de solicitudes
- Reporte de entregas
- Reporte de movimientos de inventario
- Exportación PDF/Excel

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

### Beneficiarios
- `GET /api/beneficiaries`
- `POST /api/beneficiaries`
- `GET /api/beneficiaries/:id`
- `PUT /api/beneficiaries/:id`

### Solicitudes
- `GET /api/requests` - Lista con filtros
- `POST /api/requests` - Crear
- `GET /api/requests/:id` - Detalle con historial
- `PUT /api/requests/:id` - Actualizar
- `PATCH /api/requests/:id/status` - Cambiar estado
- `GET /api/requests/:id/deliveries` - Entregas asociadas

### Entregas
- `GET /api/deliveries`
- `POST /api/deliveries` - Crear (descuenta inventario con FEFO)
- `GET /api/deliveries/:id`

### Devoluciones
- `GET /api/returns`
- `POST /api/returns` - Crear (suma inventario)
- `GET /api/returns/:id`

### Inventario
- `GET /api/inventory/stock` - Stock actual
- `GET /api/inventory/movements` - Movimientos
- `POST /api/inventory/adjustment` - Ajuste manual
- `GET /api/inventory/expiring` - Próximos a vencer

### Dashboard
- `GET /api/dashboard/summary` - KPIs
- `GET /api/dashboard/charts` - Datos para gráficos

### Reportes
- `GET /api/reports/requests` - Reporte solicitudes
- `GET /api/reports/deliveries` - Reporte entregas
- `GET /api/reports/inventory` - Reporte movimientos
- `GET /api/reports/export/:type` - Exportar PDF/Excel

## 6. Decisiones de Diseño

1. **FEFO (First Expired, First Out)**: Para productos perecederos, el sistema automáticamente selecciona lotes con fecha de vencimiento más próxima al hacer entregas.

2. **Estados de Solicitud**: Se implementa una máquina de estados con transiciones válidas para mantener integridad.

3. **Auditoría**: Todas las operaciones críticas se registran con usuario, timestamp y valores antes/después.

4. **Soft Delete**: Los productos, kits y usuarios se desactivan en lugar de eliminarse para mantener integridad referencial.

5. **Stock Negativo**: No se permite, se valida antes de cada entrega.
