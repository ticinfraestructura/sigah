# DOCUMENTACIÓN TÉCNICA SIGAH
## Sistema de Gestión de Ayudas Humanitarias

**Versión:** 1.1.0  
**Fecha:** Julio 2026

---

## 1. DESCRIPCIÓN GENERAL

**SIGAH** es un sistema integral para la gestión de inventarios y kits de ayudas humanitarias. Permite el control del inventario, reportes, usuarios y auditoría.

### Características Principales (v1.1.0)

- **Control de Inventario** con sistema FEFO (First Expiry, First Out)
- **Gestión de Kits** con composición flexible de productos
- **Sistema RBAC** (Role-Based Access Control) con permisos granulares
- **Reportes avanzados** con exportación a Excel y PDF
- **Auditoría completa** de todas las operaciones
- **Gestión de Usuarios y Roles**

---

## 2. STACK TECNOLÓGICO

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | >= 18.0.0 | Runtime |
| Express | 4.18.x | Framework web |
| TypeScript | 5.3.x | Lenguaje tipado |
| Prisma ORM | 5.7.x | ORM y migraciones |
| PostgreSQL | >= 14.0 | Base de datos |
| Socket.io | 4.8.x | Comunicación real-time |
| JWT | 9.x | Autenticación |
| Winston | 3.x | Logging |
| PDFKit | 0.14.x | Generación de PDFs |
| XLSX | 0.18.x | Exportación a Excel |

### Frontend

| Tecnología | Propósito |
|------------|-----------|
| React | Framework UI |
| TypeScript | Lenguaje tipado |
| TailwindCSS | Estilos |
| React Router | Navegación |
| Recharts | Gráficos |
| Lucide React | Iconografía |

---

## 3. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Dashboard │ │Inventario│ │   Kits   │ │ Reportes │ │ Backups  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API REST (Express + TS)                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Middlewares: Auth, RBAC, Validation, Audit, Rate Limit       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐   │
│  │Products│ │  Kits  │ │ Stock  │ │ Users  │ │Reports │ │Backups│   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └───────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVICIOS DE NEGOCIO                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │InventoryMgr │ │ FEFO Engine │ │ KitResolver │ │ AuditLogger │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRISMA ORM + PostgreSQL 14+                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. ESTRUCTURA DEL PROYECTO

```
sigah/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración de la app
│   │   ├── middleware/      # Auth, RBAC, validación, auditoría
│   │   ├── routes/          # Endpoints de la API (17 archivos)
│   │   ├── services/        # Lógica de negocio (12 servicios)
│   │   ├── utils/           # Utilidades
│   │   ├── index.ts         # Punto de entrada
│   │   └── seed.ts          # Datos de prueba
│   ├── prisma/
│   │   └── schema.prisma    # Modelo de datos
│   └── tests/               # Tests unitarios
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Vistas (22 páginas)
│   │   ├── contexts/        # Context providers
│   │   ├── services/        # API clients
│   │   ├── hooks/           # Custom hooks
│   │   ├── i18n/            # Internacionalización
│   │   └── types/           # Tipos TypeScript
│   └── App.tsx              # Rutas principales
│
├── README.md
└── ARCHITECTURE.md
```

---

## 5. MODELO DE DATOS

### Entidades Principales

| Entidad | Descripción |
|---------|-------------|
| **User** | Usuarios del sistema con roles y permisos |
| **Role** | Roles con permisos asignables |
| **Permission** | Permisos por módulo y acción |
| **Category** | Categorías de productos |
| **Product** | Productos del inventario |
| **ProductLot** | Lotes con fecha de vencimiento |
| **Kit** | Kits de ayuda compuestos |
| **StockMovement** | Movimientos de inventario |
| **AuditLog** | Registro de auditoría |

### Diagrama Relacional Simplificado (módulos activos v1.1.0)

```
User ─────┐
          │
Role ─────┼──> Permission (RBAC)
          │
Category ─┼──> Product ──> ProductLot (fechas vencimiento)
                   │
                   ├──> KitProduct ──> Kit
                   │
                   └──> StockMovement ──> AuditLog
```

---

## 6. MÓDULOS DEL SISTEMA

### 6.1 Dashboard
**Ruta:** `/`

