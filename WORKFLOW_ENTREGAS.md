# Workflow de Entregas SIGAH

## Resumen del Proceso de Entregas

| Paso | Estado | Descripción | Rol Responsable | Impacto en Inventario | Notas |
|------|--------|-------------|-----------------|----------------------|-------|
| **1** | `PENDING_AUTHORIZATION` | Solicitud de entrega creada, esperando autorización | ADMIN, AUTHORIZER | **Sin cambio** | - |
| **2** | `AUTHORIZED` | Entrega autorizada para proceder | AUTHORIZER | **Sin cambio** | El autorizador NO puede ser quien creó la solicitud |
| **3** | `RECEIVED_WAREHOUSE` | Entrega recibida físicamente en bodega | WAREHOUSE | **Sin cambio** | Quien recibe NO puede ser quien autorizó |
| **4** | `IN_PREPARATION` | Bodega está preparando los items | WAREHOUSE | **Sin cambio** | Quien prepara NO puede ser quien autorizó |
| **5** | `READY` | Entrega lista para despacho | WAREHOUSE | **Sin cambio** | Se notifica a despachadores. **NO se descuenta inventario todavía** |
| **6** | `DELIVERED` | Entregado al beneficiario final | DISPATCHER | **↓ Descuenta inventario** | Se aplica FEFO, se registran movimientos EXIT. Quien entrega NO puede ser autorizador ni preparador |
| **X** | `CANCELLED` | Entrega cancelada | ADMIN | **Sin cambio** | Se puede cancelar en cualquier paso anterior a DELIVERED. No hay restauración de inventario porque nunca se descontó |
| **R** | `PENDING_AUTHORIZATION` | **(Reactivada)** Vuelve a flujo de autorización | ADMIN | **Sin cambio** | El mismo admin que canceló (o cualquier admin) puede reactivar la entrega vía `/reactivate` |

## Reglas de Segregación de Funciones

| Acción | Restricción |
|--------|-------------|
| **Autorizar** | El autorizador ≠ quien creó la entrega |
| **Recibir en bodega** | El receptor ≠ quien autorizó |
| **Preparar** | El preparador ≠ quien autorizó |
| **Entregar** | El despachador ≠ quien autorizó, y ≠ quien preparó |

## Estados y Transiciones Válidas

```
PENDING_AUTHORIZATION ──► AUTHORIZED ──► RECEIVED_WAREHOUSE ──► IN_PREPARATION ──► READY ──► DELIVERED
         │                      │                                                           ↑
         │                      └───────────────────────────────────────────────────────────┘
         │                                                           (no se puede cancelar)
         │
         └──────────────────────┴────────────────────────────────────────────────────────► CANCELLED (ADMIN)
                                    │
                                    └──► REACTIVAR ──► PENDING_AUTHORIZATION (ADMIN)
```

| Transición | Endpoint | Rol | Descripción |
|------------|----------|-----|-------------|
| **CANCELLED → PENDING_AUTHORIZATION** | `POST /api/deliveries/:id/reactivate` | ADMIN | Reactiva entrega cancelada, vuelve a pendiente de autorización |
| **READY → DELIVERED** | `POST /api/deliveries/:id/deliver` | DISPATCHER | Confirma entrega al beneficiario, descuenta inventario |

## Inventario - Momento de la Salida

| Momento | Acción |
|---------|--------|
| Al marcar READY | ❌ NO se descuenta inventario |
| Al confirmar DELIVERED | ✅ Se descuenta inventario vía FEFO |
| Al cancelar | ❌ NO hay nada que restaurar (inventario intacto) |

## Códigos de Movimiento de Inventario

| Tipo | Descripción |
|------|-------------|
| `EXIT` | Salida de inventario al entregar al beneficiario |
| `RETURN` | (No se usa actualmente en cancelaciones) |

## Notas para Usuarios

- **El inventario solo se mueve cuando el beneficiario recibe físicamente los productos** (estado DELIVERED)
- **Cancelar una entrega en cualquier paso previo no afecta el inventario** porque nunca se descontó
- **FEFO (First Expired, First Out)** se aplica automáticamente al momento de la entrega final
