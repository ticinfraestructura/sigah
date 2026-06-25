# ACTA DE PRUEBAS UAT — SIGAH
**Fecha:** 2026-06-25  
**Versión:** 1.0.0  
**Ambiente:** Local — http://localhost:8080/sigah  
**Probado por:** ___________________________  
**Estado general:** ⬜ Pendiente | ✅ Aprobado | ❌ Rechazado

---

## Resultados Tests Automatizados (previos a UAT)

| Suite | Tests | Estado |
|-------|-------|--------|
| Backend unitarios (Vitest) | 63/63 | ✅ |
| Frontend e2e (Playwright) | 30/30 | ✅ |

---

## 1. AUTENTICACIÓN

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 1.1 | Login exitoso | Ingresar `admin@sigah.com` / `Admin123!` → click Ingresar | Redirige al Dashboard, muestra nombre del usuario | ⬜ | |
| 1.2 | Login con email incorrecto | Ingresar `noexiste@sigah.com` / `Admin123!` → click Ingresar | Mensaje de error "Credenciales inválidas" | ⬜ | |
| 1.3 | Login con contraseña incorrecta | Ingresar `admin@sigah.com` / `wrongpass` → click Ingresar | Mensaje de error visible | ⬜ | |
| 1.4 | Campos vacíos | Click Ingresar sin llenar campos | Validación HTML required activa | ⬜ | |
| 1.5 | Logout | Click en avatar → "Cerrar sesión" | Redirige a `/login`, sesión eliminada | ⬜ | |
| 1.6 | Botón Atrás post-logout | Hacer logout → presionar botón Atrás del browser | Permanece en `/login`, NO muestra pantalla protegida | ⬜ | |
| 1.7 | Acceso directo sin login | Sin sesión, navegar a `http://localhost:8080/sigah/inventory` | Redirige automáticamente a `/login` | ⬜ | |
| 1.8 | Token expirado | Esperar expiración del JWT o manipular localStorage → recargar página | Sesión se cierra, redirige a login | ⬜ | |
| 1.9 | Cambio contraseña obligatorio | Login con cuenta que tiene contraseña temporal | Muestra modal de cambio de contraseña obligatorio | ⬜ | |

---

## 2. DASHBOARD

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 2.1 | Carga del dashboard | Login → observar pantalla inicial | Tarjetas de estadísticas visibles: Total Productos, Kits Activos, Usuarios Activos, Bajo Stock | ⬜ | |
| 2.2 | Estadísticas correctas | Observar valores en tarjetas | Valores numéricos coherentes con datos del sistema | ⬜ | |
| 2.3 | Gráfico movimientos | Observar gráfico "Movimientos de Inventario" | Barras de entradas/salidas por mes visibles | ⬜ | |
| 2.4 | Gráfico stock por categoría | Observar sección "Stock por Categoría" | Lista de categorías con cantidades visible | ⬜ | |
| 2.5 | Alerta productos por vencer | Observar banner de alerta | Si hay productos próximos a vencer, muestra aviso con enlace "Ver detalles" | ⬜ | |
| 2.6 | Navegación sidebar | Click en cada ítem del menú lateral | Navega correctamente a cada módulo | ⬜ | |
| 2.7 | Responsive mobile | Reducir ventana a < 768px | Sidebar se oculta, aparece botón hamburguesa | ⬜ | |
| 2.8 | Toggle de tema | Click en botón de luna/sol en header | Cambia entre modo claro y oscuro | ⬜ | |

---

## 3. INVENTARIO

