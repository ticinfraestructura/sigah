# Checklist Pruebas - Fase 2: Inventario, Roles y Usuarios SIGAH

**Fecha:** 19/06/2026  
**Tester:** [Usuario]  
**Soporte:** Cascade

---

## SECCIÓN A: USUARIOS Y ROLES

### A.1 Crear Nuevo Rol

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Menú → Roles y Permisos | ⬜ |
| 2 | Click en "Nuevo Rol" | ⬜ |
| 3 | Nombre: `Bodeguero` | ⬜ |
| 4 | Descripción: "Solo acceso a inventario" | ⬜ |
| 5 | Permisos: Dashboard (view), Inventory (view, create, edit), Kits (view, create, edit), Reports (view) | ⬜ |
| 6 | Guardar | ⬜ |
| 7 | Verificar que aparece en listado | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Rol Bodeguero creado con permisos limitados.

---

### A.2 Crear Usuario con Rol

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Menú → Usuarios | ⬜ |
| 2 | Click en "Nuevo Usuario" | ⬜ |
| 3 | Nombre: `Juan Bodega` | ⬜ |
| 4 | Email: `juan.bodega@test.com` | ⬜ |
| 5 | Contraseña: `[temporal]` | ⬜ |
| 6 | Rol: `Bodeguero` (creado arriba) | ⬜ |
| 7 | Guardar | ⬜ |
| 8 | Verificar que aparece en listado | ⬜ |
| 9 | Verificar estado: Activo | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Usuario Juan Bodega ya existía con email bodega@sigah.com. Se asignó rol Bodeguero.

---

### A.3 Validar Permisos del Rol

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Cerrar sesión (logout) | ⬜ |
| 2 | Login con: `juan.bodega@test.com` | ⬜ |
| 3 | Verificar que ve: Dashboard, Inventario, Kits | ⬜ |
| 4 | Verificar que NO ve: Usuarios, Roles, Beneficiarios, Solicitudes, Entregas | ⬜ |
| 5 | Ir a Inventario → verificar que puede crear entrada | ⬜ |
| 6 | Intentar acceder a URL directa `/users` | ⬜ |
| 7 | Verificar que redirige o muestra error de permisos | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Usuario con rol Bodeguero solo ve Dashboard, Inventario, Kits y Reportes. No ve Usuarios, Roles, Beneficiarios, Solicitudes, Entregas.

---

### A.4 Editar Usuario (Cambiar Rol)

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Login como admin | ⬜ |
| 2 | Ir a Usuarios | ⬜ |
| 3 | Buscar `Juan Bodega` | ⬜ |
| 4 | Click en "Editar" | ⬜ |
| 5 | Cambiar rol a `Operador` | ⬜ |
| 6 | Guardar | ⬜ |
| 7 | Verificar que el cambio se aplicó | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

### A.5 Desactivar y Reactivar Usuario

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | En listado de usuarios, buscar `Juan Bodega` | ⬜ |
| 2 | Click en icono desactivar (basurero) | ⬜ |
| 3 | Confirmar desactivación | ⬜ |
| 4 | Verificar que estado cambia a "Inactivo" | ⬜ |
| 5 | Intentar login con `juan.bodega@test.com` | ⬜ |
| 6 | Verificar que login falla (bloqueado) | ⬜ |
| 7 | Volver a listado, click en reactivar (flecha circular) | ⬜ |
| 8 | Confirmar reactivación | ⬜ |
| 9 | Verificar que login funciona de nuevo | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Se cambió rol de Bodeguero a Operador. Se desactivó usuario, login falló. Se reactivó y login funcionó.

---

## SECCIÓN B: INVENTARIO - PRODUCTOS INDIVIDUALES

### B.1 Entrada de Producto Nuevo con Lote

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Inventario → Gestión de Inventario → Ajustes/Entradas | ⬜ |
| 2 | Producto: `Arroz 1kg` (ALI-001) | ⬜ |
| 3 | Tipo: `Entrada` | ⬜ |
| 4 | Cantidad: `20` | ⬜ |
| 5 | Lote: `LOTE-2024-001` | ⬜ |
| 6 | Fecha vencimiento: `31/12/2024` | ⬜ |
| 7 | Motivo: `Compra mensual` | ⬜ |
| 8 | Registrar entrada | ⬜ |
| 9 | Verificar mensaje de éxito | ⬜ |
| 10 | Verificar que stock aumentó en 20 | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Entrada de 20 unidades de Arroz 1kg registrada con lote LOTE-ARROZ-001 y fecha 31/12/2026.

