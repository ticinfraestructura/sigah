# SIGAH - Acta de Validación Windows (Pre-Migración)

## Fecha
2026-04-05

## Entorno
- OS: Windows
- Stack: `docker-compose.dev.new.yml`
- Objetivo: validar operación estable y trazable antes de migración Linux

---

## 1) Arranque y salud base
Comandos ejecutados:
```powershell
docker compose -f docker-compose.dev.new.yml up -d
docker compose -f docker-compose.dev.new.yml ps
```

Resultado:
- Contenedores SIGAH levantados.
- Frontend `http://localhost:3000/sigah/` -> `200`.
- Login backend `/api/auth/login` -> `success=true`.

---

## 2) Pruebas iniciales de notificaciones
### 2.1 Status de canales
Resultado:
- `whatsapp.mode=simulated` (esperado en entorno sin credenciales oficiales).
- `telegram.mode=real`.

### 2.2 Telegram test dedicado
Endpoint:
- `POST /api/whatsapp-notifications/telegram/test`

Resultado:
- `success=true`
- `simulated=false`
- `operational=true`
- `messageId=15`

### 2.3 Send-bulk mixto
Resultado:
- `total=2`, `sent=2`, `whatsappSent=1`
- caso teléfono: WhatsApp real (`provider=TEXTMEBOT`)
- caso sin teléfono: fallback Telegram (`telegramSent=true`, `fallbackUsed=true`)

---

## 3) Ronda adicional solicitada (3 puntos)
## 3.1 Send individual caso A/B
### Caso A (usuario con teléfono)
- `code=SIGAH-MNLKE5G5-85E7`
- WhatsApp: `sent=true`, `provider=TEXTMEBOT`, `simulated=false`
- Telegram: `sent=false`

### Caso B (usuario sin teléfono + chatId)
- `code=SIGAH-MNLKE5Z7-FDF4`
- WhatsApp: `sent=false`, `provider=SIMULATED`
- Telegram: `sent=true`, `messageId=17`

## 3.2 Reinicio completo y revalidación
Comandos ejecutados:
```powershell
docker compose -f docker-compose.dev.new.yml down
docker compose -f docker-compose.dev.new.yml up -d
```

Hallazgo:
- Se observó falla transitoria de red al descargar `openssl` (Alpine DNS), recuperada en reintento.

Revalidación posterior:
- Login backend: `success=true`
- `GET /api/whatsapp-notifications/status`: OK
- `POST /api/whatsapp-notifications/telegram/test`: OK (`messageId=18`, `operational=true`)

## 3.3 Consolidación documental
- Validación incorporada en esta acta.
- Referencias de soporte/migración/CI-CD ya creadas en:
  - `SIGAH_VALIDACION_WINDOWS_PRE_MIGRACION.md`
  - `SIGAH_RUNBOOK_SOPORTE_Y_MIGRACION_LINUX.md`
  - `CI_CD_SIGAH.md`
  - `RUNBOOK_RELEASES_SIGAH.md`

---

## 4) Conclusión
Resultado de validación Windows pre-migración: **APROBADO**.

Estado final:
- Flujo de notificaciones validado (Telegram real + fallback Telegram).
- Reinicio de stack comprobado.
- Evidencia técnica consolidada para ejecutar migración Linux con menor riesgo.

---

## 5) Pendiente inmediato para Linux
1. Aplicar bloque Nginx por rutas (`/sigah`, `/sigah-api`) en `server 443` existente.
2. Levantar solo stack SIGAH en servidor compartido (sin tocar Tomcat).
3. Ejecutar smoke post-deploy y documentar acta Linux equivalente.
