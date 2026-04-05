# SIGAH - Guía de Pruebas con Usuarios (UAT)

## Objetivo

Esta guía permite ejecutar pruebas funcionales **con usuarios finales** para:
- Validar que el sistema cubre los flujos de trabajo reales
- Detectar fallas, errores o comportamientos inesperados
- Identificar oportunidades de mejora (UX, funcionalidad, rendimiento)
- Generar evidencia para aprobación de paso a producción

---

## Preparación

### Acceso
| URL | Descripción |
|---|---|
| http://localhost:3000/sigah/ | Aplicación SIGAH |

### Cuentas de prueba

| Rol | Email | Password |
|---|---|---|
| Administrador | admin@sigah.com | admin123 |
| Autorizador | autorizador@sigah.com | admin123 |
| Bodega | bodega@sigah.com | admin123 |
| Despachador | despachador@sigah.com | admin123 |
| Operador | operador@sigah.com | admin123 |
| Consulta | consulta@sigah.com | admin123 |

### Plantilla de registro de resultados

Para cada caso de prueba, registrar:

| Campo | Descripción |
|---|---|
| **ID** | Número del caso |
| **Resultado** | ✅ PASS / ❌ FAIL / ⚠️ MEJORA |
| **Observación** | Qué pasó exactamente |
| **Screenshot** | Captura de pantalla si aplica |
| **Severidad** | Crítico / Mayor / Menor / Cosmético |

---

## MÓDULO 1: AUTENTICACIÓN Y ACCESO

### Sesión: 15 minutos | Rol: Todos

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| AUTH-01 | Login exitoso como Admin | 1. Abrir /sigah/ 2. Ingresar admin@sigah.com / admin123 3. Click "Iniciar sesión" | Redirige al Dashboard con menú completo |
| AUTH-02 | Login con credenciales incorrectas | 1. Ingresar admin@sigah.com / wrongpass | Mensaje de error claro, no revela si el email existe |
| AUTH-03 | Login como Consulta | 1. Login con consulta@sigah.com | Dashboard visible, módulos de solo lectura (sin botones Crear/Editar) |
| AUTH-04 | Login como Bodega | 1. Login con bodega@sigah.com | Solo ve módulos: Dashboard, Inventario, Kits, Entregas, Devoluciones, Reportes |
| AUTH-05 | Cerrar sesión | 1. Click en icono usuario 2. Click "Cerrar sesión" | Redirige a login, token eliminado |
| AUTH-06 | Acceso sin sesión | 1. Cerrar sesión 2. Intentar acceder directamente a /sigah/inventory | Redirige a login |
| AUTH-07 | Sesión expirada | 1. Modificar token en localStorage a uno inválido 2. Navegar | Redirige a login con mensaje |

**🔍 Oportunidades de mejora a detectar:**
- ¿El mensaje de error es claro y en español?
- ¿Hay indicador de carga durante el login?
- ¿Se recuerda la sesión al cerrar el navegador?

---

## MÓDULO 2: DASHBOARD

### Sesión: 10 minutos | Rol: Admin

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| DASH-01 | Visualización de resumen | 1. Login como admin 2. Verificar Dashboard | Muestra cards con totales: productos, beneficiarios, solicitudes, entregas |
| DASH-02 | Gráficos visibles | Verificar que se muestren gráficos | Al menos un gráfico de distribución o tendencia |
| DASH-03 | Datos consistentes | Comparar números del dashboard con módulos individuales | Los totales coinciden |
| DASH-04 | Responsive | Reducir ventana a 375px de ancho | Dashboard se adapta sin contenido cortado |

**🔍 Oportunidades de mejora:**
- ¿Los números se actualizan en tiempo real?
- ¿Falta algún KPI importante para la operación?
- ¿Los gráficos son útiles para la toma de decisiones?

---

## MÓDULO 3: INVENTARIO (PRODUCTOS)

