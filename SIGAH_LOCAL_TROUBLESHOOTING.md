# SIGAH - Troubleshooting Local

## Problema 1: Docker no responde

**Síntoma:** `failed to connect to the docker API ... dockerDesktopLinuxEngine`

**Solución:**
1. Abrir Docker Desktop y esperar a que diga **"Running"**
2. Verificar modo Linux containers (clic derecho en ícono bandeja → "Switch to Linux containers")
3. Verificar: `docker info` debe mostrar `OSType: linux`

---

## Problema 2: Backend no arranca (puerto 3001 no responde)

**Síntoma:** `curl: (52) Empty reply from server` en `localhost:3001`

**Diagnóstico:**
```powershell
docker logs --tail 50 sigah-backend-dev
docker exec sigah-backend-dev sh -c "ps aux"
```

**Causas comunes:**
- `npm install` aún en progreso → esperar 1-2 minutos
- `prisma generate` ejecutándose → esperar 30 segundos más
- Error de conexión a PostgreSQL → verificar que `sigah-db-dev` esté healthy

**Solución rápida:**
```powershell
docker compose -f docker-compose.dev.new.yml up -d --force-recreate sigah-backend-dev
```

---

## Problema 3: Frontend no carga

**Síntoma:** `localhost:3000` no responde

**Diagnóstico:**
```powershell
docker logs --tail 30 sigah-frontend-dev
```

**Esperado:** Debe mostrar `VITE v5.x ready in XXX ms` y `Local: http://localhost:3000/sigah/`

**Si no aparece:** `npm install` aún en progreso. Esperar ~40 segundos.

**Solución:**
```powershell
docker compose -f docker-compose.dev.new.yml restart sigah-frontend-dev
```

---

## Problema 4: Login falla desde el navegador

**Síntoma:** Error de red o CORS al hacer login

**Diagnóstico:**
```powershell
# Probar proxy API
curl -sS http://localhost:3000/sigah-api/health

# Probar login directo al backend
$body = '{"email":"admin@sigah.com","password":"admin123"}'
curl -sS -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d $body
```

**Si proxy falla pero backend directo funciona:**
- El proxy de Vite no está configurado correctamente
- Verificar que `VITE_API_TARGET` esté configurado en el contenedor frontend
- Reiniciar frontend: `docker compose -f docker-compose.dev.new.yml restart sigah-frontend-dev`

**Si backend directo también falla:**
- Verificar logs: `docker logs sigah-backend-dev`
- Verificar conexión a DB: `docker exec sigah-db-dev pg_isready -U sigah`

---

## Problema 5: Base de datos vacía (no hay usuarios)

**Síntoma:** Login dice "credenciales inválidas"

**Solución:**
```powershell
docker exec sigah-backend-dev npx prisma db seed
```

**Si el seed falla:**
```powershell
# Verificar conexión
docker exec sigah-db-dev psql -U sigah -d sigah_dev -c "SELECT 1;"

# Re-ejecutar migraciones + seed
docker exec sigah-backend-dev npx prisma migrate deploy
docker exec sigah-backend-dev npx prisma db seed
```

---

## Problema 6: Puerto ya en uso

**Síntoma:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solución Windows:**
```powershell
# Ver qué usa el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar puerto en docker-compose.dev.new.yml
```

---

## Problema 7: Contenedores se reinician constantemente

**Diagnóstico:**
```powershell
docker ps -a --format "table {{.Names}}\t{{.Status}}"
docker logs --tail 100 <nombre-contenedor>
```

**Solución general:**
```powershell
# Limpiar todo y empezar de cero
docker compose -f docker-compose.dev.new.yml down -v
docker compose -f docker-compose.dev.new.yml up -d
```

---

## Problema 8: Datos corruptos o inconsistentes

**Solución: Reset completo de base de datos:**
```powershell
# Detener todo
docker compose -f docker-compose.dev.new.yml down

# Eliminar volumen de PostgreSQL
docker volume rm sigah-postgres-dev-data

# Levantar de nuevo (crea BD limpia)
docker compose -f docker-compose.dev.new.yml up -d

# Esperar 90 segundos y ejecutar seed
Start-Sleep -Seconds 90
docker exec sigah-backend-dev npx prisma db seed
```

---

## Problema 9: Hot reload no funciona

**Backend:** Verificar que `tsx watch` esté corriendo:
```powershell
docker exec sigah-backend-dev sh -c "ps aux | grep tsx"
```

**Frontend:** Verificar que Vite esté en modo watch:
```powershell
docker logs --tail 5 sigah-frontend-dev
# Debe mostrar: VITE v5.x ready
```

**Si no funciona:** Los volúmenes montados pueden tener problemas de sincronización en Windows. Reiniciar Docker Desktop.

---

## Problema 10: Rendimiento lento en Windows

**Causa:** Docker Desktop con WSL2 puede ser lento con volúmenes montados desde Windows.

**Mitigaciones:**
1. Asegurar que Docker Desktop use WSL2 (no Hyper-V)
2. En Docker Desktop → Settings → Resources → asignar al menos 4GB RAM y 2 CPUs
3. En Docker Desktop → Settings → General → usar "Use the WSL 2 based engine"

---

## Comandos de emergencia

```powershell
# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Reiniciar TODO
docker compose -f docker-compose.dev.new.yml down
docker compose -f docker-compose.dev.new.yml up -d

# Nuclear: eliminar todo y empezar limpio
docker compose -f docker-compose.dev.new.yml down -v --rmi all
docker compose -f docker-compose.dev.new.yml up -d

# Ver uso de recursos
docker stats --no-stream
```
