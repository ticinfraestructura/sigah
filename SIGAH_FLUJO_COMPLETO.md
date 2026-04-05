# SIGAH - Flujo Completo de Operación (Inicio a Fin)

## Visión General

SIGAH gestiona el ciclo completo de ayudas humanitarias: desde que los productos entran al inventario hasta que se entregan al beneficiario, con trazabilidad total y auditoría en cada paso.

```
 INVENTARIO          SOLICITUD           ENTREGA             CIERRE
 ─────────          ─────────           ───────             ──────
 ┌──────────┐      ┌──────────┐       ┌──────────────┐    ┌──────────┐
 │ Crear    │      │ Registrar│       │ Crear entrega│    │ Entregado│
 │ Productos│─────▶│ Solicitud│──────▶│ (6 pasos)    │───▶│ al       │
 │ + Lotes  │      │ + Aprobar│       │              │    │ benefic. │
 └──────────┘      └──────────┘       └──────────────┘    └──────────┘
       │                                     │                  │
       ▼                                     ▼                  ▼
 ┌──────────┐                         ┌──────────┐       ┌──────────┐
 │ Stock    │                         │ Descuento│       │Devolución│
 │ Movements│                         │ FEFO auto│       │ (si hay) │
 │ (audit)  │                         │ (audit)  │       │ (audit)  │
 └──────────┘                         └──────────┘       └──────────┘
```

---

## FASE 1: GESTIÓN DE INVENTARIO

### 1.1 Crear Categorías
**Quién:** Administrador o Bodega  
**Dónde:** Módulo Inventario → Categorías

Las categorías organizan los productos. El seed crea 6:
- Alimentos, Aseo Personal, Aseo Hogar, Ropa, Medicamentos, Emergencia

### 1.2 Crear Productos
**Quién:** Administrador o Bodega  
**Dónde:** Módulo Inventario → Productos → Crear

Cada producto requiere:
- **Código único** (ej: `ALI-001`)
- **Nombre** (ej: "Arroz 1kg")
- **Categoría** (seleccionar de la lista)
- **Unidad** (KG, UNIT, PACK, LITER)
- **¿Es perecedero?** (si/no) — determina si requiere fecha de vencimiento
- **Stock mínimo** — alerta cuando el inventario baja de este nivel

**Auditoría generada:** `Product CREATE` — registra quién creó, cuándo, todos los campos.

### 1.3 Registrar Entrada de Inventario (Lotes)
**Quién:** Administrador o Bodega  
**Dónde:** Inventario → Producto → Agregar Lote

Cada entrada de stock crea un **lote** con:
- **Número de lote** (ej: `LOT-2024-001`)
- **Cantidad** 
- **Fecha de vencimiento** (obligatoria si el producto es perecedero)

**Auditoría generada:**
- `INVENTORY_ENTRY CREATE` — registra producto, lote, cantidad, quién ingresó
- `StockMovement` tipo `ENTRY` — rastrea el movimiento de stock

### 1.4 Ajustes de Inventario
**Quién:** Administrador o Bodega  
**Dónde:** Inventario → Producto → Ajustar Stock

Permite correcciones (positivas o negativas) con motivo obligatorio.

**Auditoría generada:**
- `INVENTORY_ADJUSTMENT` — registra cantidad antes/después, motivo, quién ajustó
- `StockMovement` tipo `ADJUSTMENT`

### 1.5 Monitoreo Automático
El sistema monitorea automáticamente:
- **Stock bajo** → productos por debajo del mínimo configurado
- **Próximos a vencer** → lotes que vencen en los próximos 30 días (configurable)
- **Estrategia FEFO** (First Expired, First Out) → al despachar, sale primero lo que vence antes

---

## FASE 2: CONFIGURACIÓN DE KITS

### 2.1 Crear Kits
**Quién:** Administrador o Bodega  
**Dónde:** Módulo Kits → Crear

Un kit es una **plantilla de entrega** que agrupa productos con cantidades predefinidas:

| Kit | Contenido |
|---|---|
| **Kit Alimentario Familiar** | Arroz x3, Frijoles x2, Aceite x1, Leche x2, Atún x4 |
| **Kit de Aseo Personal** | Jabón x3, Pasta dental x2, Cepillo x4, Toallas x2 |
| **Kit de Emergencia** | Manta x2, Linterna x1, Botiquín x1 |

