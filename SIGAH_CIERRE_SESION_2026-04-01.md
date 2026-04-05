# SIGAH - Cierre de sesión técnica 2026-04-01

## 1) Objetivo del tramo
Dejar el módulo de notificaciones resiliente sin depender de proveedor pago inmediato, mejorar trazabilidad y dejar entorno listo para retomar sin pérdida de contexto.

---

## 2) Cambios implementados

### 2.1 Toggle de modo WhatsApp (simulado/real)
Se implementó control de modo runtime para WhatsApp con endpoint y UI:
- Modo runtime soportado: `auto | simulated | real`.
- Modo efectivo calculado: `real | simulated` según credenciales disponibles.
- Salvaguarda: si se solicita `real` sin credenciales válidas, el sistema cae a modo simulado y lo informa.

Archivos impactados:
- `backend/src/services/whatsapp.service.ts`
- `backend/src/routes/whatsapp-notification.routes.ts`
- `backend/src/middleware/validation.middleware.ts`
- `frontend/src/pages/SendNotifications.tsx`
- `frontend/src/pages/NotificationsManagement.tsx`

### 2.2 Endurecimiento de validación de usuarios (canales)
Se reforzó validación y normalización para evitar fallos por datos mal cargados:
- `phone`: validación internacional (10-15 dígitos, permite `+`).
- Limpieza de caracteres (`espacios`, `-`, `(`, `)`).
- Campos vacíos normalizados a `null` (`phone`, `whatsappApiKey`, `telegramChatId`).

Archivo impactado:
- `backend/src/middleware/validation.middleware.ts`

### 2.3 Fallback automático a Telegram
Se implementó fallback de continuidad:
- En `send`: si WhatsApp no sale en modo real, intenta Telegram si existe `telegramChatId`.
- En `send-bulk`: mismo comportamiento por destinatario.
- Se conserva trazabilidad de canal final y errores combinados.

Archivo impactado:
- `backend/src/routes/whatsapp-notification.routes.ts`

### 2.4 Documentación operativa creada
Se dejó guía formal para onboarding, pruebas y diagnóstico:
- `SIGAH_WHATSAPP_ALTA_CELULAR_Y_TRAZABILIDAD.md`

---

## 3) Validaciones ejecutadas
- Build backend: `npm run build` ✅
- Build frontend: `npm run build` ✅
- Verificación API `/status` y `/checklist` de WhatsApp ✅
- Pruebas de envío controladas (`/test` y `/send`) ejecutadas.

Resultado operativo observado:
- Sin credenciales oficiales (`WHATSAPP_PHONE_ID`, `WHATSAPP_ACCESS_TOKEN`) el sistema opera en `simulated`.
- Con fallback implementado, Telegram puede cubrir continuidad cuando WhatsApp no sea real (si `TELEGRAM_BOT_TOKEN` y `telegramChatId` están configurados).

---

## 4) Estado actual para retomar
### Completado
- Toggle runtime WhatsApp funcional.
- Validaciones de alta endurecidas.
- Fallback a Telegram en envío individual y masivo.
- Documentación de proceso y trazabilidad.

### Pendiente para operación real WhatsApp
- Configurar en `backend/.env`:
  - `WHATSAPP_PHONE_ID`
  - `WHATSAPP_ACCESS_TOKEN`
- Reiniciar backend y ejecutar prueba real.

### Pendiente para operación real Telegram fallback
- Configurar en `backend/.env`:
  - `TELEGRAM_BOT_TOKEN`
- Registrar `telegramChatId` en usuarios destino.
- Usuario iniciar bot con `/start`.

---

## 5) Recomendación para próximo inicio
Al retomar:
1. Levantar entorno Docker.
2. Verificar `/api/whatsapp-notifications/status`.
3. Ejecutar prueba controlada de notificaciones.
4. Confirmar recepción en canal real disponible.

---

## 6) Nota de seguridad
No publicar ni compartir tokens de proveedor en chats/historial. Si un token se expone, revocar y regenerar.
