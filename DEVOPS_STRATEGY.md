# SIGAH - Estrategia DevOps Completa

## 🎯 **Filosofía DevOps**

Implementar un **ciclo de vida completo** con entornos diferenciados, automatización y monitoreo continuo.

## ⚡ **Arranque Post-Reinicio (Operación Linux)**

Objetivo: si el servidor se apaga o reinicia, volver a operación de SIGAH en minutos, con pasos repetibles.

### Componentes
- Script: `scripts/start_sigah.sh`
- Servicio systemd: `deploy/systemd/sigah-startup.service`
- Compose productivo por subruta: `docker-compose.subfolder.yml`

### Flujo operativo real
1. `systemd` arranca el script al boot.
2. El script levanta `sigah-db`, `sigah-redis`, `sigah-backend`, `sigah-frontend`.
3. El script evita conflicto de puertos eliminando `sigah-nginx-proxy` (80/443 lo maneja `rp-nginx`).
4. Se conecta `rp-nginx` a `sigah-network`.
5. Se validan endpoints de aplicación y API.

### Instalación en Linux (una sola vez)
```bash
cd /opt/sigah
sudo chmod +x scripts/start_sigah.sh
sudo cp deploy/systemd/sigah-startup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sigah-startup.service
sudo systemctl start sigah-startup.service
sudo systemctl status sigah-startup.service --no-pager
```

### Verificación post-arranque
```bash
sudo docker compose -p sigah -f /opt/sigah/docker-compose.subfolder.yml ps
curl -I https://saladecrisis.dosquebradas.gov.co/sigah/
curl -i https://saladecrisis.dosquebradas.gov.co/sigah-api/health
```

### Recuperación rápida manual
```bash
cd /opt/sigah
sudo /opt/sigah/scripts/start_sigah.sh
```

### Notas de operación
- `rp-nginx` es el proxy principal expuesto a Internet.
- No levantar `nginx-proxy` del compose subfolder en este escenario.
- Si hay cambios locales en servidor, usar `git stash` antes de `git pull --ff-only`.

```
Desarrollo → Staging → Producción
    ↓           ↓          ↓
  Testing    Testing   Monitoring
    ↓           ↓          ↓
  Quality   Quality   Backups
    ↓           ↓          ↓
  Deploy    Deploy     Recovery
```

## 🏗️ **Arquitectura de Entornos**

### 1. Entorno de Desarrollo (Local)
**Propósito:** Desarrollo activo con hot reload

**Características:**
- ✅ **Hot reload** en frontend y backend
- ✅ **Volúmenes montados** para código en tiempo real
- ✅ **Base de datos separada** (`sigah_dev`)
- ✅ **Herramientas de depuración** (pgAdmin, Redis Commander)
- ✅ **Logs detallados** y modo debug
- ✅ **Puertos expuestos** para acceso directo

**Accesos:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- pgAdmin: `http://localhost:5050`
- Redis Commander: `http://localhost:8081`

### 2. Entorno de Staging/Pruebas
**Propósito:** Pre-producción para testing y QA

**Características:**
- ✅ **Configuración realista** de producción
- ✅ **Base de datos separada** (`sigah_staging`)
- ✅ **SSL/TLS** habilitado
- ✅ **Performance testing** ready
- ✅ **Integration tests** automatizados
- ✅ **Monitoring básico**

**Accesos:**
- Aplicación: `http://localhost:8080/sigah/`
- API: `http://localhost:8080/sigah-api/`
- pgAdmin: `http://localhost:5051`

### 3. Entorno de Producción
**Propósito:** Sistema final para usuarios

**Características:**
- ✅ **Máxima seguridad** y optimización
- ✅ **Auto-recovery** y health checks
- ✅ **Backups automáticos**
- ✅ **Monitoring avanzado**
- ✅ **SSL/TLS** completo
- ✅ **Rate limiting** y protección