### 3.1 Gestión de Productos

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 3.1.1 | Ver lista de productos | Navegar a Inventario → pestaña Productos | Tabla con lista de productos, código, nombre, categoría, stock | ⬜ | |
| 3.1.2 | Buscar producto | Escribir en campo de búsqueda | Tabla se filtra en tiempo real | ⬜ | |
| 3.1.3 | Filtrar por categoría | Seleccionar categoría del filtro | Solo muestra productos de esa categoría | ⬜ | |
| 3.1.4 | Crear producto | Click "+ Nuevo Producto" → llenar formulario → Guardar | Producto aparece en la lista | ⬜ | |
| 3.1.5 | Editar producto | Click ícono editar en un producto | Modal de edición con datos precargados, guardar actualiza | ⬜ | |
| 3.1.6 | Desactivar producto | Click ícono eliminar/desactivar | Producto desaparece de lista activa | ⬜ | |
| 3.1.7 | Validación campos obligatorios | Intentar crear producto sin código/nombre | Mensaje de validación, no permite guardar | ⬜ | |
| 3.1.8 | Código duplicado | Crear producto con código ya existente | Error "código duplicado" | ⬜ | |

### 3.2 Entradas de Stock

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 3.2.1 | Registrar entrada | Pestaña Entradas → seleccionar producto → cantidad → Guardar | Stock del producto aumenta | ⬜ | |
| 3.2.2 | Entrada con lote y fecha vencimiento | Registrar entrada con N° de lote y fecha de vencimiento | Lote aparece en detalle del producto | ⬜ | |
| 3.2.3 | Validar cantidad positiva | Intentar ingresar cantidad 0 o negativa | Error de validación | ⬜ | |
| 3.2.4 | Ver histórico entradas | Observar tabla de movimientos | Lista de entradas con fecha, producto, cantidad, usuario | ⬜ | |

### 3.3 Stock y Alertas

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 3.3.1 | Indicador stock bajo | Observar productos con stock < mínimo | Indicador visual (rojo/naranja) en productos con bajo stock | ⬜ | |
| 3.3.2 | Productos por vencer | Pestaña o filtro de próximos a vencer | Lista de lotes con fecha de vencimiento próxima | ⬜ | |
| 3.3.3 | Stock total correcto | Verificar que el total mostrado = suma de lotes activos | Coincidencia entre suma de lotes y stock total | ⬜ | |

### 3.4 Gestión de Inventario (Admin)

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 3.4.1 | Ver sección Gestión Inventario | Sidebar → "Gestión Inventario" | Carga la vista de gestión avanzada | ⬜ | |
| 3.4.2 | Auditoría Inventario | Sidebar → "Auditoría Inventario" | Muestra log de movimientos con filtros | ⬜ | |

---

## 4. KITS

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 4.1 | Ver lista de kits | Navegar a Kits | Tarjetas de kits con código, nombre, composición y stock disponible | ⬜ | |
| 4.2 | Crear kit | Click "+ Nuevo Kit" → nombre, código, agregar productos con cantidades → Guardar | Kit aparece en la lista | ⬜ | |
| 4.3 | Editar kit | Click ícono editar | Modal con datos del kit, permite modificar composición | ⬜ | |
| 4.4 | Desactivar kit | Click ícono eliminar/desactivar | Kit desaparece de lista activa | ⬜ | |
| 4.5 | Ver composición de kit | Expandir o ver detalle de un kit | Muestra lista de productos con cantidades requeridas | ⬜ | |
| 4.6 | Registrar egreso de kit | Pestaña "Egresos de Kits" → seleccionar kit → cantidad → Registrar | Stock del kit disminuye | ⬜ | |
| 4.7 | Validar stock disponible | Intentar egresar más kits de los disponibles | Error o advertencia de stock insuficiente | ⬜ | |
| 4.8 | Histórico de egresos | Ver tabla de egresos anteriores | Lista con fecha, kit, cantidad, usuario | ⬜ | |
| 4.9 | Stock del kit se actualiza | Después de egreso, observar contador del kit | Cantidad disponible disminuye correctamente | ⬜ | |

---