Los kits agilizan las solicitudes: en lugar de pedir 5 productos individuales, se pide 1 kit.

---

## FASE 3: REGISTRO DE BENEFICIARIOS

### 3.1 Crear Beneficiario
**Quién:** Administrador u Operador  
**Dónde:** Módulo Beneficiarios → Crear

Datos del beneficiario:
- **Documento** (CC, TI, CE, etc.) — combinación tipo+número es única
- **Nombre completo**
- **Teléfono, dirección, ciudad**
- **Tipo de población:** Desplazado, Vulnerable, Refugiado, Adulto Mayor, etc.
- **Tamaño de familia** — ayuda a dimensionar la ayuda

**Auditoría generada:** `Beneficiary CREATE` — datos completos del registro.

---

## FASE 4: SOLICITUD DE AYUDA (Máquina de Estados)

### 4.1 Crear Solicitud
**Quién:** Administrador, Bodega u Operador  
**Dónde:** Módulo Solicitudes → Crear

Se selecciona:
- **Beneficiario** (debe estar activo)
- **Productos individuales** y/o **Kits** con cantidades
- **Prioridad** (0=Normal, 1=Alta, 2=Urgente)
- **Notas** (contexto de la situación)

Se genera un código único `SOL-2024-XXXXXX` y la solicitud inicia en estado `REGISTERED`.

### 4.2 Flujo de Estados de la Solicitud

```
                    ┌──────────────┐
                    │  REGISTERED  │ ← Estado inicial
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
              ┌─────│  IN_REVIEW   │─────┐
              │     └──────────────┘     │
              │                          │
       ┌──────▼───────┐          ┌──────▼───────┐
       │   APPROVED   │          │   REJECTED   │
       └──────┬───────┘          └──────┬───────┘
              │                         │
              ▼                         │ (puede reactivarse)
     Se crea ENTREGA                   │
              │                         ▼
              ├──────────────┐    REGISTERED (vuelve al inicio)
              │              │
       ┌──────▼───────┐ ┌───▼──────────────┐
       │  DELIVERED   │ │PARTIALLY_DELIVERED│
       └──────────────┘ └──────────────────┘
              
       * Desde cualquier estado (excepto DELIVERED) → CANCELLED
       * CANCELLED puede reactivarse → REGISTERED
```

**Transiciones válidas:**
| Desde | Hacia | Quién |
|---|---|---|
| REGISTERED | IN_REVIEW | Admin/Bodega |
| IN_REVIEW | APPROVED | Admin/Autorizador |
| IN_REVIEW | REJECTED | Admin/Autorizador |
| APPROVED | (se crea entrega) | Admin/Bodega |
| REJECTED | REGISTERED | Admin (reactivar) |
| Cualquiera | CANCELLED | Admin |

**Auditoría generada por cada cambio de estado:**
- `Request STATUS_CHANGE` / `APPROVE` / `REJECT` / `CANCEL` / `REACTIVATE`
- `RequestHistory` — log de transiciones con usuario, fecha, notas

---

## FASE 5: PROCESO DE ENTREGA (6 Pasos con Segregación de Funciones)

Esta es la parte más robusta del sistema. Cada entrega pasa por **6 pasos obligatorios**, y el sistema **impide que la misma persona ejecute pasos consecutivos** (segregación de funciones).

### Paso 1: CREAR ENTREGA
**Quién:** Admin o Bodega  
**Estado:** `PENDING`  
**Qué sucede:**
- Se crea la entrega vinculada a una solicitud aprobada
- Se genera código único `ENT-2024-XXXXXX`
- Se incluyen los productos/kits de la solicitud como `deliveryDetails`

### Paso 2: AUTORIZAR ENTREGA
**Quién:** Admin o Autorizador (NO puede ser quien la creó)  
**Estado:** `PENDING` → `AUTHORIZED`  
**Qué sucede:**
- El autorizador revisa y aprueba la entrega
- Se notifica al personal de bodega
- Se registra quién autorizó y cuándo

### Paso 3: RECIBIR EN BODEGA
**Quién:** Admin o Bodega (NO puede ser quien autorizó)  
**Estado:** `AUTHORIZED` → `RECEIVED_WAREHOUSE`  
**Qué sucede:**
- Bodega confirma recepción de la orden de entrega
- Se registra el usuario de bodega responsable

