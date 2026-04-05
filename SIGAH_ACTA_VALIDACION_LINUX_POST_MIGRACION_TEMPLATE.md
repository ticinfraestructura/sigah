# SIGAH - Acta de Validación Linux Post-Migración (Template)

## 1) Datos generales
- Fecha:
- Hora inicio:
- Hora fin:
- Entorno: Linux / Producción
- Operador principal:
- Aprobador negocio/operaciones:
- Ventana de cambio:
- Commit/Tag desplegado:

---

## 2) Contexto de arquitectura
- [ ] Servidor compartido confirmado.
- [ ] Aplicación legacy (Tomcat) identificada y en operación previa.
- [ ] Nginx existente con certificado HTTPS vigente.
- [ ] Integración SIGAH por rutas (`/sigah`, `/sigah-api`) sin modificar `location /` legacy.

Notas:
- Contenedores legacy detectados:
- Bloques Nginx legacy preservados:

---

## 3) Snapshot pre-migración (obligatorio)
Comandos:
```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" > /opt/sigah/migration_precheck_containers.txt
docker network ls > /opt/sigah/migration_precheck_networks.txt
```

Resultado:
- [ ] Snapshot de contenedores generado.
- [ ] Snapshot de redes generado.
- Evidencia adjunta:

---

## 4) Preparación de despliegue
- [ ] Repo actualizado en `/opt/sigah`.
- [ ] `.env` productivo aplicado (no `*.example`).
- [ ] `COMPOSE_PROJECT_NAME=sigah-prod` definido.
- [ ] Backup ejecutado antes del deploy.

Comandos:
```bash
cd /opt/sigah
export COMPOSE_PROJECT_NAME=sigah-prod
chmod +x scripts/recovery.sh
./scripts/recovery.sh backup
```

Resultado/observaciones:

---

## 5) Deploy SIGAH (sin tocar legacy)
Comando ejecutado:
```bash
cd /opt/sigah
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

Resultado:
- [ ] Deploy completado.
- [ ] Sin cambios fuera de recursos `sigah-*`.

---

## 6) Validación Nginx en HTTPS existente
Checklist:
- [ ] Bloques de SIGAH insertados en `server 443` existente.
- [ ] `ssl_certificate` y `ssl_certificate_key` legacy no modificados.
- [ ] `location /` de Tomcat intacto.

Comandos:
```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://dominio.com/sigah/
curl -I https://dominio.com/sigah-api/health
```

Resultado:
- `/sigah/`:
- `/sigah-api/health`:
- `location /` legacy validado:

---

## 7) Health checks post-migración
Comandos:
```bash
docker compose -f docker-compose.subfolder.yml ps
curl -f https://dominio.com/health || true
curl -f https://dominio.com/health/sigah
curl -f https://dominio.com/sigah-api/health
```

Resultado:
- [ ] Contenedores SIGAH healthy/running.
- [ ] Health SIGAH OK.
- [ ] Sin degradación visible en legacy.

---

## 8) Smoke funcional post-migración
## 8.1 Acceso
- [ ] Login en `https://dominio.com/sigah/` OK.
- [ ] Navegación base UI OK.

## 8.2 Notificaciones
- [ ] `GET /api/whatsapp-notifications/status` OK.
- [ ] `POST /api/whatsapp-notifications/telegram/test` OK.
- [ ] `POST /api/whatsapp-notifications/send` caso A (con teléfono) OK.
- [ ] `POST /api/whatsapp-notifications/send` caso B (fallback Telegram) OK.
- [ ] `POST /api/whatsapp-notifications/send-bulk` mixto OK.

Evidencia JSON/capturas:
- status:
- telegram/test:
- send A:
- send B:
- send-bulk:

---

## 9) Verificación de no impacto en legacy
- [ ] URL principal legacy responde como antes.
- [ ] Sesiones/cookies legacy sin regresión visible.
- [ ] Logs Nginx sin errores severos de legacy.

Comandos sugeridos:
```bash
curl -I https://dominio.com/
# validar endpoint funcional legacy (si existe)
# curl -I https://dominio.com/<ruta_legacy_critica>
```

Resultado:

---

## 10) Incidencias y acciones correctivas
| Hora | Incidencia | Severidad | Acción | Estado |
|------|------------|-----------|--------|--------|
|      |            |           |        |        |

---

## 11) Criterio de cierre
Aprobado si:
- [ ] SIGAH operativo por rutas HTTPS.
- [ ] Notificaciones (Telegram/fallback) validadas.
- [ ] Legacy intacto y verificado.
- [ ] Evidencia completa anexada.

Resultado final:
- [ ] APROBADO
- [ ] APROBADO CON OBSERVACIONES
- [ ] NO APROBADO

Observaciones finales:

---

## 12) Plan de rollback (si aplica)
Trigger de rollback:

Pasos ejecutados/planificados:
```bash
cd /opt/sigah
git checkout <tag_estable_anterior>
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
# Si hubo impacto de datos:
# ./scripts/recovery.sh restore /opt/sigah/backups/<archivo>.tar.gz
```

Estado rollback:

---

## 13) Firmas de cierre
- Responsable técnico:
- Responsable operación:
- Responsable funcional/negocio:
