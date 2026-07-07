# SIGAH - Changelog / Historial de Cambios

Todos los cambios notables de SIGAH serán documentados en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y SIGAH adherisce a [Semantic Versioning](https://semver.org/lang/es/).

## [1.3.2] - 2026-07-07

### Mejorado
- **ExportButtons (UI)**: Spinner animado (`Loader2`) durante exportación — el usuario ve feedback visual inmediato
- **ExportButtons (UX)**: Botones se deshabilitan durante exportación para prevenir doble clic
- **ExportButtons (UX)**: Texto cambia a "Exportando..." mientras se procesa la descarga
- **ExportButtons (código)**: Refactoring — funciones `buildRequestBody()` y `triggerDownload()` reutilizables; eliminados 8 `console.log` de debug de producción

### Corregido
- **Roles y Permisos**: Exportar Excel/PDF fallaba con error 400 — objetos `Role` con permisos anidados no cumplen el esquema Zod del backend; se cambió `data={roles}` por `data={[]}` para que el backend genere el reporte directamente
- **Gestión de Usuarios**: Mismo problema resuelto — `data={users}` → `data={[]}`
- **Auditoría de Inventario**: Mismo problema resuelto — `data={logs}` → `data={[]}` (objetos con `oldValues`/`newValues` anidados)
- **Egresos de Kits (pantalla blanca)**: `ReferenceError: FileText is not defined` causaba crash completo del renderizado React; corregido agregando `FileText` al import de `lucide-react` en `KitExitsTab.tsx`

### Técnico
- **Protocolo de pruebas automatizadas**: 12/12 endpoints de exportación validados (Excel + PDF × 6 tipos de reporte)
- **Arquitectura ExportButtons**: Patrón definido — componentes con datos anidados usan `data={[]}` (backend genera); componentes con datos planos pueden usar `data={localData}`
- **report.routes.ts**: Casos `users` y `roles` agregados a los switches `/export/excel` y `/export/pdf`
- **App.tsx**: Ruta `/inventory-audit` corregida de `module="roles"` a `module="audit"`

---

## [1.3.0] - 2024-06-02

### Agregado
- **Módulo de Egresos de Kits**: Nueva funcionalidad para registrar salidas manuales de kits desde el módulo de Inventario
- **Control de stock en tiempo real**: El combo de selección de kits ahora muestra las cantidades disponibles actualizadas
- **Validación de stock**: Impide egresar más kits de los disponibles en inventario
- **Historial de egresos**: Registro completo de todas las salidas de kits con auditoría
- **Integración en UI**: Pestaña "Egresos de Kits" integrada en "Gestión de Inventario" junto a "Ingresos de Kits"

### Cambiado
- **Backend**: Endpoint `/api/kits` ahora incluye datos de inventario (`inventory: true`)
- **Frontend**: Componente `KitExits.tsx` actualizado para mostrar disponibilidad en tiempo real
- **Base de Datos**: Mejorada la relación entre `Kit` y `KitInventory`

### Corregido
- **Visualización de disponibilidad**: Corregido problema donde todos los kits mostraban "0 disponibles"
- **Acceso a datos de inventario**: Ajustado el acceso a `inventory[0].quantity` para manejar correctamente la estructura de datos

### Técnico
- **Parches en runtime**: Aplicados parches directos en contenedores Docker para actualización inmediata
- **Optimización de consultas**: Mejorado el include de Prisma para reducir consultas N+1
- **Tipado TypeScript**: Actualizada la interfaz `KitOption` para manejar `inventory` como array

---

## [1.2.0] - 2024-05-26

### Agregado
- **Entradas de Kits**: Funcionalidad para registrar ingresos de inventario por kit completo
- **Reporte de ingresos**: Historial de ingresos de kits con filtros y exportación
- **Control FEFO**: Implementación de First Expiry, First Out para gestión de vencimientos
- **Alertas de stock**: Notificaciones automáticas para productos con stock bajo
- **Dashboard mejorado**: Nuevos KPIs y gráficos interactivos

### Cambiado
- **Inventario**: Rediseñada la interfaz de gestión de lotes
- **Kits**: Mejorada la verificación de disponibilidad de productos
- **Reportes**: Optimizada la generación de reportes grandes

### Corregido
- **Concurrencia**: Resueltos problemas de actualización simultánea de stock
- **Performance**: Mejorado el tiempo de carga de listados grandes

---

## [1.1.0] - 2024-05-20

### Agregado
- **Sistema de Roles**: Implementación completa de RBAC con 6 roles predefinidos
- **Segregación de Funciones**: Flujo de entregas con 6 pasos y validación de usuarios diferentes
- **Auditoría Completa**: Registro de todas las acciones con trazabilidad
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Exportación**: Exportación a Excel y PDF para reportes

### Cambiado
- **Autenticación**: Migración a JWT con refresh tokens
- **Permisos**: Refactorización completa del sistema de permisos
- **UI**: Rediseño de la interfaz con TailwindCSS

### Corregido
- **Seguridad**: Cerradas vulnerabilidades de autorización
- **Datos**: Resueltos problemas de pérdida de datos en concurrencia

---

## [1.0.0] - 2024-05-15

### Agregado
- **Versión inicial de SIGAH**
- **Gestión de Inventario**: Control completo de productos y stock
- **Gestión de Beneficiarios**: Registro y clasificación de beneficiarios
- **Solicitudes**: Flujo completo de solicitud y aprobación
- **Entregas**: Sistema de entregas con seguimiento
- **Devoluciones**: Gestión de devoluciones con control de calidad
- **Reportes**: Reportes básicos y dashboard
- **API REST**: Endpoints completos para todas las funcionalidades
- **Base de Datos**: Schema completo con PostgreSQL y Prisma
- **Docker**: Contenerización completa para desarrollo y producción

---

## [0.9.0] - 2024-05-01 (Beta)

### Agregado
- **MVP del sistema**
- **Autenticación básica**
- **Gestión de productos simple**
- **Solicitudes básicas**
- **Entregas directas** (sin segregación)

### Limitaciones conocidas
- Sin sistema de roles
- Sin auditoría
- Flujo de entregas simplificado
- Sin control FEFO

---

## Roadmap Próximas Versiones

### [1.4.0] - Planeado
- [ ] **Módulo de Compras**: Gestión de órdenes de compra y proveedores
- [ ] **Integración SMS**: Notificaciones por SMS a beneficiarios
- [ ] **Firma Digital**: Captura de firma en entregas
- [ ] **Geolocalización**: Mapa de entregas y cobertura

### [1.5.0] - Planeado
- [ ] **Móvil**: Aplicación móvil nativa para despachadores
- [ ] **Offline**: Modo offline para áreas sin conexión
- [ ] **BI Avanzado**: Cubos OLAP para análisis avanzado
- [ ] **API Pública**: API para integración con sistemas externos

### [2.0.0] - Planeado
- [ ] **Multi-almacén**: Soporte para múltiples bodegas
- [ ] **Multi-organización**: Soporte para múltiples ONGs
- [ ] **Workflow Engine**: Motor de flujos personalizable
- [ ] **Machine Learning**: Predicción de demanda y optimización de rutas

---

## Notas de Versión

### Formato de Versiones
- **Major (X.0.0)**: Cambios breaking, incompatibles hacia atrás
- **Minor (X.Y.0)**: Nuevas funcionalidades, compatibles hacia atrás
- **Patch (X.Y.Z)**: Correcciones de bugs, compatibles hacia atrás

### Ciclo de Lanzamiento
- **Sprints de 2 semanas** para features menores
- **Sprints de 4 semanas** para features mayores
- **Lanzamientos mensuales** para producción
- **Patches según necesidad** para correcciones críticas

### Soporte
- **Versiones LTS**: Soporte extendido por 1 año
- **Versiones regulares**: Soporte por 6 meses
- **Patches críticos**: Soporte inmediato según severidad

---

*Para más detalles sobre los cambios técnicos, revisar el repositorio Git y los pull requests correspondientes.*