### Sesión: 30 minutos | Rol: Admin y Bodega

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| INV-01 | Listar productos | 1. Ir a Inventario | Lista de 14 productos con stock, categoría, unidad |
| INV-02 | Buscar producto | 1. Escribir "Arroz" en búsqueda | Se filtra correctamente |
| INV-03 | Filtrar por categoría | 1. Seleccionar categoría "Alimentos" | Solo muestra productos alimenticios |
| INV-04 | Crear producto nuevo | 1. Click "Crear Producto" 2. Llenar: Código=TEST-001, Nombre="Producto Test", Categoría=Alimentos, Unidad=UNIT, Stock mín=10 3. Guardar | Producto aparece en la lista |
| INV-05 | Crear producto duplicado | 1. Intentar crear otro con código TEST-001 | Error: "Ya existe un producto con ese código" |
| INV-06 | Editar producto | 1. Click en producto TEST-001 2. Cambiar nombre a "Producto Editado" 3. Guardar | Nombre actualizado en la lista |
| INV-07 | Crear producto perecedero | 1. Crear producto con isPerishable=true | Se marca como perecedero |
| INV-08 | Registrar entrada de stock | 1. En producto, agregar lote: LOT-TEST-001, cantidad=50 2. Guardar | Stock total aumenta en 50. StockMovement ENTRY creado |
| INV-09 | Ajustar stock (+) | 1. Ajustar stock del lote +10 con motivo "Corrección conteo" | Stock aumenta. Movimiento ADJUSTMENT registrado |
| INV-10 | Ajustar stock (-) | 1. Ajustar stock del lote -5 con motivo "Producto dañado" | Stock disminuye. Movimiento registrado |
| INV-11 | Ajuste que deja negativo | 1. Intentar ajustar -999 | Error: "El ajuste resultaría en stock negativo" |
| INV-12 | Ver movimientos de stock | 1. Ver historial de movimientos del producto | Muestra ENTRY, ADJUSTMENT con fechas y usuarios |
| INV-13 | Productos con stock bajo | 1. Verificar indicador de stock bajo | Productos por debajo del mínimo marcados visualmente |
| INV-14 | Desactivar producto | 1. Eliminar/desactivar producto TEST-001 | Producto ya no aparece en listados (soft delete) |

**🔍 Oportunidades de mejora:**
- ¿Es fácil identificar productos con stock bajo?
- ¿Se puede importar inventario desde Excel?
- ¿Hay alertas automáticas de stock bajo?
- ¿Es claro el historial de movimientos?

---

## MÓDULO 4: KITS

### Sesión: 20 minutos | Rol: Admin y Bodega

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| KIT-01 | Listar kits | 1. Ir a Kits | 3 kits: Alimentario, Aseo, Emergencia |
| KIT-02 | Ver detalle de kit | 1. Click en Kit Alimentario | Muestra productos y cantidades |
| KIT-03 | Verificar disponibilidad | 1. En Kit Alimentario, verificar disponibilidad para 1 unidad | Indica si hay stock suficiente para armar el kit |
| KIT-04 | Crear kit nuevo | 1. Click "Crear Kit" 2. Código=KIT-TEST, Nombre="Kit de Prueba" 3. Agregar 2 productos con cantidades 4. Guardar | Kit creado y visible |
| KIT-05 | Editar kit | 1. Editar KIT-TEST 2. Agregar un producto más 3. Guardar | Kit actualizado |
| KIT-06 | Kit sin productos | 1. Intentar crear kit sin seleccionar productos | Error: "El kit debe tener al menos un producto" |
| KIT-07 | Desactivar kit | 1. Eliminar KIT-TEST | Kit desactivado (soft delete) |

**🔍 Oportunidades de mejora:**
- ¿Se ve claramente cuántos kits se pueden armar con el stock actual?
- ¿Se puede duplicar un kit existente para crear uno similar?
- ¿Es intuitiva la interfaz de agregar productos al kit?

---

## MÓDULO 5: BENEFICIARIOS

### Sesión: 20 minutos | Rol: Admin y Operador

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| BEN-01 | Listar beneficiarios | 1. Ir a Beneficiarios | 4 beneficiarios del seed |
| BEN-02 | Buscar por nombre | 1. Buscar "Carlos" | Filtra correctamente |
| BEN-03 | Buscar por documento | 1. Buscar "1234567890" | Encuentra a Carlos García |
| BEN-04 | Filtrar por tipo de población | 1. Filtrar por "DISPLACED" | Solo muestra desplazados |
| BEN-05 | Crear beneficiario | 1. Click "Crear" 2. CC, 9999999999, "Juan", "Test", tel, dir, Bogotá, VULNERABLE, familia=3 3. Guardar | Beneficiario creado |
| BEN-06 | Documento duplicado | 1. Intentar crear otro con CC 9999999999 | Error: "Ya existe un beneficiario con ese documento" |
| BEN-07 | Campos obligatorios | 1. Intentar crear sin nombre | Error de validación |
| BEN-08 | Editar beneficiario | 1. Editar Juan Test 2. Cambiar teléfono 3. Guardar | Datos actualizados |
| BEN-09 | Ver historial de solicitudes | 1. Click en beneficiario Carlos García 2. Ver solicitudes asociadas | Muestra solicitudes previas |
| BEN-10 | Desactivar beneficiario | 1. Desactivar beneficiario Juan Test | No aparece en listados de selección |