### Paso 4: PREPARAR ENTREGA
**Quién:** Admin o Bodega  
**Estado:** `RECEIVED_WAREHOUSE` → `IN_PREPARATION`  
**Qué sucede:**
- Bodega inicia la preparación física (empacar productos)
- Se registra quién prepara y cuándo

### Paso 5: MARCAR COMO LISTA (⚠️ Descuenta inventario)
**Quién:** Admin o Bodega  
**Estado:** `IN_PREPARATION` → `READY`  
**Qué sucede (CRÍTICO):**
- **Se descuenta automáticamente el inventario usando FEFO:**
  - Para cada producto: busca los lotes que vencen primero
  - Descuenta de esos lotes las cantidades
  - Si no hay suficiente stock → ERROR, no se puede marcar como lista
- Se crean `StockMovement` tipo `EXIT` por cada descuento
- Se asigna el lote específico a cada detalle de la entrega (trazabilidad)
- Se notifica a los despachadores que hay una entrega lista

### Paso 6: CONFIRMAR ENTREGA AL BENEFICIARIO
**Quién:** Admin o Despachador (NO puede ser quien preparó)  
**Estado:** `READY` → `DELIVERED`  
**Qué sucede:**
- Se registra: nombre del receptor, documento, firma
- Se actualizan las cantidades entregadas en la solicitud
- El sistema evalúa si la solicitud está completa:
  - **Todo entregado** → Solicitud cambia a `DELIVERED`
  - **Parcial** → Solicitud cambia a `PARTIALLY_DELIVERED`
- Fecha y hora de entrega registradas

### Flujo completo de estados de la entrega:

```
PENDING → AUTHORIZED → RECEIVED_WAREHOUSE → IN_PREPARATION → READY → DELIVERED
                                                                         │
                                            ←── CANCELLED ──── (desde cualquiera excepto DELIVERED)
```

### Cancelación de Entrega
**Quién:** Admin  
**Qué sucede:**
- Si la entrega ya estaba en `READY` (inventario descontado) → **se devuelve el stock automáticamente**
- Se registra motivo obligatorio
- Se crean `StockMovement` tipo `RETURN` por cada reposición

---

## FASE 6: DEVOLUCIONES (Post-entrega)

### 6.1 Crear Devolución
**Quién:** Admin o Bodega  
**Dónde:** Módulo Devoluciones → Crear

Permite registrar productos devueltos después de una entrega:
- **Seleccionar entrega** origen
- **Motivo** de devolución
- **Por cada producto devuelto:**
  - Cantidad
  - **Condición:** `GOOD` (buen estado) o `DAMAGED` (dañado)

**Lógica del sistema:**
- **Condición GOOD** → el stock se devuelve al lote original (o crea uno nuevo)
  - Se crea `StockMovement` tipo `RETURN`
- **Condición DAMAGED** → NO se devuelve al inventario (se registra como pérdida)

**Auditoría generada:** `Return CREATE` — todos los detalles de la devolución.

---

## AUDITORÍA Y TRAZABILIDAD

### ¿Qué se audita?

| Entidad | Acciones auditadas |
|---|---|
| Product | CREATE, UPDATE, DELETE |
| ProductLot | CREATE, UPDATE (ajustes) |
| Beneficiary | CREATE, UPDATE |
| Request | CREATE, UPDATE, STATUS_CHANGE, APPROVE, REJECT, CANCEL, REACTIVATE |
| Delivery | CREATE, UPDATE (cada cambio de estado) |
| Return | CREATE |
| Inventory | ENTRY, ADJUSTMENT (con antes/después) |

### Estructura de un registro de auditoría

```json
{
  "entity": "Delivery",
  "entityId": "uuid-de-la-entrega",
  "action": "UPDATE",
  "userId": "uuid-del-usuario",
  "oldValues": { "status": "IN_PREPARATION" },
  "newValues": { "status": "READY" },
  "createdAt": "2024-03-28T12:30:00Z"
}
```

### Consultas de auditoría disponibles

| Endpoint | Descripción |
|---|---|
| `GET /api/audit/entity/:entity/:id` | Historial completo de una entidad |
| `GET /api/audit/search` | Buscar logs por entidad, usuario, acción, fechas |
| `GET /api/audit/stats` | Estadísticas de actividad |
| `GET /api/audit/compare?id1=&id2=` | Comparar dos versiones |
| `GET /api/audit/export` | Exportar a CSV |