**Accesos:**
- Aplicación: `https://dominio.com/sigah/`
- API: `https://dominio.com/sigah-api/`

## 🔄 **Flujo de Trabajo DevOps**

### Fase 1: Desarrollo
```bash
# 1. Iniciar entorno de desarrollo
./scripts/devops-workflow.sh setup
./scripts/devops-workflow.sh dev

# 2. Desarrollar con hot reload
# - Cambios en frontend se reflejan instantáneamente
# - Cambios en backend reinician automáticamente
# - Base de datos persiste entre sesiones

# 3. Testing local
./scripts/devops-workflow.sh test
```

### Fase 2: Integración y Staging
```bash
# 1. Deploy a staging
./scripts/devops-workflow.sh deploy-staging

# 2. Verificación automática:
#    - Tests unitarios
#    - Tests de integración
#    - Health checks
#    - Performance básica

# 3. Testing manual en staging
#    - QA manual
#    - Testing de usuarios
#    - Validación de requisitos
```

### Fase 3: Producción
```bash
# 1. Deploy a producción (con confirmación)
./scripts/devops-workflow.sh deploy-prod

# 2. Proceso automático:
#    - Backup de producción actual
#    - Pull de último código
#    - Ejecución de tests
#    - Deploy con zero downtime
#    - Verificación post-deploy
#    - Rollback automático si falla
```

## 📊 **Estrategia de Testing**

### Testing Automatizado
```bash
# Tests Backend
npm run test              # Unit tests
npm run test:coverage     # Con coverage
npm run test:e2e         # End-to-end tests

# Tests Frontend
npm run test              # Unit tests
npm run test:ui           # UI testing
npm run test:e2e         # E2E con Playwright
```

### Testing por Entorno
- **Desarrollo:** Tests unitarios + integración básica
- **Staging:** Full suite + performance + security
- **Producción:** Monitoring + health checks

## 🚀 **Estrategia de Deploy**

### Deploy Automatizado
```bash
# Deploy a Staging (automático)
./scripts/devops-workflow.sh deploy-staging

# Deploy a Producción (manual + automático)
./scripts/devops-workflow.sh deploy-prod
```

### Características del Deploy
- ✅ **Zero downtime** con rolling updates
- ✅ **Health checks** post-deploy
- ✅ **Rollback automático** si falla
- ✅ **Backups previos** al deploy
- ✅ **Notificaciones** de estado

### Rollback Strategy
```bash
# Rollback inmediato a producción
./scripts/devops-workflow.sh rollback-prod

# Proceso:
# 1. Detectar fallo
# 2. Parar deploy actual
# 3. Restaurar último backup
# 4. Verificar funcionamiento
# 5. Notificar equipo
```

## 💾 **Estrategia de Backups**

### Backups Automatizados
```bash
# Backups por entorno
./scripts/devops-workflow.sh backup-dev      # Desarrollo
./scripts/devops-workflow.sh backup-staging  # Staging
./scripts/devops-workflow.sh backup-prod     # Producción
```

### Programación de Backups
```bash
# Crontab para backups automáticos
# Desarrollo: Cada 6 horas
0 */6 * * * /opt/sigah/scripts/devops-workflow.sh backup-dev

# Staging: Diario
0 2 * * * /opt/sigah/scripts/devops-workflow.sh backup-staging

# Producción: Cada 4 horas + backup semanal completo
0 */4 * * * /opt/sigah/scripts/devops-workflow.sh backup-prod
0 3 * * 0 /opt/sigah/scripts/weekly-backup.sh
```

### Retención de Backups
- **Desarrollo:** 2 días
- **Staging:** 7 días
- **Producción:** 30 días + 1 backup mensual por 6 meses

## 📈 **Monitoring y Observabilidad**

### Health Checks
```bash
# Verificación general
./scripts/devops-workflow.sh status

# Health checks específicos
curl http://localhost:3001/api/health      # Desarrollo
curl http://localhost:8080/health           # Staging
curl https://dominio.com/health             # Producción
```