**🔍 Oportunidades de mejora:**
- ¿Se puede exportar la lista de beneficiarios?
- ¿Es fácil ver el historial de ayudas recibidas por un beneficiario?
- ¿Falta algún dato importante del beneficiario?
- ¿Se necesita campo de geolocalización?

---

## MÓDULO 6: SOLICITUDES (Flujo Completo)

### Sesión: 30 minutos | Roles: Operador → Admin/Autorizador

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| SOL-01 | Listar solicitudes | 1. Ir a Solicitudes | Muestra 4 solicitudes del seed en distintos estados |
| SOL-02 | Filtrar por estado | 1. Filtrar por "REGISTERED" | Solo muestra solicitudes registradas |
| SOL-03 | Crear solicitud con kit | 1. Login como operador 2. Crear solicitud 3. Beneficiario: Carlos García 4. Kit Alimentario x1 5. Prioridad Alta 6. Guardar | Solicitud creada, estado REGISTERED, código SOL-2024-XXXX |
| SOL-04 | Crear solicitud con productos individuales | 1. Crear solicitud 2. Seleccionar productos individuales con cantidades 3. Guardar | Solicitud creada con productos |
| SOL-05 | Crear solicitud mixta | 1. Crear solicitud con kit + productos adicionales | Funciona correctamente |
| SOL-06 | Solicitud sin productos | 1. Intentar crear sin seleccionar nada | Error: "Debe solicitar al menos un producto o kit" |
| SOL-07 | Solicitud con beneficiario inactivo | 1. Intentar crear solicitud para beneficiario desactivado | Error: "Beneficiario no encontrado o inactivo" |
| SOL-08 | Pasar a EN_REVIEW | 1. Login como admin 2. Cambiar estado REGISTERED → IN_REVIEW | Estado cambia, historial registrado |
| SOL-09 | Aprobar solicitud | 1. Cambiar estado IN_REVIEW → APPROVED | Estado APPROVED, auditoría generada |
| SOL-10 | Rechazar solicitud | 1. Crear otra solicitud 2. IN_REVIEW → REJECTED con motivo | Estado REJECTED con nota |
| SOL-11 | Reactivar solicitud rechazada | 1. REJECTED → REGISTERED | Vuelve al inicio del flujo |
| SOL-12 | Cancelar solicitud | 1. Cancelar solicitud con motivo | Estado CANCELLED |
| SOL-13 | Transición inválida | 1. Intentar pasar de REGISTERED directo a APPROVED | Error: "Transición de estado inválida" |
| SOL-14 | Ver historial de estados | 1. Click en solicitud 2. Ver historial | Lista de transiciones con usuario, fecha, notas |
| SOL-15 | Editar solicitud en revisión | 1. Editar productos/kits de solicitud en IN_REVIEW | Cambios guardados |
| SOL-16 | Editar solicitud aprobada | 1. Intentar editar solicitud APPROVED | Error: "Solo se pueden editar solicitudes en estado Registrada o En Revisión" |

**🔍 Oportunidades de mejora:**
- ¿El flujo de aprobación es claro para el usuario?
- ¿Se necesitan más niveles de aprobación?
- ¿Es fácil ver qué solicitudes requieren atención urgente?
- ¿Se puede adjuntar documentos a la solicitud?

---

## MÓDULO 7: ENTREGAS (Flujo de 6 Pasos)

### Sesión: 45 minutos | Roles: Bodega → Autorizador → Bodega → Despachador

