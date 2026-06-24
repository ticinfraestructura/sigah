# ACTA DE PRUEBAS — MÓDULO DE REPORTES Y AUDITORÍA
## Sistema SIGAH — Gestión de Almacén Humanitario

---

**Fecha:** 24 de junio de 2026  
**Hora inicio:** 11:00 AM (UTC-5)  
**Hora fin:** 3:35 PM (UTC-5)  
**Entorno:** Producción local — `http://localhost:8080`  
**Responsable técnico:** Cascade AI (par programador)  
**Usuario evaluador:** Administrador SIGAH  

---

## 1. OBJETIVO

Verificar el correcto funcionamiento del módulo de Reportes y Auditoría del sistema SIGAH, incluyendo:
- Generación de reportes de inventario con columnas legibles en español.
- Visualización de reportes de kits (Stock, Ingresos, Egresos, Disponibilidad).
- Acceso a logs de auditoría de usuarios e inventario.
- Funcionamiento del Dashboard principal.

---

## 2. ENTORNO TÉCNICO

| Componente | Versión / Detalle |
|-----------|-------------------|
| Backend | Node.js + Express + Prisma ORM |
| Base de datos | PostgreSQL 16 (Alpine) |
| Frontend | React + Vite + TailwindCSS |
| Servidor web | Nginx (contenedor Docker) |
| Orquestación | Docker Compose |
| URL Frontend | http://localhost:8080 |
| URL Backend | http://localhost:3001 |

---

## 3. CORRECCIONES APLICADAS EN ESTA SESIÓN

### 3.1 Codificación de caracteres en reportes
- **Problema:** Los encabezados de reportes mostraban caracteres corruptos (ej: `HistÃ³rico`, `CÃ³digo`) por doble codificación UTF-8/ISO-8859-1 en el archivo `backend/src/routes/report.routes.ts`.
- **Solución:** Re-codificación correcta del archivo y migración de todos los encabezados a español sin tildes ni caracteres especiales para máxima compatibilidad.

### 3.2 Service Worker — caché de assets
- **Problema:** El Service Worker servía versiones cacheadas de archivos JS/CSS con codificación incorrecta.
- **Solución:** Cambio a modo `Network-only` para assets estáticos, forzando siempre la descarga del servidor.

### 3.3 Reporte Kits → Ingresos — lista vacía
- **Problema:** El reporte mostraba "9 registros encontrados" pero la tabla aparecía vacía.
- **Causa raíz:** Los IDs en `SUBTYPE_FIELDS['ingresos']` usaban claves en inglés (`productCode`, `lotNumber`) mientras el backend ya devolvía claves en español (`Codigo Kit`, `Lote`). El filtrado de campos no encontraba coincidencias.
- **Solución:** Actualización de `SUBTYPE_FIELDS['ingresos']` para usar los mismos IDs en español que devuelve el backend.

### 3.4 Encabezados de todos los reportes en español
Todos los subtypes de reportes fueron actualizados para devolver claves en español sin tildes:

| Subtipo | Columnas |
|---------|---------|
| Stock Actual | Codigo, Nombre, Categoria, Stock Actual, Stock Minimo, Unidad, Perecedero, Estado |
| Stock de Kits | Codigo, Nombre, Tipo, Stock Disponible, Estado |
| Kits Desagregados | Codigo Kit, Nombre Kit, Stock Kits Disponibles, Codigo Producto, Nombre Producto, Categoria Producto, Cantidad por Kit, Total Necesario, Unidad |
| Movimientos | Fecha, Hora, Codigo Producto, Nombre Producto, Categoria, Lote, Tipo Movimiento, Cantidad, Motivo, Referencia, Usuario |
| Historico Eliminaciones | Fecha, Hora, Codigo Producto, Nombre Producto, Categoria, Numero de Lote, Cantidad Eliminada, Motivo de Eliminacion, Usuario |
| Bajo Stock | Codigo, Nombre, Categoria, Stock Actual, Stock Minimo, Deficit |
| Listado Kits | Codigo, Nombre, Descripcion, Cantidad Productos, Activo |
| Disponibilidad Kits | Codigo, Nombre, Stock Fisico, Capacidad Armado, Productos |
| Ingresos/Egresos Kits | Fecha, Hora, Codigo Kit, Nombre Kit, Lote, Cantidad, Motivo, Referencia, Usuario |

---

## 4. RESULTADOS DE PRUEBAS

### 4.1 Sección C — Reportes

| ID | Prueba | Resultado | Observaciones |
|----|--------|-----------|---------------|
| C.1 | Reporte Stock Actual | ✅ PASS | Muestra productos con stock, minimo y estado |
| C.2 | Reporte Movimientos por Fecha | ✅ PASS | Encabezados en español, datos correctos |
| C.3 | Disponibilidad de Kits | ✅ PASS | Stock fisico y capacidad de armado correctos |

### 4.2 Sección D — Auditoría

| ID | Prueba | Resultado | Observaciones |
|----|--------|-----------|---------------|
| D.1 | Logs de Usuarios | ✅ PASS | Accesible en Administracion → Auditoria Inventario |
| D.2 | Logs de Inventario | ✅ PASS | Movimientos registrados con usuario, fecha y tipo |

### 4.3 Dashboard

| ID | Prueba | Resultado | Observaciones |
|----|--------|-----------|---------------|
| E.1 | Carga del Dashboard | ✅ PASS | Carga sin errores |
| E.2 | Graficas estadisticas | ✅ PASS | Se visualizan correctamente |
| E.3 | Acciones rapidas | ✅ PASS | Botones operativos |

---

## 5. RESUMEN GLOBAL DEL PROYECTO

| Seccion | Pruebas | Pasaron | Fallaron |
|---------|---------|---------|---------|
| A — Usuarios y Roles | 5 | 5 | 0 |
| B — Inventario Productos | 5 | 5 | 0 |
| C — Reportes | 3 | 3 | 0 |
| D — Auditoria | 2 | 2 | 0 |
| E — Dashboard | 3 | 3 | 0 |
| **TOTAL** | **18** | **18** | **0** |

**Resultado final: 100% PASS ✅**

---

## 6. MÓDULOS VERIFICADOS Y FUNCIONALES

- ✅ Autenticación (login, logout, sesión)
- ✅ Gestión de Roles y Permisos
- ✅ Gestión de Usuarios
- ✅ Inventario de Productos (entradas, salidas FEFO, ajustes)
- ✅ Inventario de Kits (stock fisico, ingresos, egresos)
- ✅ Reportes de Inventario (stock, movimientos, bajo stock, historico)
- ✅ Reportes de Kits (listado, disponibilidad, composicion, ingresos, egresos)
- ✅ Auditoria de Inventario
- ✅ Dashboard con graficas y acciones rapidas

---

## 7. MÓDULOS PENDIENTES DE PRUEBA (FUTURAS SESIONES)

- ⬜ Solicitudes (flujo completo)
- ⬜ Autorizaciones
- ⬜ Entregas a beneficiarios
- ⬜ Notificaciones push
- ⬜ Modulo de Beneficiarios

---

## 8. FIRMAS

| Rol | Nombre | Firma |
|-----|--------|-------|
| Responsable técnico | Administrador SIGAH | _____________ |
| Supervisor / Revisor | | _____________ |

---

*Documento generado automáticamente el 2026-06-24 al cierre de la sesión de pruebas.*