- KPIs en tiempo real: Total productos, total kits, total usuarios, productos con stock bajo
- Alertas: Productos próximos a vencer, productos con stock bajo
- Gráfico: Distribución de inventario por categoría
- Accesos rápidos según rol del usuario

### 6.2 Gestión de Inventario
**Rutas:** `/inventory`, `/inventory-admin`, `/inventory/:id`

- Lista de productos con filtros y búsqueda
- CRUD completo de productos
- Gestión de lotes con fechas de vencimiento (productos perecederos)
- Movimientos de stock: Entradas, salidas, ajustes
- Alertas: Stock bajo, productos próximos a vencer
- Sistema FEFO: Selección automática de lotes más próximos a vencer

### 6.3 Gestión de Kits
**Rutas:** `/kits`, `/kits/:id`

- Lista de kits configurados
- Creación de kits con composición de productos
- Verificación de disponibilidad en tiempo real
- Cálculo automático de kits disponibles según stock

### 6.4 Reportes Avanzados
**Ruta:** `/reports`

- Reportes de inventario, kits, usuarios y roles
- Reportes de movimientos y trazabilidad
- Exportación a PDF y Excel
- Filtros por fecha, tipo y subtipo

### 6.5 Gestión de Usuarios
**Ruta:** `/users`

- CRUD de usuarios
- Asignación de roles
- Activar/desactivar usuarios

### 6.6 Gestión de Roles y Permisos
**Ruta:** `/roles`

- CRUD de roles personalizados
- Permisos granulares por módulo y acción
- Roles del sistema protegidos (no eliminables)

### 6.7 Auditoría Inventario
**Ruta:** `/inventory-audit`

- Log completo de todas las operaciones
- Entidad, acción, usuario, timestamp
- Valores antes/después del cambio

### 6.8 Gestión de Backups
**Ruta:** `/backups` (Solo ADMIN)

- Listar copias de seguridad existentes
- Crear copia manual de la base de datos
- Restaurar desde copia de seguridad
- Eliminar copias antiguas
- Estadísticas: total, tamaño, último backup
- Backups automáticos programados

---

## 7. SISTEMA DE ROLES Y PERMISOS (RBAC)

### Roles Activos del Sistema

> **Nota v1.1.0:** Los roles internos `AUTHORIZER` y `DISPATCHER` existen en la base de datos pero están deshabilitados en la interfaz en esta versión. No aparecen en gestión de usuarios, roles ni reportes.

| Rol (BD) | Nombre visible | Descripción | Permisos Principales |
|----------|---------------|-------------|---------------------|
| **ADMIN** | Administrador | Acceso total | Todo el sistema |
| **WAREHOUSE** | Bodega | Gestiona inventario | CRUD inventario, ajustes, movimientos |
| **OPERATOR** | Operador | Acceso básico | Ver inventario, kits y reportes |
| **READONLY** | Consulta | Solo lectura | Ver dashboard, reportes |

### Módulos y Acciones Disponibles

```
dashboard    : view
inventory    : view, create, edit, delete, export, adjust
kits         : view, create, edit, delete
reports      : view, export
users        : view, create, edit, delete, activate
roles        : view, create, edit, delete, assign
audit        : view
system       : manage (backups)
```

---

## 8. API ENDPOINTS PRINCIPALES

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/me` | Usuario actual |
| POST | `/api/auth/change-password` | Cambiar contraseña |
| POST | `/api/auth/logout` | Cerrar sesión |

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/:id` | Obtener producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Desactivar producto |
| GET | `/api/products/:id/lots` | Lotes del producto |
| POST | `/api/products/:id/lots` | Agregar lote |

### Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/inventory/stock` | Stock actual |
| GET | `/api/inventory/movements` | Historial movimientos |
| POST | `/api/inventory/adjustment` | Ajuste manual |
| GET | `/api/inventory/expiring` | Productos por vencer |
| GET | `/api/inventory/summary` | Resumen inventario |

### Kits
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/kits` | Listar kits |
| POST | `/api/kits` | Crear kit |
| GET | `/api/kits/:id` | Obtener kit |
| PUT | `/api/kits/:id` | Actualizar kit |
| GET | `/api/kits/:id/availability` | Disponibilidad |

### Dashboard y Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | KPIs |
| GET | `/api/dashboard/charts` | Datos gráficos |
| GET | `/api/reports/generate` | Generar reporte |
| GET | `/api/reports/export/:type/:format` | Exportar |

### Backups (Solo ADMIN)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/backups` | Listar copias |
| POST | `/api/backups` | Crear copia |
| POST | `/api/backups/:name/restore` | Restaurar copia |
| DELETE | `/api/backups/:name` | Eliminar copia |