**Pre-requisito:** Tener una solicitud en estado APPROVED (SOL-03 del módulo anterior).

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| ENT-01 | Listar entregas | 1. Ir a Entregas | Muestra entregas existentes |
| ENT-02 | **PASO 1: Crear entrega** | 1. Login como **bodega** 2. Crear entrega para solicitud aprobada 3. Seleccionar productos/kits | Estado PENDING_AUTHORIZATION, notificación enviada a autorizadores |
| ENT-03 | Entrega duplicada | 1. Intentar crear otra entrega para la misma solicitud | Error: "Ya existe una entrega pendiente de autorización" |
| ENT-04 | **PASO 2: Autorizar** | 1. Login como **autorizador** 2. Autorizar la entrega | Estado AUTHORIZED, notificación a bodega |
| ENT-05 | Segregación: creador no autoriza | 1. Login como **bodega** (que la creó) 2. Intentar autorizar | Error: "El autorizador no puede ser la misma persona que creó" |
| ENT-06 | **PASO 3: Recibir en bodega** | 1. Login como **bodega** (diferente al autorizador) 2. Recibir en bodega | Estado RECEIVED_WAREHOUSE |
| ENT-07 | Segregación: autorizador no recibe | 1. Login como **autorizador** 2. Intentar recibir en bodega | Error de segregación |
| ENT-08 | **PASO 4: Preparar** | 1. Login como **bodega** 2. Iniciar preparación | Estado IN_PREPARATION |
| ENT-09 | **PASO 5: Marcar lista** | 1. Login como **bodega** 2. Marcar como lista | Estado READY, **inventario descontado automáticamente** |
| ENT-10 | Verificar descuento FEFO | 1. Ir a Inventario 2. Verificar que el stock de los productos bajó | Stock reducido en las cantidades correctas |
| ENT-11 | Verificar movimientos | 1. Ver movimientos de stock | Movimientos EXIT registrados por cada producto |
| ENT-12 | **PASO 6: Entregar** | 1. Login como **despachador** 2. Confirmar entrega al beneficiario 3. Ingresar datos del receptor | Estado DELIVERED |
| ENT-13 | Segregación: preparador no entrega | 1. Si el mismo usuario de bodega intenta entregar | Error de segregación |
| ENT-14 | Solicitud cambia a DELIVERED | 1. Verificar solicitud original | Estado actualizado a DELIVERED o PARTIALLY_DELIVERED |
| ENT-15 | Ver historial completo | 1. Click en entrega 2. Ver historial | 6+ registros con cada paso, usuario, fecha |
| ENT-16 | Cancelar entrega (antes de READY) | 1. Crear nueva entrega 2. Cancelar antes del paso 5 | Estado CANCELLED, sin afectar inventario |
| ENT-17 | Cancelar entrega (después de READY) | 1. Crear entrega y llegar a READY 2. Cancelar | Estado CANCELLED, **inventario devuelto automáticamente** |

**🔍 Oportunidades de mejora:**
- ¿El flujo de 6 pasos es claro o hay pasos innecesarios?
- ¿Las notificaciones llegan correctamente a cada rol?
- ¿Se necesita firma digital del beneficiario?
- ¿Es fácil ver qué entregas requieren acción de mi rol?
- ¿Se puede imprimir un acta de entrega?

---

## MÓDULO 8: DEVOLUCIONES

### Sesión: 15 minutos | Rol: Admin y Bodega

**Pre-requisito:** Tener una entrega en estado DELIVERED.

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| DEV-01 | Listar devoluciones | 1. Ir a Devoluciones | Lista vacía o con devoluciones existentes |
| DEV-02 | Crear devolución (buen estado) | 1. Crear devolución 2. Seleccionar entrega 3. Producto: Arroz, cantidad 1, condición GOOD | Stock **devuelto** al inventario |
| DEV-03 | Crear devolución (dañado) | 1. Crear devolución 2. Producto: Frijoles, cantidad 1, condición DAMAGED | Stock **NO** devuelto (pérdida registrada) |
| DEV-04 | Verificar stock post-devolución | 1. Ir a Inventario 2. Verificar stock del producto devuelto | +1 en Arroz (GOOD), sin cambio en Frijoles (DAMAGED) |
| DEV-05 | Movimiento de stock RETURN | 1. Ver movimientos | Movimiento RETURN registrado solo para condición GOOD |

**🔍 Oportunidades de mejora:**
- ¿Se necesitan más estados de condición (parcialmente dañado)?
- ¿Se puede adjuntar foto del producto devuelto?
- ¿Queda claro el impacto en inventario?

---

## MÓDULO 9: REPORTES Y AUDITORÍA

### Sesión: 15 minutos | Rol: Admin

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| REP-01 | Dashboard de reportes | 1. Ir a Reportes | Visualización de datos consolidados |
| REP-02 | Exportar datos | 1. Intentar exportar a Excel/PDF | Descarga archivo correctamente |
| AUD-01 | Ver auditoría de un producto | 1. Ver historial de auditoría de un producto específico | Todos los cambios registrados |
| AUD-02 | Buscar por usuario | 1. Buscar actividad de un usuario específico | Muestra todas sus acciones |
| AUD-03 | Filtrar por fecha | 1. Filtrar auditoría por rango de fechas | Resultados filtrados |
| AUD-04 | Exportar auditoría | 1. Exportar auditoría a CSV | Archivo descargado correctamente |

**🔍 Oportunidades de mejora:**
- ¿Los reportes disponibles cubren las necesidades de la operación?
- ¿Se necesitan reportes adicionales?
- ¿La auditoría es suficientemente detallada para cumplimiento?

