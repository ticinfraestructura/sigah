# SIGAH - Runbook de Soporte y Migración a Linux (Docker + red propia)

## 1) Objetivo
Este runbook deja documentado el procedimiento operativo para:
- Soporte diario de SIGAH.
- Diagnóstico rápido de incidentes (backend, frontend, DB, notificaciones).
- Migración controlada desde entorno Windows (desarrollo) a Linux (operación con contenedores y redes Docker propias).

Principio rector en servidor compartido:
- SIGAH se despliega como stack aislado.
- No se detiene, recrea, renombra ni reconfigura la aplicación Tomcat existente.
- No se ejecutan acciones globales de Docker que puedan afectar contenedores ajenos.

---

## 2) Estado base actual (origen Windows)
Entorno de trabajo actual:
- OS: Windows.
- Desarrollo local con Docker Compose (`docker-compose.dev.new.yml`).
- Backend, frontend, PostgreSQL y Redis ya validados.
- Telegram operativo en modo real en backend (token válido, prueba real ejecutada).

Documentos relacionados:
- `SIGAH_WHATSAPP_ALTA_CELULAR_Y_TRAZABILIDAD.md`
- `DEPLOYMENT_FINAL_SIGAH.md`
- `DEPLOYMENT_SUBFOLDER.md`
- `DEPLOYMENT_FULL_DOCKER.md`
- `SIGAH_CIERRE_SESION_2026-04-05.md`

---

## 3) Topología objetivo en Linux
Arquitectura recomendada en servidor compartido (sin tocar Tomcat existente):
- Nginx existente del servidor mantiene control de `80/443`.
- Stack SIGAH aislado:
  - `sigah-frontend`
  - `sigah-backend`
  - `sigah-db` (PostgreSQL)
  - `sigah-redis`
- Integración por ruta (`/sigah` y `/sigah-api`) en Nginx, sin modificar contenedores Tomcat.

Arquitectura alternativa (solo servidor dedicado para SIGAH):
- `sigah-nginx-proxy` (80/443)
- `sigah-frontend`
- `sigah-backend`
- `sigah-db`
- `sigah-redis`

Redes Docker:
- `sigah-network` (aislada para stack SIGAH)
- `tomcat-network` (solo si se integra app legacy/Tomcat)

Compose recomendado para migración productiva:
- `docker-compose.subfolder.yml`

Alternativa full-docker:
- `docker-compose.full-docker.yml`

### 3.1 Nomenclatura estratégica (obligatoria)
Convenciones para evitar colisiones con otros sistemas del host:
- Proyecto Docker: `sigah-prod` (usar `COMPOSE_PROJECT_NAME=sigah-prod`).
- Redes: `sigah-network`, `tomcat-network`.
- Volúmenes: prefijo `sigah-`.
- Contenedores SIGAH: prefijo `sigah-`.

Activos protegidos (no tocar):
- Contenedores Tomcat existentes.
- Redes no relacionadas con SIGAH.
- Configuración global de Nginx fuera de bloques/rutas de SIGAH.

---

## 4) Prerrequisitos Linux
En el host Linux:
1. Docker Engine instalado y activo.
2. Plugin Compose (`docker compose`) o binario clásico (`docker-compose`).
3. Usuario operador en grupo `docker`.
4. Puertos abiertos: `80`, `443` (y administrativos si aplica).
5. DNS del dominio apuntando al host.
6. Certificados SSL disponibles en `nginx/ssl`.
7. Inventario inicial de contenedores/redes actuales documentado antes de cambios.

Comandos de verificación:
```bash
docker --version
docker compose version || docker-compose --version
sudo systemctl status docker
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
docker network ls
```

---

## 5) Estructura de directorios Linux recomendada
```bash
sudo mkdir -p /opt/sigah
sudo chown -R $USER:$USER /opt/sigah
cd /opt/sigah
```

Dentro de `/opt/sigah`:
- código del repo SIGAH
- `nginx/ssl`
- `backups/`
- `logs/`

Si usas recovery script:
- `/opt/sigah/data/{postgres,redis,uploads}`
- `/opt/sigah/backups/{postgres,redis,config}`

---

## 6) Variables de entorno críticas
### 6.1 Archivo efectivo
- En runtime local/dev: `backend/.env`
- En migración Linux/prod: usar `.env` real del entorno (no usar `*.example` como runtime)