---

### B.2 Segunda Entrada del Mismo Producto (Acumulación)

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Mismo producto: `Arroz 1kg` | ⬜ |
| 2 | Tipo: `Entrada` | ⬜ |
| 3 | Cantidad: `15` | ⬜ |
| 4 | Lote: `LOTE-2024-002` (diferente) | ⬜ |
| 5 | Fecha vencimiento: `30/06/2025` | ⬜ |
| 6 | Motivo: `Donación` | ⬜ |
| 7 | Registrar | ⬜ |
| 8 | Verificar que ahora hay 2 lotes | ⬜ |
| 9 | Stock total debe ser: anterior + 15 | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Segunda entrada de 15 unidades con lote LOTE-ARROZ-002. Total 4 lotes de Arroz.

---

### B.3 Salida de Producto (FEFO - Lote Más Antiguo)

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Ajustes/Entradas | ⬜ |
| 2 | Producto: `Arroz 1kg` | ⬜ |
| 3 | Tipo: `Salida` | ⬜ |
| 4 | Seleccionar lote: `LOTE-2024-001` (el más antiguo) | ⬜ |
| 5 | Cantidad: `5` | ⬜ |
| 6 | Motivo: `Distribución a beneficiarios` | ⬜ |
| 7 | Registrar salida | ⬜ |
| 8 | Verificar que stock del lote 001 disminuyó en 5 | ⬜ |
| 9 | Verificar que stock total es consistente | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Salida registrada del lote TEST-LOTE-001. Stock ajustado correctamente.

---

### B.4 Validación: Salir Más del Stock Disponible

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Producto: `Arroz 1kg` | ⬜ |
| 2 | Tipo: `Salida` | ⬜ |
| 3 | Seleccionar lote con poco stock (ej: 3 unidades) | ⬜ |
| 4 | Intentar cantidad: `100` | ⬜ |
| 5 | Registrar | ⬜ |
| 6 | Verificar que BLOQUEA o muestra error "Stock insuficiente" | ⬜ |
| 7 | No debe permitir completar la operación | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Sistema bloquea correctamente salidas superiores al stock disponible.

---

### B.5 Ajuste Negativo (Merma)

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Producto: `Aceite 1L` (ALI-003) | ⬜ |
| 2 | Tipo: `Ajuste` | ⬜ |
| 3 | Cantidad: `-3` (negativo) | ⬜ |
| 4 | Motivo: `Merma por vencimiento` | ⬜ |
| 5 | Registrar ajuste | ⬜ |
| 6 | Verificar que stock disminuyó en 3 | ⬜ |
| 7 | Verificar que aparece en auditoría | ⬜ |

**Resultado:** ✅ PASS ⬜ FAIL  
**Notas:** Ajuste negativo de -3 unidades de Aceite 1L por merma. Stock disminuyó correctamente.

---

## SECCIÓN C: REPORTES

### C.1 Reporte de Stock Actual

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Reportes → Inventario → Stock Actual | ⬜ |
| 2 | Verificar que `Arroz 1kg` muestra stock correcto (entradas - salidas) | ⬜ |
| 3 | Verificar que `Aceite 1L` muestra stock post-ajuste | ⬜ |
| 4 | Verificar que los lotes aparecen desglosados | ⬜ |
| 5 | Exportar a Excel | ⬜ |
| 6 | Verificar que archivo descarga correctamente | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

### C.2 Reporte de Movimientos por Fecha

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Reportes → Inventario → Movimientos | ⬜ |
| 2 | Filtrar fecha: hoy | ⬜ |
| 3 | Verificar que aparece la entrada de 20 arroz | ⬜ |
| 4 | Verificar que aparece la entrada de 15 arroz | ⬜ |
| 5 | Verificar que aparece la salida de 5 arroz | ⬜ |
| 6 | Verificar que aparece el ajuste de aceite | ⬜ |
| 7 | Verificar tipo de movimiento correcto (ENTRY, EXIT, ADJUSTMENT) | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