---

## MÓDULO 10: PRUEBAS TRANSVERSALES

### Sesión: 20 minutos

| ID | Caso de Prueba | Pasos | Resultado Esperado |
|---|---|---|---|
| TRANS-01 | Responsive móvil | Reducir navegador a 375px | Todos los módulos funcionales |
| TRANS-02 | Navegación entre módulos | Navegar rápidamente entre todos los módulos | Sin errores, carga rápida |
| TRANS-03 | Paginación | En listados grandes, navegar páginas | Funciona correctamente |
| TRANS-04 | Sesión simultánea | Abrir 2 pestañas con usuarios diferentes | Cada uno ve su rol |
| TRANS-05 | Recarga de página | Presionar F5 en cualquier módulo | Vuelve a la misma vista |
| TRANS-06 | Mensajes de error | Provocar errores diversos | Mensajes claros en español |
| TRANS-07 | Rendimiento | Medir tiempo de carga de cada módulo | < 3 segundos cada uno |
| TRANS-08 | Notificaciones | Verificar campana de notificaciones | Muestra notificaciones de entregas pendientes |

---

## REGISTRO DE HALLAZGOS

### Plantilla para cada hallazgo

```
ID: [HAL-001]
Módulo: [Entregas]
Tipo: [❌ Bug / ⚠️ Mejora / 💡 Sugerencia]
Severidad: [Crítico / Mayor / Menor / Cosmético]
Descripción: [Descripción detallada]
Pasos para reproducir:
  1. ...
  2. ...
Resultado actual: [Qué pasó]
Resultado esperado: [Qué debería pasar]
Screenshot: [adjuntar]
Reportado por: [nombre]
Fecha: [fecha]
```

### Clasificación de severidad

| Severidad | Definición | Ejemplo |
|---|---|---|
| **Crítico** | Bloquea funcionalidad principal | No se puede crear entregas |
| **Mayor** | Funcionalidad incorrecta pero hay workaround | Stock no se descuenta correctamente |
| **Menor** | Funcionalidad parcial o UX deficiente | Filtro no funciona bien |
| **Cosmético** | Visual o texto | Texto cortado, alineación |

---

## CRITERIOS DE ACEPTACIÓN PARA PRODUCCIÓN

### Obligatorios (must-have)
- [ ] 0 bugs críticos abiertos
- [ ] 0 bugs mayores abiertos
- [ ] Login y autenticación funcionan perfectamente
- [ ] Flujo completo de entrega (6 pasos) funciona sin errores
- [ ] Inventario se descuenta y devuelve correctamente
- [ ] Segregación de funciones impide acciones no autorizadas
- [ ] Auditoría registra todas las acciones
- [ ] Roles y permisos funcionan correctamente
- [ ] Datos no se pierden al reiniciar contenedores

### Deseables (nice-to-have)
- [ ] Bugs menores < 5
- [ ] Tiempo de carga < 3 segundos en cada módulo
- [ ] Responsive funcional en móvil
- [ ] Exportación de reportes funcional
- [ ] Notificaciones funcionan en tiempo real

---

## CRONOGRAMA SUGERIDO DE PRUEBAS

| Día | Módulos | Duración | Participantes |
|---|---|---|---|
| **Día 1** | Auth + Dashboard + Inventario + Kits | 2 horas | Admin + Bodega |
| **Día 2** | Beneficiarios + Solicitudes | 2 horas | Admin + Operador |
| **Día 3** | Entregas (flujo completo) | 2 horas | Todos los roles |
| **Día 4** | Devoluciones + Reportes + Transversales | 1.5 horas | Admin + Bodega |
| **Día 5** | Re-test de hallazgos + Regresión | 1.5 horas | Admin |

**Total estimado: 9 horas de pruebas distribuidas en 5 días.**

---

## NOTAS PARA EL FACILITADOR

1. **Antes de cada sesión:** Verificar que SIGAH esté corriendo y la BD tenga datos
2. **Durante la sesión:** Anotar TODOS los comentarios, incluso los positivos
3. **Después de cada sesión:** Consolidar hallazgos en la plantilla
4. **Datos de prueba:** Si se necesita resetear, ejecutar:
   ```powershell
   docker compose -f docker-compose.dev.new.yml down -v
   docker compose -f docker-compose.dev.new.yml up -d
   # Esperar 90 segundos
   docker exec sigah-backend-dev npx prisma db seed
   ```
5. **Evidencias:** Capturar pantalla de cada caso PASS y FAIL