### Métricas a Monitorear
- **Disponibilidad:** Uptime > 99.9%
- **Response time:** < 200ms (API), < 2s (Frontend)
- **Error rate:** < 1%
- **Resource usage:** CPU < 80%, Memory < 85%
- **Database connections:** < 80% del pool

### Logs Centralizados
```bash
# Logs por entorno
tail -f /opt/sigah/logs/dev/backend.log
tail -f /opt/sigah/logs/staging/nginx.log
tail -f /opt/sigah/logs/prod/application.log
```

## 🔒 **Seguridad por Entorno**

### Desarrollo
- **CORS permisivo** para localhost
- **JWT tokens** de larga duración
- **Logs detallados** de depuración
- **Sin rate limiting** estricto

### Staging
- **CORS restrictivo** para dominios de staging
- **JWT tokens** de duración media
- **Security headers** completos
- **Rate limiting** moderado

### Producción
- **CORS muy restrictivo**
- **JWT tokens** de corta duración
- **Security headers** máximos
- **Rate limiting** estricto
- **WAF** y protección DDoS

## 🛠️ **Herramientas DevOps**

### Script Principal
```bash
./scripts/devops-workflow.sh
```

**Comandos disponibles:**
- `setup` - Crear estructura inicial
- `dev` - Iniciar desarrollo
- `staging` - Iniciar staging
- `prod` - Iniciar producción
- `test` - Ejecutar tests
- `deploy-staging` - Deploy a staging
- `deploy-prod` - Deploy a producción
- `status` - Ver estado general
- `cleanup` - Limpiar recursos

### Integración CI/CD (Recomendación)

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy SIGAH
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: ./scripts/devops-workflow.sh test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to staging
        run: ./scripts/devops-workflow.sh deploy-staging

  deploy-prod:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: ./scripts/devops-workflow.sh deploy-prod
```

#### GitLab CI/CD
```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy-staging
  - deploy-prod

test:
  stage: test
  script:
    - ./scripts/devops-workflow.sh test

deploy_staging:
  stage: deploy-staging
  only:
    - develop
  script:
    - ./scripts/devops-workflow.sh deploy-staging

deploy_production:
  stage: deploy-prod
  only:
    - main
  when: manual
  script:
    - ./scripts/devops-workflow.sh deploy-prod
```

## 📋 **Checklist de Calidad**

### Pre-Deploy
- [ ] Todos los tests pasan
- [ ] Code review completado
- [ ] Security scan aprobado
- [ ] Performance tests OK
- [ ] Documentation actualizada

### Post-Deploy
- [ ] Health checks OK
- [ ] Monitoring normal
- [ ] Logs sin errores
- [ ] Usuarios pueden acceder
- [ ] Backups creados

### Producción
- [ ] SSL/TLS válido
- [ ] DNS configurado
- [ ] Firewall reglas OK
- [ ] Monitoring activo
- [ ] Backups automáticos
- [ ] Recovery plan probado

## 🎯 **Métricas de Éxito**

### Técnicas
- **Deploy time:** < 10 minutos
- **Recovery time:** < 5 minutos
- **Test coverage:** > 80%
- **Uptime:** > 99.9%

### de Negocio
- **Zero downtime** en producción
- **Rollback exitoso** < 1 minuto
- **Testing completo** antes de producción
- **Documentación siempre** actualizada

## 🚀 **Próximos Pasos**

1. **Implementar monitoring** con Prometheus/Grafana
2. **Agregar alerting** con Slack/Email
3. **Implementar canary deployments**
4. **Agregar performance testing** automatizado
5. **Implementar security scanning** continuo
6. **Agregar chaos engineering** tests

---

Esta estrategia DevOps garantiza **despliegues seguros**, **recuperación rápida** y **calidad continua** en todo el ciclo de vida de SIGAH.
