# SIGAH - Validación Windows Pre-Migración

## 1) Objetivo
Certificar el entorno Windows como baseline estable antes de migrar a Linux, dejando evidencia reproducible de funcionamiento técnico y funcional.

---

## 2) Alcance
Incluye:
- Backend, frontend y servicios Docker de desarrollo.
- Notificaciones WhatsApp/Telegram (real y fallback).
- Build técnico de backend/frontend.
- Evidencia mínima para go/no-go de migración.

No incluye:
- Ajustes de infraestructura Linux.
- Cambios sobre Tomcat o Nginx productivo.

---

## 3) Pre-check (obligatorio)
- [ ] Docker Desktop iniciado.
- [ ] `backend/.env` presente con variables mínimas.
- [ ] `TELEGRAM_BOT_TOKEN` configurado en `backend/.env`.
- [ ] Usuario de prueba con `telegramChatId` válido.
- [ ] Credenciales de acceso disponibles.

Comandos rápidos:
```powershell
docker compose -f docker-compose.dev.new.yml ps
```

---

## 4) Arranque controlado del entorno
```powershell
docker compose -f docker-compose.dev.new.yml up -d
docker compose -f docker-compose.dev.new.yml ps
```

Esperado:
- `sigah-backend-dev` up
- `sigah-frontend-dev` up
- `sigah-db-dev` healthy
- `sigah-redis-dev` healthy

---

## 5) Validación técnica mínima
## 5.1 Build
```powershell
cd backend
npm run build

cd ..\frontend
npm run build
```

Esperado:
- Ambos builds en OK.

## 5.2 URLs
- [ ] Frontend responde: `http://localhost:3000/sigah/`
- [ ] Backend docs responde: `http://localhost:3001/api/docs`

---

## 6) Validación funcional de notificaciones
## 6.1 Estado operativo
- [ ] `GET /api/whatsapp-notifications/status` devuelve estructura con `whatsapp` y `telegram`.
- [ ] `telegram.mode` esperado:
  - `real` si token válido.
  - `simulated` si token ausente.

## 6.2 Prueba Telegram dedicada
- [ ] `POST /api/whatsapp-notifications/telegram/test` con `chatId` real.

Esperado:
- `success=true`
- `simulated=false`
- `operational=true`
- `messageId` presente

## 6.3 Prueba `send` individual
Caso A (usuario con teléfono):
- [ ] enviar notificación con `sendWhatsApp=true`.
- [ ] verificar proveedor y estado (`TEXTMEBOT` o `WHATSAPP_API` según configuración).

Caso B (usuario sin teléfono + `telegramChatId`):
- [ ] enviar notificación con `sendWhatsApp=true`.
- [ ] verificar fallback Telegram (`telegram.sent=true`).

## 6.4 Prueba `send-bulk` mixta
- [ ] enviar a mínimo 2 destinatarios (uno con teléfono, otro sin teléfono + chatId).

Esperado:
- `sent=total`
- mezcla de `whatsappSent` y `telegramSent/fallbackUsed` según caso.

---

## 7) Verificación de trazabilidad
Por cada prueba, guardar:
- `notification.code`
- `provider`
- `simulated`
- `whatsappError` (si aplica)
- `fallbackUsed` (si aplica)
- hora de ejecución

---

## 8) Prueba de reinicio y estabilidad
```powershell
docker compose -f docker-compose.dev.new.yml down
docker compose -f docker-compose.dev.new.yml up -d
```

Validar nuevamente:
- [ ] login OK
- [ ] módulo notificaciones carga
- [ ] status de canales responde

---

## 9) Criterio Go/No-Go para migración Linux
Go (aprobado) si:
- [ ] Build backend/frontend OK.
- [ ] Pruebas Telegram test + send + send-bulk OK.
- [ ] Evidencias registradas.
- [ ] No hay errores bloqueantes en arranque/reinicio.

No-Go (bloqueado) si:
- [ ] falla build.
- [ ] falla Telegram real sin causa documentada.
- [ ] fallback no entra cuando debe.

---

## 10) Evidencia mínima a adjuntar
1. Captura de `docker compose ... ps`.
2. Captura/JSON de `status`.
3. JSON de `telegram/test`.
4. JSON de `send` (caso A y B).
5. JSON de `send-bulk`.
6. Salida de build backend/frontend.

---

## 11) Cierre de validación
Resultado final:
- [ ] Aprobado para migración Linux.
- [ ] Pendientes abiertos (si existen) documentados con severidad y acción.
