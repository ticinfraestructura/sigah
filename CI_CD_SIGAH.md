# SIGAH - Guía CI/CD

## 1) Objetivo
Definir un proceso de integración y despliegue continuo simple, documentado y seguro para actualizar SIGAH sin afectar la aplicación legacy (Tomcat) en servidor compartido.

---

## 2) Principios
- Aislamiento: CI/CD opera solo sobre recursos SIGAH.
- No intervención: no modifica contenedores/rutas de Tomcat fuera de `/sigah` y `/sigah-api`.
- Repetibilidad: pipeline determinista con checks claros.
- Rollback rápido ante fallas.

---

## 3) Flujo de ramas recomendado
- `main`: rama estable lista para deploy.
- `release/*`: preparación de releases.
- `hotfix/*`: correcciones urgentes.
- `feature/*`: desarrollo.

Regla sugerida:
- Merge a `main` solo con CI verde y revisión aprobada.

---

## 4) Pipeline CI (por PR y por merge a main)
## 4.1 Etapas mínimas
1. Install dependencies.
2. Lint (si aplica en repo).
3. Build backend (`npm run build`).
4. Build frontend (`npm run build`).
5. (Opcional) Tests automatizados disponibles.

## 4.2 Criterio de aprobación
- CI debe terminar en success.
- No warnings críticos de seguridad en código nuevo.

---

## 5) Pipeline CD (main -> entorno destino)
## 5.1 Pre-deploy
- Backup de base de datos.
- Snapshot de estado de contenedores/redes.
- Confirmar ventana de cambio aprobada.

## 5.2 Deploy
Servidor Linux compartido:
```bash
cd /opt/sigah
git pull origin main
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

## 5.3 Post-deploy
```bash
docker compose -f docker-compose.subfolder.yml ps
curl -f https://dominio.com/sigah-api/health
curl -I https://dominio.com/sigah/
```

Validación funcional mínima:
- login
- carga módulo notificaciones
- `status`
- `telegram/test`

---

## 6) Rollback
Condición de rollback:
- Healthcheck falla.
- login no funcional.
- rutas `/sigah` o `/sigah-api` caídas.

Pasos:
1. Restaurar backup DB (si hubo migraciones con impacto).
2. Volver al commit/tag anterior.
3. Rebuild/restart SIGAH.
4. Revalidar health y login.

Ejemplo:
```bash
cd /opt/sigah
git checkout <tag_estable_anterior>
export COMPOSE_PROJECT_NAME=sigah-prod
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

---

## 7) Variables y secretos CI/CD
No versionar secretos.

Secretos mínimos:
- `SSH_HOST`
- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `DEPLOY_PATH` (`/opt/sigah`)
- `JWT_SECRET` (si se inyecta en despliegue)
- `DB_PASSWORD`
- `TELEGRAM_BOT_TOKEN`
- `WHATSAPP_PHONE_ID` / `WHATSAPP_ACCESS_TOKEN` (si aplica)

---

## 8) Seguridad de operación
Prohibido en jobs de CI/CD sobre servidor compartido:
- `docker system prune -a`
- `docker network prune`
- `docker stop $(docker ps -q)`
- cambios de `location /` en Nginx legacy

Solo operar recursos SIGAH (prefijo/nombre `sigah-*`).

---

## 9) Plantilla sugerida (GitHub Actions, referencia)
```yaml
name: SIGAH CI/CD

on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Backend build
        run: |
          cd backend
          npm ci
          npm run build
      - name: Frontend build
        run: |
          cd frontend
          npm ci
          npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: ci
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        run: |
          echo "Configurar despliegue SSH según secretos del repositorio"
```

---

## 10) Checklist de release
- [ ] PR aprobado y CI verde.
- [ ] Backup realizado.
- [ ] Deploy SIGAH ejecutado sin tocar legacy.
- [ ] Health checks OK.
- [ ] Smoke funcional OK.
- [ ] Evidencia registrada.
- [ ] Comunicación de cierre enviada.

---

## 11) Evidencia por ejecución CI/CD
Registrar:
1. Commit/tag desplegado.
2. Hora inicio/fin.
3. Resultado de CI.
4. Resultado de healthchecks.
5. Resultado de smoke funcional.
6. Acción de rollback (si aplicó).