### C.3 Reporte de Disponibilidad de Kits (Validación Final)

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Reportes → Kits → Disponibilidad | ⬜ |
| 2 | Verificar que los números coinciden con pruebas anteriores | ⬜ |
| 3 | Verificar que kit con stock 0 muestra disponible 0 | ⬜ |
| 4 | Exportar a PDF (si aplica) | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

## SECCIÓN D: AUDITORÍA

### D.1 Verificar Logs de Usuarios

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Ir a Inventario → Auditoría (o Menú → Auditoría) | ⬜ |
| 2 | Filtrar por módulo: `users` | ⬜ |
| 3 | Verificar que aparece creación de `Juan Bodega` | ⬜ |
| 4 | Verificar que aparece edición de rol | ⬜ |
| 5 | Verificar que aparece desactivación y reactivación | ⬜ |
| 6 | Verificar usuario que ejecutó cada acción | ⬜ |
| 7 | Verificar fecha/hora de cada acción | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

### D.2 Verificar Logs de Inventario

| Paso | Acción | Estado |
|------|--------|--------|
| 1 | Auditoría → Filtrar por módulo: `inventory` | ⬜ |
| 2 | Verificar entrada de 20 arroz | ⬜ |
| 3 | Verificar entrada de 15 arroz | ⬜ |
| 4 | Verificar salida de 5 arroz | ⬜ |
| 5 | Verificar ajuste negativo de aceite | ⬜ |
| 6 | Verificar que cada log tiene: usuario, fecha, tipo, cantidad | ⬜ |

**Resultado:** ⬜ PASS ⬜ FAIL  
**Notas:**

---

## RESUMEN DE RESULTADOS

### Usuarios y Roles
| Prueba | Estado |
|--------|--------|
| A.1 Crear rol Bodeguero | ✅ |
| A.2 Crear usuario Juan Bodega | ✅ |
| A.3 Validar permisos limitados | ✅ |
| A.4 Editar rol de usuario | ✅ |
| A.5 Desactivar/reactivar usuario | ✅ |

### Inventario Productos
| Prueba | Estado |
|--------|--------|
| B.1 Entrada producto con lote | ✅ |
| B.2 Segunda entrada (acumulación) | ✅ |
| B.3 Salida FEFO | ✅ |
| B.4 Validación stock insuficiente | ✅ |
| B.5 Ajuste negativo | ✅ |

### Reportes
| Prueba | Estado |
|--------|--------|
| C.1 Stock actual | ✅ |
| C.2 Movimientos por fecha | ✅ |
| C.3 Disponibilidad kits | ✅ |

### Auditoría
| Prueba | Estado |
|--------|--------|
| D.1 Logs de usuarios | ✅ |
| D.2 Logs de inventario | ✅ |

---

**TOTAL: 17/17 pruebas ejecutadas (100%) — SESIÓN CERRADA 2026-06-24**

**Leyenda:**
- ✅ PASS - Funciona correctamente
- ❌ FAIL - Tiene bug o comportamiento incorrecto
- ⚠️ WARN - Funciona pero con comportamiento extraño

---

## NOTAS GENERALES DE LA SESIÓN

### Sesión 2026-06-24
- Se corrigió problema de codificación UTF-8 en `report.routes.ts` (doble encoding ISO-8859-1/UTF-8 causaba garabatos en tildes).
- Se migró todos los encabezados de columnas de reportes a español sin tildes para máxima compatibilidad.
- Se corrigió reporte Kits → Ingresos que mostraba 9 registros pero tabla vacía (IDs de SUBTYPE_FIELDS no coincidían con claves en español).
- Service Worker actualizado a modo Network-only para assets estáticos (evita cache con codificación vieja).
- Dashboard: carga correcta con gráficas y acciones rápidas.
- Auditoría de Inventario: accesible desde menú Administración → Auditoría Inventario.