### 6.2 Variables mínimas
```env
DB_PASSWORD=<seguro>
JWT_SECRET=<minimo 32 chars>
ALLOWED_ORIGINS=https://dominio.com,https://dominio.com/sigah

# Telegram (operación real/fallback)
TELEGRAM_BOT_TOKEN=<token_botfather>

# WhatsApp (si canal real oficial)
WHATSAPP_PHONE_ID=<phone_id>
WHATSAPP_ACCESS_TOKEN=<access_token>
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

Notas:
- Si cambia cualquier token, recrear backend.
- Nunca guardar secretos en `*.example` pensando que eso activa runtime.

---

## 7) Migración Windows -> Linux (paso a paso)
## 7.1 Preparación en Windows (origen)
1. Confirmar estado verde:
   - build backend/frontend OK
   - pruebas notificaciones OK
2. Consolidar documentación de sesión y evidencias.
3. Exportar/respaldar base de datos si se requiere trasladar data.

## 7.2 Preparación en Linux (destino)
1. Clonar repo en `/opt/sigah`.
2. Crear `.env` de producción.
3. Cargar certificados SSL.
4. Crear redes Docker:
```bash
docker network create sigah-network --subnet 172.20.0.0/16 || true
docker network create tomcat-network --subnet 172.21.0.0/16 || true
```

5. Definir proyecto aislado SIGAH:
```bash
export COMPOSE_PROJECT_NAME=sigah-prod
```

6. Registrar snapshot pre-migración (obligatorio):
```bash
docker ps --format "table {{.Names}}\t{{.Status}}" > /opt/sigah/migration_precheck_containers.txt
docker network ls > /opt/sigah/migration_precheck_networks.txt
```

## 7.3 Levantar stack
```bash
# Modo servidor compartido (recomendado): no levantar nginx-proxy SIGAH
docker compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend

# Solo en servidor dedicado SIGAH:
# docker compose -f docker-compose.subfolder.yml up -d --build

# Compatibilidad binario clásico
# docker-compose -f docker-compose.subfolder.yml up -d --build sigah-db sigah-redis sigah-backend sigah-frontend
```

## 7.4 Validación post-arranque
```bash
docker compose -f docker-compose.subfolder.yml ps
curl -f https://dominio.com/health
curl -f https://dominio.com/health/sigah
curl -f https://dominio.com/sigah-api/health
```

## 7.5 Validación funcional mínima
1. Login de SIGAH.
2. Carga de módulo de notificaciones.
3. `GET /api/whatsapp-notifications/status`.
4. `POST /api/whatsapp-notifications/telegram/test` con `chatId` real.
5. `POST /api/whatsapp-notifications/send` (caso con y sin teléfono).

---

## 8) Runbook de soporte diario (operación)
## 8.1 Arranque/paro
```bash
# Arranque
docker compose -f docker-compose.subfolder.yml up -d sigah-db sigah-redis sigah-backend sigah-frontend

# Estado
docker compose -f docker-compose.subfolder.yml ps

# Logs backend
docker logs -f sigah-backend

# Parada controlada SIGAH
docker compose -f docker-compose.subfolder.yml stop sigah-frontend sigah-backend sigah-redis sigah-db
```

## 8.2 Chequeos rápidos de salud
1. `docker compose ... ps`
2. `curl /health` del proxy y backend.
3. login API (`/api/auth/login`).
4. `GET /api/whatsapp-notifications/status`.

## 8.3 Incidentes frecuentes
### A) Telegram aparece en `simulated`
Causa probable:
- falta `TELEGRAM_BOT_TOKEN` en entorno efectivo.

Acciones:
1. verificar env runtime en contenedor:
```bash
docker exec sigah-backend printenv | grep TELEGRAM_BOT_TOKEN
```
2. corregir `.env`.
3. recrear backend:
```bash
docker compose -f docker-compose.subfolder.yml up -d --force-recreate sigah-backend
```
4. revalidar `GET /api/whatsapp-notifications/status`.

### B) Telegram error `can't parse entities`
Causa probable:
- contenido dinámico sin escape MarkdownV2.

Acción:
- revisar formatter en `backend/src/services/telegram.service.ts`.

### C) WhatsApp no entrega
Revisar:
- `WHATSAPP_PHONE_ID`, `WHATSAPP_ACCESS_TOKEN`
- estado proveedor (`TEXTMEBOT`/API oficial)
- fallback Telegram disponible (`telegramChatId` + token)

### D) API responde intermitente tras cambios
- esperar reinicio `tsx watch` o recrear contenedor backend.
- revisar logs de arranque y healthcheck.

### E) Riesgo de interferencia con Tomcat/Nginx existente
Reglas de contención:
- No ejecutar `docker stop $(docker ps -q)`.
- No ejecutar `docker system prune -a` ni `docker network prune` en servidor compartido.
- No ejecutar `docker compose down` de proyectos que no sean SIGAH.
- Cualquier ajuste en Nginx debe limitarse a bloques de ruta SIGAH (`/sigah`, `/sigah-api`).

