#!/usr/bin/env bash
set -euo pipefail

cd /opt/sigah

export COMPOSE_PROJECT_NAME=sigah
F="-f docker-compose.subfolder.yml"

# Alinear código (si no hay conectividad a Git, continúa con lo local)
git fetch --prune origin || true
git checkout main || true
git pull --ff-only origin main || true

# Evitar conflicto con proxy principal que ya usa 80/443
docker rm -f sigah-nginx-proxy >/dev/null 2>&1 || true

# Levantar servicios SIGAH
docker compose -p sigah $F up -d sigah-db sigah-redis
docker compose -p sigah $F up -d --build --force-recreate sigah-backend sigah-frontend

# Conectar proxy existente a la red de SIGAH
docker network connect sigah-network rp-nginx >/dev/null 2>&1 || true

# Resumen de estado
docker compose -p sigah $F ps
