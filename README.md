# SIGAH - Sistema de Gestión de Ayudas Humanitarias

Sistema integral para la gestión de inventarios, solicitudes, entregas y devoluciones de ayudas humanitarias.

## Requisitos

- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 14.0
- **npm**: >= 8.0

## Estructura del Proyecto

```
sigah/
├── backend/          # API REST (Express + Prisma + PostgreSQL)
├── frontend/         # Aplicación web (React + TypeScript + TailwindCSS)
└── ARCHITECTURE.md   # Documentación de arquitectura
```

## Configuración Inicial

### 1. Base de Datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE sigah;
```

### 2. Backend

```bash
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de base de datos
# DATABASE_URL="postgresql://usuario:password@localhost:5432/sigah"
# JWT_SECRET="tu-clave-secreta-muy-segura"

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Cargar datos de prueba (opcional)
npm run db:seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:3001`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Sistema de Roles y Permisos (RBAC)

El sistema implementa un control de acceso basado en roles con permisos granulares:

### Usuarios de Prueba

Después de ejecutar el seed, estos usuarios estarán disponibles (contraseña: `admin123`):

| Rol | Email | Descripción |
|-----|-------|-------------|
| Administrador | admin@sigah.com | Acceso total al sistema, gestiona roles y usuarios |
| Autorizador | autorizador@sigah.com | Autoriza entregas y aprueba solicitudes |
| Bodega | bodega@sigah.com | Gestiona inventario, recibe y prepara entregas |
| Despachador | despachador@sigah.com | Realiza entregas a beneficiarios |
| Operador | operador@sigah.com | Crea solicitudes y gestiona beneficiarios |
| Consulta | consulta@sigah.com | Solo lectura de información |

### Módulos y Permisos

Cada rol tiene permisos específicos por módulo:

- **Dashboard**: Ver estadísticas
- **Inventario**: Ver, crear, editar, eliminar, exportar, ajustar stock
- **Kits**: Ver, crear, editar, eliminar
- **Beneficiarios**: Ver, crear, editar, eliminar, exportar
- **Solicitudes**: Ver, crear, editar, eliminar, aprobar, rechazar
- **Entregas**: Ver, crear, autorizar, recibir, preparar, entregar, cancelar
- **Devoluciones**: Ver, crear, procesar
- **Reportes**: Ver, exportar
- **Usuarios**: Ver, crear, editar, eliminar, activar
- **Roles**: Ver, crear, editar, eliminar, asignar

### Gestión de Roles (Solo Administrador)

El administrador puede:
- Crear nuevos roles personalizados
- Asignar permisos granulares a cada rol
- Asignar roles a usuarios
- Los roles del sistema no pueden ser eliminados

### Flujo de Entregas con Segregación de Funciones

El sistema implementa un flujo de entregas con segregación de funciones para garantizar transparencia:

1. **Crear Solicitud** → Usuario crea solicitud de entrega
2. **Autorizar** (AUTHORIZER/ADMIN) → Persona diferente autoriza
3. **Recibir en Bodega** (WAREHOUSE) → Bodega recibe la orden
4. **Preparar** (WAREHOUSE) → Se preparan los productos
5. **Marcar Lista** (WAREHOUSE) → Se descuenta inventario
6. **Entregar** (DISPATCHER) → Persona diferente entrega al beneficiario

**Importante:** El sistema valida que cada paso sea realizado por una persona diferente.

## Características Principales

### Gestión de Inventario
- Control de stock con sistema FEFO (First Expiry, First Out)
- Alertas de productos próximos a vencer
- Alertas de stock bajo
- Trazabilidad completa de movimientos

### Gestión de Kits
- Configuración de kits de ayuda
- Composición flexible de productos
- Verificación de disponibilidad

### Solicitudes y Entregas
- Registro de beneficiarios
- Flujo de aprobación de solicitudes
- Entregas parciales o completas
- Gestión de devoluciones

### Reportes
- Dashboard con KPIs en tiempo real
- Exportación a Excel y PDF
- Gráficos de tendencias

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/change-password` - Cambiar contraseña

### Productos e Inventario
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/inventory/summary` - Resumen de inventario
- `GET /api/inventory/expiring` - Productos por vencer

### Kits
- `GET /api/kits` - Listar kits
- `POST /api/kits` - Crear kit
- `GET /api/kits/:id/availability` - Verificar disponibilidad

### Solicitudes
- `GET /api/requests` - Listar solicitudes
- `POST /api/requests` - Crear solicitud
- `PATCH /api/requests/:id/status` - Actualizar estado

### Entregas
- `GET /api/deliveries` - Listar entregas
- `POST /api/deliveries` - Registrar entrega

### Dashboard y Reportes
- `GET /api/dashboard/summary` - Resumen del dashboard
- `GET /api/reports/requests` - Reporte de solicitudes
- `GET /api/reports/export/:type/:format` - Exportar reportes

## Licencia

MIT