---

## 9) Backup, restore y recuperación
Script disponible:
- `scripts/recovery.sh`

Uso típico (Linux):
```bash
chmod +x scripts/recovery.sh
./scripts/recovery.sh status
./scripts/recovery.sh backup
./scripts/recovery.sh restore /opt/sigah/backups/<archivo>.tar.gz
./scripts/recovery.sh disaster
```

Recomendación operativa:
- backup diario DB.
- backup previo obligatorio antes de deploy.
- restauración probada en staging antes de usar en producción.

---

## 10) Checklist de salida para migración
- [ ] Docker/Compose operativos en Linux.
- [ ] Inventario pre-migración guardado (contenedores/redes).
- [ ] Redes `sigah-network` y `tomcat-network` creadas.
- [ ] `.env` productivo con secretos reales.
- [ ] SSL configurado y válido.
- [ ] Stack levantado (`ps` OK).
- [ ] Verificado que contenedores Tomcat preexistentes siguen intactos.
- [ ] Healthchecks OK.
- [ ] Login funcional.
- [ ] Telegram test real OK.
- [ ] Flujo `send`/`send-bulk` validado.
- [ ] Backups y restore documentados/probados.

---

## 11) Comandos prohibidos en servidor compartido
No ejecutar durante la migración/soporte:
- `docker system prune -a`
- `docker network prune`
- `docker volume prune`
- `docker stop $(docker ps -q)`
- `docker rm -f $(docker ps -aq)`

Si se requiere limpieza, hacerla de forma quirúrgica y solo sobre recursos con prefijo `sigah-`.

---

## 12) Evidencia mínima por cambio
Registrar siempre:
1. Fecha/hora.
2. Entorno (dev/staging/prod).
3. Comando ejecutado.
4. Resultado (OK/error).
5. Captura/log o JSON de respuesta.
6. Acción correctiva aplicada.

Formato recomendado para acta de ejecución Linux:
- `SIGAH_ACTA_VALIDACION_LINUX_POST_MIGRACION_TEMPLATE.md`

---

## 13) Nota de seguridad
- No compartir tokens por chat.
- Rotar tokens expuestos (`@BotFather` para Telegram).
- Mantener `.env` fuera de versionado.
- Limitar acceso SSH al host Linux y endurecer firewall.

---

## 14) Plantilla exacta Nginx (servidor compartido con Tomcat)
Usar este bloque en el `server {}` del dominio existente.

Importante:
- Este bloque solo agrega rutas SIGAH.
- No reemplaza ni modifica `location /` de Tomcat.

### 14.1 Si el servidor YA tiene HTTPS y certificado vigente
Aplicar este criterio:
- No crear un nuevo certificado ni un nuevo `server` SSL para SIGAH.
- No modificar `ssl_certificate`, `ssl_certificate_key` ni parámetros TLS existentes.
- Insertar únicamente los `location` de SIGAH dentro del `server` actual que escucha en `443`.
- Mantener intacto el `location /` de la app legacy (Tomcat).

Bloque exacto para pegar dentro de `server { listen 443 ssl; ... }` existente:

```nginx
# SIGAH API por ruta en server HTTPS existente
location ^~ /sigah-api/ {
    rewrite ^/sigah-api/(.*)$ /api/$1 break;

    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# SIGAH Frontend por ruta en server HTTPS existente
location ^~ /sigah/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# Health opcional de SIGAH
location = /health/sigah {
    proxy_pass http://127.0.0.1:3001/api/health;
    proxy_connect_timeout 5s;
    proxy_read_timeout 5s;
}

# NO TOCAR:
# location / { ... proxy_pass http://tomcat_backend ... }
```

Validación para este escenario (HTTPS ya activo):
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://dominio.com/sigah/
curl -I https://dominio.com/sigah-api/health
```

```nginx
# =============================
# SIGAH por rutas en Nginx host
# =============================

# Backend SIGAH API
location ^~ /sigah-api/ {
    rewrite ^/sigah-api/(.*)$ /api/$1 break;

    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# Frontend SIGAH (React)
location ^~ /sigah/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;

    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# Health opcional de SIGAH
location = /health/sigah {
    proxy_pass http://127.0.0.1:3001/api/health;
    proxy_connect_timeout 5s;
    proxy_read_timeout 5s;
}

# IMPORTANTE:
# mantener intacto el bloque de la app legacy
# location / { ... proxy_pass http://tomcat_backend ... }
```

Validación inmediata luego de recargar Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://dominio.com/sigah/
curl -I https://dominio.com/sigah-api/health
```
