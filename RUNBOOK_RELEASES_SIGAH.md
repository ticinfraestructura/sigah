# SIGAH - Runbook de Releases

## 1) Objetivo
Estandarizar el proceso de publicación de cambios para SIGAH con mínima fricción, máxima trazabilidad y sin afectar la aplicación legacy del servidor compartido.

Plantilla oficial de acta post-migración/release:
- `SIGAH_ACTA_VALIDACION_LINUX_POST_MIGRACION_TEMPLATE.md`

---

## 2) Alcance
Aplica a:
- Releases funcionales.
- Hotfixes.
- Actualizaciones de configuración.

No aplica a:
- Cambios de infraestructura fuera del stack SIGAH.
- Modificaciones globales de Nginx/Tomcat no relacionadas con rutas SIGAH.

---

## 3) Precondiciones
- CI verde para commit/tag objetivo.
- Backup previo ejecutado.
- Ventana de cambio autorizada.
- Runbook de migración actualizado.
- Variables de entorno productivas verificadas.

---

## 4) Estrategia de versionado
Formato sugerido:
- `vMAJOR.MINOR.PATCH`

Ejemplos:
- `v1.4.0` (feature release)
- `v1.4.1` (fix)
- `v1.4.2-hotfix.1` (urgente)

---

## 5) Checklist T-1 (día previo)
- [ ] Definir scope exacto de release.
- [ ] Confirmar riesgos y plan de rollback.
- [ ] Ejecutar validación Windows pre-migración.
- [ ] Confirmar estado de notificaciones (Telegram/WhatsApp).
- [ ] Preparar nota de release.

---

## 6) Proceso T0 (ejecución release)
## 6.1 Congelamiento corto
- Pausar merges durante ventana de deploy.

## 6.2 Snapshot inicial
```bash
cd /opt/sigah
docker compose -f docker-compose.subfolder.yml ps > release_pre_ps.txt
docker network ls > release_pre_networks.txt
```

## 6.3 Backup
```bash
cd /opt/sigah
chmod +x scripts/recovery.sh
./scripts/recovery.sh backup
```

## 6.4 Deploy de SIGAH (servidor compartido)
```bash
cd /opt/sigah
git fetch --all --tags
git checkout <tag_o_commit_aprobado>
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

## 6.5 Health checks
```bash
docker compose -f docker-compose.subfolder.yml ps
curl -f https://dominio.com/sigah-api/health
curl -I https://dominio.com/sigah/
```

---

## 7) Smoke test T0 (post-deploy)
Orden recomendado:
1. Login.
2. Módulo notificaciones carga.
3. `GET /api/whatsapp-notifications/status`.
4. `POST /api/whatsapp-notifications/telegram/test`.
5. `send` individual.
6. `send-bulk` mixto.

Criterio de éxito:
- Todo OK sin error bloqueante.

---

## 8) Rollback operativo
Disparadores:
- Healthcheck caído > 5 min.
- Login fallando.
- Errores severos en flujo crítico.

Rollback:
```bash
cd /opt/sigah
git checkout <tag_estable_anterior>
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

Si hubo impacto de datos:
```bash
./scripts/recovery.sh restore /opt/sigah/backups/<backup>.tar.gz
```

---

## 9) T+1 (estabilización)
- [ ] Monitorear logs backend/frontend por 30-60 min.
- [ ] Confirmar que rutas legacy (Tomcat) siguen intactas.
- [ ] Confirmar métricas/health sin degradación.
- [ ] Cerrar acta de release con evidencia.

---

## 10) Plantilla de acta de release
```text
Release: vX.Y.Z
Fecha/Hora:
Operador:
Commit/Tag:

Pre-check:
- Backup: OK/FAIL
- CI: OK/FAIL

Deploy:
- Comando ejecutado:
- Resultado:

Health checks:
- /sigah/: OK/FAIL
- /sigah-api/health: OK/FAIL

Smoke:
- Login: OK/FAIL
- Notificaciones: OK/FAIL
- Telegram test: OK/FAIL
- send/send-bulk: OK/FAIL

Rollback requerido: SI/NO
Detalle de incidencias:
Conclusión final:
```

---

## 11) Reglas de seguridad operativa
- No ejecutar comandos globales destructivos en servidor compartido.
- No tocar `location /` de Nginx legacy.
- No compartir secretos en tickets/chats.
- Registrar toda ejecución con hora y responsable.

---

## 12) Comandos prohibidos (recordatorio)
- `docker system prune -a`
- `docker network prune`
- `docker volume prune`
- `docker stop $(docker ps -q)`
- `docker rm -f $(docker ps -aq)`

Si se requiere limpieza, hacerla solo sobre recursos SIGAH (`sigah-*`).