## 5. REPORTES

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 5.1 | Navegar a Reportes | Sidebar → Reportes | Muestra "Centro de Reportes" con opciones de tipo | ⬜ | |
| 5.2 | Reporte de inventario | Seleccionar tipo "Inventario" | Tabla con productos, stock, categoría | ⬜ | |
| 5.3 | Reporte de kits | Seleccionar tipo "Kits" | Tabla con kits, composición, stock | ⬜ | |
| 5.4 | Reporte de egresos de kits | Seleccionar tipo "Egresos" | Tabla con histórico de egresos | ⬜ | |
| 5.5 | Filtrar por fechas | Aplicar filtro de rango de fechas | Reporte muestra solo datos del período seleccionado | ⬜ | |
| 5.6 | Exportar a Excel/CSV | Click botón Exportar | Descarga archivo con datos del reporte | ⬜ | |
| 5.7 | Exportar a PDF | Click botón PDF (si disponible) | Descarga PDF con formato correcto | ⬜ | |
| 5.8 | Datos consistentes | Comparar totales de reporte vs dashboard | Los números coinciden | ⬜ | |

---

## 6. USUARIOS Y ROLES *(solo Admin)*

### 6.1 Gestión de Usuarios

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 6.1.1 | Ver lista de usuarios | Sidebar → Usuarios | Tabla con usuarios, email, rol, estado | ⬜ | |
| 6.1.2 | Crear usuario | Click "+ Nuevo Usuario" → llenar datos + rol obligatorio → Guardar | Usuario aparece en lista | ⬜ | |
| 6.1.3 | Rol obligatorio al crear | Intentar crear usuario sin seleccionar rol | Error de validación "El rol es obligatorio" | ⬜ | |
| 6.1.4 | Email duplicado | Crear usuario con email ya registrado | Error "email ya existe" | ⬜ | |
| 6.1.5 | Editar usuario | Click editar → modificar datos → Guardar | Datos actualizados en lista | ⬜ | |
| 6.1.6 | Desactivar usuario | Click desactivar | Usuario no puede iniciar sesión | ⬜ | |
| 6.1.7 | Cambiar rol de usuario | Editar usuario → cambiar rol → Guardar | Permisos cambian en próximo login | ⬜ | |

### 6.2 Roles y Permisos

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 6.2.1 | Ver roles | Sidebar → "Roles y Permisos" | Lista de roles del sistema | ⬜ | |
| 6.2.2 | Ver permisos de un rol | Click en un rol | Muestra matriz de permisos por módulo | ⬜ | |
| 6.2.3 | Restricción por rol | Login con usuario rol "Bodeguero" | Solo ve módulos permitidos, no ve Administración | ⬜ | |
| 6.2.4 | Admin sin restricciones | Login con Administrador | Acceso completo a todos los módulos | ⬜ | |

---

## 7. SEGURIDAD ADICIONAL

| # | Caso de prueba | Pasos | Resultado esperado | Estado | Observaciones |
|---|----------------|-------|--------------------|--------|---------------|
| 7.1 | Inactividad de sesión | Dejar sesión inactiva por el tiempo configurado | Mensaje de sesión expirada, redirige a login | ⬜ | |
| 7.2 | Acceso a API sin token | Llamar directamente a `http://localhost:8080/sigah-api/products` sin header | Respuesta 401 Unauthorized | ⬜ | |
| 7.3 | Acceso a ruta admin con rol básico | Login como bodeguero → intentar navegar a `/users` | Redirige o muestra "Sin permisos" | ⬜ | |

---

## Resumen de Resultados

| Módulo | Total | ✅ OK | ❌ Falla | ⬜ N/P |
|--------|-------|--------|---------|--------|
| 1. Autenticación | 9 | | | 9 |
| 2. Dashboard | 8 | | | 8 |
| 3. Inventario | 14 | | | 14 |
| 4. Kits | 9 | | | 9 |
| 5. Reportes | 8 | | | 8 |
| 6. Usuarios y Roles | 11 | | | 11 |
| 7. Seguridad | 3 | | | 3 |
| **TOTAL** | **62** | | | **62** |

---

## Defectos encontrados

| # | Módulo | Descripción | Severidad | Estado |
|---|--------|-------------|-----------|--------|
| | | | | |

---

## Firma y aprobación

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Tester | | | |
| Líder técnico | | | |
| Product Owner | | | |

---

*Generado automáticamente — SIGAH v1.0.0*
