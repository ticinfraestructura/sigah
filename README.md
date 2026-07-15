# SIGAH - Sistema de Gestión de Ayudas Humanitarias

Sistema integral para la gestión de inventarios y kits de ayudas humanitarias.

> **⚠️ NOTA:** Esta implementación actual tiene los siguientes módulos **activos**:
> - Dashboard
> - Inventario (Gestión de productos, stock, movimientos)
> - Kits (Creación y egreso de kits)
> - Reportes (Generación de reportes)
> - Roles y Permisos (Gestión de roles)
> - Usuarios (Gestión de usuarios)
> - Copias de Seguridad (Backups de BD)
>
> **Módulos deshabilitados en esta implementación:**
> - Beneficiarios
> - Solicitudes
> - Entregas
> - Devoluciones
> - Notificaciones
>
> Para más detalles, consulte [SIGAH_FLUJO_COMPLETO.md](SIGAH_FLUJO_COMPLETO.md)

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
| ADMIN | admin@sigah.com | Acceso total al sistema, gestiona roles y usuarios |
| WAREHOUSE | bodega@sigah.com | Gestiona inventario y stock |
| OPERATOR | operador@sigah.com | Operación del sistema |
| READONLY | consulta@sigah.com | Solo lectura de información |

### Módulos y Permisos

Cada rol tiene permisos específicos por módulo:

- **Dashboard**: Ver estadísticas
- **Inventario**: Ver, crear, editar, eliminar, exportar, ajustar stock
- **Kits**: Ver, crear, editar, eliminar
- **Reportes**: Ver, exportar
- **Usuarios**: Ver, crear, editar, eliminar, activar
- **Roles**: Ver, crear, editar, eliminar, asignar
- **Auditoría**: Ver logs de auditoría
- **Backups**: Gestión de copias de seguridad (solo ADMIN)

### Gestión de Roles (Solo Administrador)

El administrador puede:
- Crear nuevos roles personalizados
- Asignar permisos granulares a cada rol
- Asignar roles a usuarios
- Los roles del sistema no pueden ser eliminados

### Gestión de Inventario

El sistema implementa control de stock con sistema FEFO (First Expiry, First Out):

1. **Registro de productos** → Ingreso de productos al inventario
2. **Control de stock** → Alertas de productos próximos a vencer y stock bajo
3. **Ajustes de inventario** → Entradas y salidas de stock manual
4. **Gestión de kits** → Configuración de kits de ayuda con composición flexible
5. **Trazabilidad** → Historial completo de movimientos de stock

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
- Registro de entradas de stock por kit desde Inventario
- **Egresos manuales de kits con control de stock**
- Historial de ingresos y egresos de kits agrupado por evento, usuario y productos afectados
- Disponibilidad en tiempo real en el combo de selección

### Reportes
- Dashboard con KPIs en tiempo real
- Exportación a Excel y PDF
- Gráficos de tendencias
- Reporte de movimientos de kits con entregas e ingresos de stock

## Entradas y reportes de kits

El sistema permite registrar ingresos de inventario por kit desde el módulo **Inventario**:

1. Ir a **Inventario**.
2. Abrir la pestaña **Entradas/Ajustes**.
3. Seleccionar **Entrada por Kit**.
4. Elegir el kit y registrar la cantidad de kits ingresados.
5. El sistema crea movimientos de entrada para cada producto que compone el kit.

Después de registrar una entrada, el usuario puede consultar los ingresos desde:

- **Inventario → Entradas/Ajustes → Entrada por Kit**: muestra los ingresos registrados para el kit seleccionado.
- **Kits → Detalle del kit → Ingresos de Stock**: muestra el historial de ingresos del kit, junto con entregas, filtros y exportación.

Los ingresos de kits se identifican en los movimientos de stock por el motivo generado automáticamente con el formato:

```text
Entrada kit <CODIGO_KIT> x<CANTIDAD>
```

Si se usa un motivo personalizado, debe incluir el código del kit para que el movimiento pueda aparecer en el reporte histórico del kit.

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
- `GET /api/kits` - Listar kits (con inventario)
- `POST /api/kits` - Crear kit
- `GET /api/kits/:id/availability` - Verificar disponibilidad
- `POST /api/inventory/kit-exit` - Registrar egreso manual de kit

### Backups (Solo ADMIN)
- `GET /api/backups` - Listar copias de seguridad
- `POST /api/backups` - Crear copia de seguridad
- `POST /api/backups/:name/restore` - Restaurar copia de seguridad
- `DELETE /api/backups/:name` - Eliminar copia de seguridad

### Dashboard y Reportes
- `GET /api/dashboard/summary` - Resumen del dashboard
- `GET /api/reports/requests` - Reporte de solicitudes
- `GET /api/reports/export/:type/:format` - Exportar reportes

## Licencia

MIT
