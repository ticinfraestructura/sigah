# SIGAH - Documentación Completa del Sistema

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Guía de Instalación](#guía-de-instalación)
4. [Configuración](#configuración)
5. [Módulos del Sistema](#módulos-del-sistema)
6. [Roles y Permisos](#roles-y-permisos)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [API Reference](#api-reference)
9. [Base de Datos](#base-de-datos)
10. [Guía de Pruebas UAT](#guía-de-pruebas-uat)
11. [Mantenimiento y Soporte](#mantenimiento-y-soporte)
12. [Troubleshooting](#troubleshooting)

---

## Descripción General

SIGAH (Sistema de Gestión de Ayudas Humanitarias) es una plataforma integral diseñada para gestionar eficientemente el ciclo completo de la ayuda humanitaria, desde la recepción de insumos hasta la entrega final a beneficiarios.

### Objetivos Principales
- **Trazabilidad completa**: Seguimiento detallado de cada producto desde su entrada hasta su entrega
- **Control de calidad**: Sistema FEFO para gestión de vencimientos
- **Transparencia**: Auditoría completa de todas las operaciones
- **Eficiencia operativa**: Automatización de procesos críticos
- **Segregación de funciones**: Controles internos robustos

### Características Destacadas
- Gestión de inventario con control de lotes y fechas de vencimiento
- Configuración flexible de kits de ayuda
- Flujo de aprobación de solicitudes con múltiples niveles
- Sistema de entregas con 6 pasos y segregación de funciones
- Gestión de devoluciones con control de calidad
- Dashboard en tiempo real con KPIs operativos
- Reportes personalizables y exportables
- Sistema de roles y permisos granular

---

## Arquitectura del Sistema

### Arquitectura General
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Base de Datos │
│   (React)       │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - TypeScript    │    │ - REST API      │    │ - Prisma ORM    │
│ - TailwindCSS   │    │ - JWT Auth      │    │ - Migraciones   │
│ - Vite          │    │ - Validación    │    │ - Seed Data      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Stack Tecnológico

#### Frontend
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Estilos**: TailwindCSS
- **Estado**: React Hooks + Context API
- **HTTP Cliente**: Axios
- **Validación**: React Hook Form + Zod
- **UI Components**: Componentes personalizados

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 14+
- **Autenticación**: JWT
- **Validación**: Zod
- **Logging**: Winston
- **Testing**: Jest

#### Infraestructura
- **Contenerización**: Docker & Docker Compose
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **Web Server**: Nginx (producción)

---

## Guía de Instalación

### Prerrequisitos
- Docker Desktop instalado
- Git
- Editor de código (VS Code recomendado)

### Instalación Rápida con Docker

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd sigah
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar servicios**
```bash
docker-compose up -d
```

4. **Esperar 90 segundos** para que los servicios inicien

5. **Cargar datos de prueba**
```bash
docker exec sigah-backend npx prisma db seed
```

6. **Acceder a la aplicación**
- Frontend: http://localhost:8080/sigah/
- Backend API: http://localhost:3001
- Base de Datos: localhost:5432

### Instalación Manual (Desarrollo)

#### Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma db generate
npx prisma db push
npx prisma db seed
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Configuración

### Variables de Entorno (.env)

```env
# Base de Datos
DATABASE_URL="postgresql://sigah:password@localhost:5432/sigah"
POSTGRES_USER=sigah
POSTGRES_PASSWORD=password
POSTGRES_DB=sigah

# JWT
JWT_SECRET="tu-clave-secreta-muy-segura-aqui"
JWT_EXPIRES_IN="24h"

# Redis
REDIS_URL="redis://localhost:6379"

# Frontend
VITE_API_URL="http://localhost:3001"
VITE_BASE_PATH="/sigah/"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"
```

### Configuración de Base de Datos

El esquema de la base de datos se define en `backend/prisma/schema.postgresql.prisma`:

#### Entidades Principales
- **Users**: Gestión de usuarios y roles
- **Products**: Catálogo de productos
- **ProductLots**: Control de lotes y vencimientos
- **StockMovements**: Movimientos de inventario
- **Kits**: Configuración de kits
- **KitInventory**: Inventario de kits
- **Beneficiaries**: Registro de beneficiarios
- **Requests**: Solicitudes de ayuda
- **Deliveries**: Gestión de entregas
- **AuditLog**: Auditoría del sistema

---

## Módulos del Sistema

### 1. Autenticación y Acceso
- Login seguro con JWT
- Gestión de sesiones
- Recuperación de contraseña
- Control de acceso basado en roles

### 2. Dashboard
- KPIs en tiempo real
- Gráficos interactivos
- Alertas y notificaciones
- Resumen operacional

### 3. Inventario
- Gestión de productos
- Control de lotes
- Sistema FEFO
- Ajustes de stock
- Movimientos y trazabilidad

### 4. Kits
- Configuración de kits
- Verificación de disponibilidad
- Entradas y salidas de kits
- Historial de movimientos

### 5. Beneficiarios
- Registro de beneficiarios
- Clasificación por población
- Historial de ayudas
- Documentación asociada

### 6. Solicitudes
- Creación de solicitudes
- Flujo de aprobación
- Estados y transiciones
- Edición y cancelación

### 7. Entregas
- Flujo de 6 pasos
- Segregación de funciones
- Control de inventario
- Confirmación de entrega

### 8. Devoluciones
- Registro de devoluciones
- Control de calidad
- Reingreso a inventario
- Reporte de pérdidas

### 9. Reportes
- Reportes predefinidos
- Exportación a Excel/PDF
- Filtros avanzados
- Programación de reportes

### 10. Auditoría
- Registro completo de acciones
- Consultas por usuario/fecha
- Exportación de logs
- Cumplimiento normativo

---

## Roles y Permisos

### Sistema RBAC (Role-Based Access Control)

#### Roles Predefinidos

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| **Administrador** | Acceso total al sistema | Todos los permisos |
| **Autorizador** | Aprueba solicitudes y entregas | Aprobar, autorizar, ver reportes |
| **Bodega** | Gestiona inventario y prepara entregas | Inventario, recibir, preparar |
| **Despachador** | Realiza entregas finales | Entregar, ver entregas |
| **Operador** | Crea solicitudes y gestiona beneficiarios | Solicitudes, beneficiarios |
| **Consulta** | Solo lectura | Ver todos los módulos |

#### Matriz de Permisos

| Módulo | Admin | Autorizador | Bodega | Despachador | Operador | Consulta |
|--------|-------|--------------|--------|-------------|----------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventario | CRUD | Ver | CRUD | Ver | Ver | Ver |
| Kits | CRUD | Ver | Ver | Ver | Ver | Ver |
| Beneficiarios | CRUD | Ver | Ver | Ver | CRUD | Ver |
| Solicitudes | Full | Aprobar | Ver | Ver | CRUD | Ver |
| Entregas | Full | Autorizar | Recibir/Preparar | Entregar | Ver | Ver |
| Devoluciones | CRUD | Ver | CRUD | Ver | Ver | Ver |
| Reportes | Full | Ver | Ver | Ver | Ver | Ver |
| Usuarios | CRUD | - | - | - | - | - |
| Roles | CRUD | - | - | - | - | - |

---

## Flujos de Trabajo

### Flujo de Entregas (6 Pasos con Segregación)

```mermaid
sequenceDiagram
    participant Operador
    participant Autorizador
    participant Bodega1
    participant Bodega2
    participant Despachador
    
    Operador->>+Autorizador: 1. Crear solicitud
    Autorizador->>+Bodega1: 2. Autorizar entrega
    Bodega1->>+Bodega2: 3. Recibir en bodega
    Bodega2->>Bodega2: 4. Preparar
    Bodega2->>Bodega2: 5. Marcar lista (descuenta stock)
    Bodega2->>+Despachador: 6. Entregar
    Despachador-->>-Operador: Entrega completada
```

#### Reglas de Segregación
- El autorizador no puede ser quien crea la entrega
- Quien autoriza no puede recibir en bodega
- Quien prepara no puede ser el mismo que entrega
- Cada paso queda registrado en auditoría

### Flujo de Aprobación de Solicitudes

```mermaid
stateDiagram-v2
    [*] --> REGISTERED
    REGISTERED --> IN_REVIEW: Revisar
    IN_REVIEW --> APPROVED: Aprobar
    IN_REVIEW --> REJECTED: Rechazar
    REJECTED --> REGISTERED: Reactivar
    REGISTERED --> CANCELLED: Cancelar
    APPROVED --> DELIVERED: Entregar
    APPROVED --> CANCELLED: Cancelar
```

---

## API Reference

### Autenticación
```typescript
// Login
POST /api/auth/login
{
  "email": "admin@sigah.com",
  "password": "admin123"
}

// Response
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "admin@sigah.com",
    "role": "ADMIN"
  }
}
```

### Productos
```typescript
// Listar productos
GET /api/products?search=arroz&category=alimentos

// Crear producto
POST /api/products
{
  "code": "PROD-001",
  "name": "Arroz 1kg",
  "categoryId": "uuid",
  "unit": "KG",
  "minStock": 100,
  "isPerishable": true
}
```

### Inventarios
```typescript
// Movimientos de stock
GET /api/inventory/movements/:productId

// Ajustar stock
POST /api/inventory/adjustment
{
  "productId": "uuid",
  "lotId": "uuid",
  "quantity": 10,
  "reason": "Ajuste de inventario",
  "type": "ADJUSTMENT"
}
```

### Entregas
```typescript
// Crear entrega
POST /api/deliveries
{
  "requestId": "uuid",
  "deliveryDetails": [
    {
      "productId": "uuid",
      "quantity": 5,
      "lotId": "uuid"
    }
  ]
}

// Cambiar estado
PATCH /api/deliveries/:id/status
{
  "status": "AUTHORIZED",
  "notes": "Autorizado para entrega"
}
```

---

## Base de Datos

### Schema Principal

#### Usuarios y Roles
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  roleId UUID REFERENCES roles(id),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  isSystem BOOLEAN DEFAULT false
);
```

#### Inventario
```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  categoryId UUID REFERENCES categories(id),
  unit VARCHAR(20) NOT NULL,
  minStock INTEGER DEFAULT 0,
  isPerishable BOOLEAN DEFAULT false
);

-- ProductLots (Control de lotes y vencimientos)
CREATE TABLE product_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productId UUID REFERENCES products(id),
  lotCode VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  expiryDate DATE,
  manufacturingDate DATE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### Movimientos
```sql
-- StockMovements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  productId UUID REFERENCES products(id),
  lotId UUID REFERENCES product_lots(id),
  type VARCHAR(20) NOT NULL, -- ENTRY, EXIT, ADJUSTMENT, RETURN
  quantity INTEGER NOT NULL,
  reason TEXT,
  userId UUID REFERENCES users(id),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### Entidades de Auditoría
```sql
-- AuditLog
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id),
  entity VARCHAR(50) NOT NULL,
  entityId UUID,
  action VARCHAR(50) NOT NULL,
  oldValues JSONB,
  newValues JSONB,
  ipAddress INET,
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## Guía de Pruebas UAT

### Plan de Pruebas

Ver archivo completo: `SIGAH_GUIA_PRUEBAS_UAT.md`

### Casos de Prueba Clave

#### Autenticación
- AUTH-01: Login exitoso como Admin
- AUTH-02: Login con credenciales incorrectas
- AUTH-03: Verificación de roles y permisos

#### Inventario
- INV-08: Registrar entrada de stock
- INV-09: Ajustar stock (+/-)
- INV-11: Validación de stock negativo

#### Entregas
- ENT-02: Crear entrega (Paso 1)
- ENT-04: Autorizar entrega (Paso 2)
- ENT-06: Recibir en bodega (Paso 3)
- ENT-08: Preparar (Paso 4)
- ENT-09: Marcar lista (Paso 5)
- ENT-12: Entregar (Paso 6)

#### Segregación de Funciones
- ENT-05: Validar que creador no autoriza
- ENT-07: Validar que autorizador no recibe
- ENT-13: Validar que preparador no entrega

### Criterios de Aceptación

#### Obligatorios (Must-Have)
- [ ] 0 bugs críticos abiertos
- [ ] 0 bugs mayores abiertos
- [ ] Login y autenticación funcionan perfectamente
- [ ] Flujo completo de entrega (6 pasos) funciona sin errores
- [ ] Inventario se descuenta y devuelve correctamente
- [ ] Segregación de funciones impide acciones no autorizadas
- [ ] Auditoría registra todas las acciones
- [ ] Roles y permisos funcionan correctamente

#### Deseables (Nice-to-Have)
- [ ] Bugs menores < 5
- [ ] Tiempo de carga < 3 segundos en cada módulo
- [ ] Responsive funcional en móvil
- [ ] Exportación de reportes funcional
- [ ] Notificaciones funcionan en tiempo real

---

## Mantenimiento y Soporte

### Tareas de Mantenimiento

#### Diario
- Monitorear logs de errores
- Verificar espacio en disco
- Revisar rendimiento de consultas

#### Semanal
- Backup de base de datos
- Limpiar logs antiguos
- Actualizar estadísticas de BD

#### Mensual
- Aplicar actualizaciones de seguridad
- Revisar y optimizar índices
- Limpiar datos temporales

#### Trimestral
- Auditoría de accesos
- Revisión de permisos
- Pruebas de recuperación

### Comandos de Mantenimiento

#### Backup
```bash
# Backup completo
docker exec sigah-db pg_dump -U sigah sigah > backup-$(date +%Y%m%d).sql

# Restaurar
docker exec -i sigah-db psql -U sigah sigah < backup-20240101.sql
```

#### Logs
```bash
# Ver logs de backend
docker logs sigah-backend --tail 100

# Ver logs de frontend
docker logs sigah-frontend --tail 100
```

#### Reinicio de Servicios
```bash
# Reiniciar todo
docker-compose restart

# Reiniciar servicio específico
docker-compose restart backend
```

### Monitoreo

#### Métricas Clave
- Tiempo de respuesta del API
- Uso de CPU y memoria
- Espacio en disco
- Conexiones a BD
- Errores 4xx/5xx

#### Alertas
- Alto uso de CPU (>80%)
- Espacio en disco bajo (<10%)
- Errores frecuentes en API
- Conexiones rechazadas a BD

---

## Troubleshooting

### Problemas Comunes

#### 1. El sistema no inicia
**Síntomas**: Error al conectar a la base de datos
**Causa**: Contenedores no listos
**Solución**:
```bash
docker-compose down
docker-compose up -d
# Esperar 90 segundos
docker exec sigah-backend npx prisma db seed
```

#### 2. Login falla
**Síntomas**: Error de autenticación
**Causa**: Datos de prueba no cargados
**Solución**:
```bash
docker exec sigah-backend npx prisma db seed
```

#### 3. No aparecen datos en inventario
**Síntomas**: Listas vacías
**Causa**: Seed no ejecutado correctamente
**Solución**:
```bash
docker exec sigah-backend npx prisma db seed --force-reset
```

#### 4. Error de permisos
**Síntomas**: Acceso denegado a módulos
**Causa**: Roles no configurados
**Solución**:
```bash
# Verificar roles en BD
docker exec sigah-db psql -U sigah -d sigah -c "SELECT * FROM roles;"
```

#### 5. Lentitud en el sistema
**Síntomas**: Tiempos de respuesta lentos
**Causa**: Índices faltantes o consultas lentas
**Solución**:
```bash
# Analizar consultas lentas
docker exec sigah-backend npx prisma db execute --file analyze.sql
```

### Comandos de Diagnóstico

#### Verificar Estado de Contenedores
```bash
docker-compose ps
docker-compose logs
```

#### Verificar Conexión a BD
```bash
docker exec sigah-db psql -U sigah -d sigah -c "SELECT 1;"
```

#### Verificar API
```bash
curl http://localhost:3001/api/health
```

#### Verificar Frontend
```bash
curl http://localhost:8080/sigah/
```

### Soporte y Contacto

Para soporte técnico:
- Revisar logs actuales
- Documentar pasos para reproducir
- Capturar screenshots si aplica
- Verificar sección de troubleshooting

---

## Anexos

### A. Configuración de Producción

#### Variables de Entorno Adicionales
```env
# Producción
NODE_ENV=production
PORT=3001

# SSL (opcional)
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# Email
EMAIL_FROM=noreply@sigah.org
EMAIL_REPLY_TO=support@sigah.org
```

#### Configuración Nginx
```nginx
server {
    listen 80;
    server_name sigah.org;
    
    location /sigah/ {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### B. Scripts de Automatización

#### Script de Backup Automático
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
CONTAINER="sigah-db"

mkdir -p $BACKUP_DIR
docker exec $CONTAINER pg_dump -U sigah sigah > $BACKUP_DIR/sigah_$DATE.sql

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "sigah_*.sql" -mtime +7 -delete
```

#### Script de Health Check
```bash
#!/bin/bash
API_URL="http://localhost:3001/api/health"
FRONTEND_URL="http://localhost:8080/sigah/"

if curl -f $API_URL > /dev/null 2>&1; then
    echo "✅ Backend OK"
else
    echo "❌ Backend FAIL"
    exit 1
fi

if curl -f $FRONTEND_URL > /dev/null 2>&1; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend FAIL"
    exit 1
fi
```

### C. Glosario de Términos

- **FEFO**: First Expiry, First Out - Sistema de gestión por vencimiento
- **RBAC**: Role-Based Access Control - Control de acceso basado en roles
- **KPI**: Key Performance Indicator - Indicador clave de rendimiento
- **UAT**: User Acceptance Testing - Pruebas de aceptación de usuario
- **JWT**: JSON Web Token - Token de autenticación
- **ORM**: Object-Relational Mapping - Mapeo objeto-relacional

---

*Esta documentación está en constante evolución. Para la versión más actualizada, consultar el repositorio del proyecto.*