### Stock Movements (Movimientos de Inventario)

Todo movimiento de stock queda registrado:

| Tipo | Cuándo se genera |
|---|---|
| `ENTRY` | Ingreso de inventario (nuevo lote) |
| `EXIT` | Descuento por entrega (paso 5: READY) |
| `ADJUSTMENT` | Ajuste manual de stock |
| `RETURN` | Devolución post-entrega o cancelación de entrega |

Cada movimiento incluye: producto, lote, cantidad, motivo, referencia, usuario, fecha.

---

## ROLES Y SEGREGACIÓN DE FUNCIONES

```
┌─────────────────────────────────────────────────────────┐
│                    ADMINISTRADOR                         │
│  Puede hacer todo. Supervisión total.                   │
├─────────────────────────────────────────────────────────┤
│ OPERADOR        │ AUTORIZADOR    │ BODEGA              │
│ - Beneficiarios │ - Aprobar sol. │ - Inventario        │
│ - Solicitudes   │ - Autorizar    │ - Kits              │
│ - Crear entrega │   entregas     │ - Preparar entregas │
│                 │                │ - Devoluciones       │
├─────────────────┼────────────────┼─────────────────────┤
│          DESPACHADOR             │    CONSULTA          │
│ - Entregar al beneficiario      │ - Solo lectura       │
│ - Registrar recepción           │ - Ver reportes       │
└──────────────────────────────────┴─────────────────────┘
```

**Segregación de funciones en entregas:**
- Quien **crea** la entrega NO puede **autorizarla**
- Quien **autoriza** NO puede **recibir en bodega**
- Quien **prepara** NO puede **entregar al beneficiario**

Esto previene fraude y garantiza control cruzado.

---

## EJEMPLO COMPLETO: De Inicio a Fin

### Escenario: Familia desplazada necesita ayuda alimentaria

**1. Bodega registra productos** (si no existen)
   - Arroz 1kg (ALI-001), Frijoles (ALI-002), etc.
   - Ingresa 100 unidades de cada uno → `StockMovement ENTRY`

**2. Operador registra al beneficiario**
   - Carlos García, CC 1234567890, familia de 4, población DISPLACED
   - → `AuditLog: Beneficiary CREATE`

**3. Operador crea solicitud SOL-2024-ABC123**
   - Beneficiario: Carlos García
   - Kit Alimentario x1, Kit Aseo x1
   - Prioridad: Alta
   - → Estado: `REGISTERED`, `AuditLog: Request CREATE`

**4. Autorizador revisa y aprueba**
   - REGISTERED → IN_REVIEW → APPROVED
   - → `AuditLog: Request APPROVE`

**5. Bodega crea entrega ENT-2024-XYZ789**
   - Vinculada a SOL-2024-ABC123
   - → Estado: `PENDING`, `AuditLog: Delivery CREATE`

**6. Autorizador autoriza la entrega**
   - PENDING → AUTHORIZED
   - → Notificación a Bodega

**7. Bodega recibe la orden**
   - AUTHORIZED → RECEIVED_WAREHOUSE

**8. Bodega prepara los paquetes**
   - RECEIVED_WAREHOUSE → IN_PREPARATION

**9. Bodega marca como lista**
   - IN_PREPARATION → READY
   - ⚠️ **Inventario descontado automáticamente (FEFO):**
     - Arroz: Lote LOT-001 → -3 unidades
     - Frijoles: Lote LOT-002 → -2 unidades
     - (etc. para todos los productos del kit)
   - → `StockMovement EXIT` por cada producto
   - → Notificación a Despachadores

**10. Despachador entrega al beneficiario**
   - READY → DELIVERED
   - Receptor: Carlos García, CC 1234567890
   - Solicitud: APPROVED → DELIVERED (todo entregado)
   - → `AuditLog: Delivery UPDATE`, `Request DELIVER`

**Resultado final:**
- ✅ Beneficiario recibió su ayuda
- ✅ Inventario actualizado automáticamente
- ✅ 6 personas participaron (segregación)
- ✅ Trazabilidad completa: quién hizo qué, cuándo, con qué lotes
- ✅ Auditoría exportable a CSV
