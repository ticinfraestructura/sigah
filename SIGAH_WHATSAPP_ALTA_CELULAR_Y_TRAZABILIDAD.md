# SIGAH - WhatsApp: Alta de Celular, Pruebas Reales y Trazabilidad

## 1) Propósito
Establecer un proceso único y obligatorio para registrar números celulares en SIGAH, validar conectividad con proveedor de WhatsApp y asegurar trazabilidad/auditoría cuando ocurra un error.

---

## 2) Causa raíz del incidente observado
En la bitácora del backend se evidenció:
- Modo `simulated` por ausencia de `WHATSAPP_PHONE_ID` y/o `WHATSAPP_ACCESS_TOKEN`.
- Usuario administrador con `whatsappApiKey` configurada, pero número desconectado en TextMeBot.
- Resultado funcional: la notificación se registra internamente, pero no llega al celular.

Conclusión: no fue falla de botón, sino de configuración/proveedor.

---

## 3) Reglas de registro de celular (obligatorias)
Desde esta versión, el backend valida estrictamente:
- Formato aceptado: internacional, ejemplo `+573001234567`.
- También se admiten dígitos sin separadores (`573001234567`), pero se recomienda `+`.
- Longitud válida: 10 a 15 dígitos.
- Campos vacíos (`phone`, `whatsappApiKey`, `telegramChatId`) se normalizan a `null`.

Si el número no cumple, SIGAH rechaza el guardado con mensaje claro de validación.

---

## 4) Procedimiento estándar para alta de número celular

### Paso 1: Registrar número en usuario
Ruta funcional:
- `Gestión de Usuarios` -> editar usuario -> campo `Celular (WhatsApp)`.

Formato recomendado:
- `+57XXXXXXXXXX` (Colombia)

### Paso 2: Definir proveedor de envío
SIGAH usa esta prioridad:
1. `whatsappApiKey` del usuario (TextMeBot)
2. API oficial de Meta (`WHATSAPP_PHONE_ID` + `WHATSAPP_ACCESS_TOKEN`)
3. Simulación (si no hay proveedor real)

### Paso 3A: Si se usa TextMeBot
1. Activar número en TextMeBot según instrucciones oficiales.
2. Validar conexión:
   - `https://api.textmebot.com/status.php?apikey=TU_API_KEY`
3. Guardar `whatsappApiKey` en el usuario.

### Paso 3B: Si se usa Meta (producción recomendada)
Configurar en `backend/.env`:
- `WHATSAPP_PHONE_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_API_URL` (opcional; default Graph API)

Reiniciar backend después de cambios.

---

## 5) Validación operativa obligatoria (checklist)

### 5.1 Estado y checklist
- GET `/api/whatsapp-notifications/status`
- GET `/api/whatsapp-notifications/checklist`

Esperado en producción real:
- `mode = real`
- `officialApiReady = true`
- `blockingItems = []`

### 5.2 Prueba controlada
- POST `/api/whatsapp-notifications/test` con número real del operador.
- POST `/api/whatsapp-notifications/telegram/test` con `chatId` real.

### 5.3 Prueba funcional de negocio
- POST `/api/whatsapp-notifications/send` (usuario con teléfono)
- POST `/api/whatsapp-notifications/send-bulk` (mix de usuarios)

Esperado:
- Confirmar recepción en celular.
- Confirmar código de trazabilidad e identificación de proveedor.

### 5.5 Evidencia validada (2026-04-05)
- Token Telegram válido con `getMe` (`@sigah_notif_bot`).
- Estado operativo Telegram: `botConfigured=true`, `mode=real`.
- `chatId` validado por `getUpdates`.
- Prueba real `POST /api/whatsapp-notifications/telegram/test` exitosa:
  - `success=true`
  - `simulated=false`
  - `operational=true`
  - `messageId` entregado por Telegram.
- Prueba de negocio `POST /api/whatsapp-notifications/send`:
  - caso 1: envío real por proveedor WhatsApp disponible (`TEXTMEBOT`).
  - caso 2: usuario sin teléfono + `telegramChatId` -> fallback Telegram exitoso (`telegram.sent=true`).