---

## 9. INSTALACIÓN Y CONFIGURACIÓN

### Requisitos Previos
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Docker Desktop >= 4.0 (recomendado)
- npm >= 8.0

### Instalación Backend

```bash
cd backend

# Configuración
cp .env.example .env
# Editar DATABASE_URL y JWT_SECRET en .env

# Instalación
npm install
npm run db:generate
npm run db:push
npm run db:seed  # Datos de prueba

# Ejecutar en desarrollo
npm run dev
```

**Variables de entorno requeridas:**
```
DATABASE_URL="postgresql://user:pass@localhost:5432/sigah"
JWT_SECRET="clave-secreta-muy-segura"
PORT=3001
```

### Instalación Frontend

```bash
cd frontend
npm install
npm run dev
```

Con Docker Compose (modo estándar):
- Frontend: `http://localhost:8082`
- Backend API: `http://localhost:3002`

Sin Docker (desarrollo directo):
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:3001`

---

## 10. USUARIOS DE PRUEBA

Después de ejecutar `npm run db:seed`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@sigah.com | admin123 |
| Bodega | bodega@sigah.com | admin123 |
| Operador | operador@sigah.com | admin123 |
| Consulta | consulta@sigah.com | admin123 |

> Los usuarios `autorizador@sigah.com` y `despachador@sigah.com` existen en la BD pero no son visibles en la interfaz de esta versión.

---

## 11. DECISIONES DE DISEÑO

1. **FEFO (First Expired, First Out):** Para productos perecederos, el sistema selecciona automáticamente lotes con fecha de vencimiento más próxima.

2. **Fechas de vencimiento por lote:** Cada lote tiene su propia fecha de vencimiento, no el producto.

3. **Soft Delete:** Productos, kits y usuarios se desactivan en lugar de eliminarse para mantener integridad referencial.

4. **Stock nunca negativo:** Se valida antes de cada operación de salida.

5. **Auditoría completa:** Todas las operaciones críticas se registran con valores antes/después.

6. **Cache de permisos:** Los permisos de roles se cachean en memoria con TTL de 5 minutos para mejorar rendimiento y reducir consultas a la base de datos.

7. **Backup con pg_dump:** Las copias de seguridad usan `pg_dump` de PostgreSQL para volcados completos de la base de datos, con restauración vía `psql`.

8. **Unificación de roles admin:** El sistema acepta tanto `ADMIN` como `Administrador` como roles de administrador para compatibilidad.

---

## 12. PANTALLAS DEL SISTEMA

### Capturas de Pantalla Requeridas

| # | Pantalla | Ruta | Descripción |
|---|----------|------|-------------|
| 1 | Login | `/login` | Pantalla de inicio de sesión |
| 2 | Dashboard | `/` | Panel principal con KPIs y gráficos |
| 3 | Inventario | `/inventory` | Lista de productos con filtros |
| 4 | Detalle Producto | `/inventory/:id` | Información completa y lotes |
| 5 | Gestión Inventario | `/inventory-admin` | CRUD de productos y ajustes |
| 6 | Kits | `/kits` | Lista de kits configurados |
| 7 | Detalle Kit | `/kits/:id` | Composición y disponibilidad |
| 8 | Reportes | `/reports` | Generación y exportación |
| 9 | Usuarios | `/users` | Gestión de usuarios |
| 10 | Roles | `/roles` | Gestión de roles y permisos |
| 11 | Auditoría Inventario | `/inventory-audit` | Log de operaciones |
| 12 | Copias de Seguridad | `/backups` | Gestión de backups (solo ADMIN) |

**Nota:** Agregar capturas de pantalla ejecutando la aplicación y tomando screenshots con `Win + Shift + S`

---

## 13. CONTACTO Y SOPORTE

Para soporte técnico o consultas sobre el sistema SIGAH, contactar al equipo de desarrollo.

---

*Documento actualizado - SIGAH v1.1.0 - Julio 2026*