- Prueba masiva `POST /api/whatsapp-notifications/send-bulk` (2 destinatarios mixtos):
  - `sent=2`, `whatsappSent=1`.
  - destinatario con teléfono: WhatsApp real (`provider=TEXTMEBOT`).
  - destinatario sin teléfono: fallback Telegram real (`telegramSent=true`, `fallbackUsed=true`).

---

## 5.4 Operación sin costo (recomendada cuando no hay proveedor pago)
- Mantener WhatsApp en modo `simulated` (sin `WHATSAPP_PHONE_ID` y `WHATSAPP_ACCESS_TOKEN`).
- Configurar `TELEGRAM_BOT_TOKEN`.
- Registrar `telegramChatId` en usuarios destino.
- SIGAH aplicará fallback automático a Telegram cuando WhatsApp no se envíe en modo real.

Condición para fallback real de Telegram:
1. Usuario inició conversación con el bot (`/start`).
2. `telegramChatId` guardado en SIGAH.
3. `TELEGRAM_BOT_TOKEN` válido en backend.

---

## 6) Qué revisar si no llega el mensaje

## 6.1 Indicadores en UI
- Modo `simulado` visible en módulo de notificaciones.
- Mensaje de resultado con estado real/simulado y proveedor.
- Código de trazabilidad (`code`) disponible para copiar.
- Filtro `Solo con error WhatsApp` para incidentes.

### 6.2 Indicadores en backend
- `provider`: `TEXTMEBOT` o `WHATSAPP_API` o `SIMULATED`
- `simulated`: `true/false`
- `whatsappError`: mensaje amigable con causa probable.
- `channel`: `TELEGRAM` cuando se activa fallback exitoso.

### 6.3 Errores típicos y acción
- `Faltan WHATSAPP_PHONE_ID o WHATSAPP_ACCESS_TOKEN`:
  - completar variables `.env` y reiniciar backend.
- `disconnected from the api` (TextMeBot):
  - reconectar número en `status.php?apikey=...`.
- `fetch failed`:
  - revisar salida a Internet/firewall/proxy/estado proveedor.
- token inválido:
  - renovar `WHATSAPP_ACCESS_TOKEN`.
- Telegram no entrega (`chat not found` / `bot was blocked`):
  - pedir al usuario enviar `/start` al bot y validar `telegramChatId`.
- Telegram `can't parse entities`:
  - revisar escape MarkdownV2 en contenido dinámico (fecha/hora, símbolos reservados).

### 6.4 Error operativo común de configuración
- Síntoma: API indica `Falta TELEGRAM_BOT_TOKEN` aun cuando se editó archivo de ejemplo.
- Causa: modificar `backend/.env.production.example` no afecta runtime local.
- Corrección:
  1. Configurar `TELEGRAM_BOT_TOKEN` en `backend/.env` (entorno dev real).
  2. Reiniciar backend (`docker compose -f docker-compose.dev.new.yml up -d --force-recreate sigah-backend-dev`).
  3. Revalidar con `GET /api/whatsapp-notifications/status`.

---

## 7) Estándar de auditoría recomendado
Por cada incidente o prueba real, registrar:
1. Fecha/hora.
2. Usuario destino y número.
3. Endpoint usado (`test`, `send`, `send-bulk`).
4. `notification.code` (trazabilidad).
5. `provider`, `simulated`, `whatsappError`.
6. Resultado real de recepción en dispositivo.
7. Acción correctiva aplicada.

---

## 8) Criterio de “listo para producción”
Solo declarar OK producción si se cumple todo:
- `status/checklist` en modo `real` sin bloqueos.
- Prueba `test` recibida en celular real.
- Prueba `send` y `send-bulk` con recepción confirmada.
- Sin errores críticos en bitácora durante 24h de observación operativa.

Alternativa sin costo aprobable:
- WhatsApp en `simulated` + Telegram operativo con fallback validado en `send` y `send-bulk`.
- Evidencia de recepción real por Telegram para usuarios críticos.
- Trazabilidad completa (`code`, `channel`, `whatsappError`) en historial.

---

## 9) Nota operativa
Este documento es obligatorio para onboarding de cualquier nuevo número celular que reciba notificaciones SIGAH.
