# CONTINUIDAD SIGAH - Retomar el Proyecto en Otra PC

**Proyecto:** SIGAH - Sistema de Gestión de Ayudas Humanitarias  
**Repositorio:** https://github.com/ticinfraestructura/sigah  
**Versión estable:** v1.1.0  
**Último commit estable:** 09b4037  
**Fecha de actualización:** Julio 2026

---

## 1. Estado Actual del Proyecto

El sistema quedó actualizado, funcional y documentado en la versión `v1.1.0`.

### Módulos activos

- Dashboard
- Inventario
- Gestión de Kits
- Reportes
- Usuarios
- Roles y Permisos
- Auditoría de Inventario
- Copias de Seguridad / Backups

### Roles activos

- `ADMIN`
- `WAREHOUSE`
- `OPERATOR`
- `READONLY`

### Roles deshabilitados en interfaz

- `AUTHORIZER`
- `DISPATCHER`

Estos roles pueden existir en la base de datos, pero no se muestran ni se usan en la interfaz actual.

---

## 2. Avances Consolidados en v1.1.0

### Bugs críticos corregidos

- Corregido `authorize` para aceptar `ADMIN` sin fallar por mapeo a `Administrador`.
- Corregido dashboard en blanco causado por referencias frontend a datos eliminados del backend.
- Corregidos permisos de acceso a la pantalla de backups.
- Corregida autorización de endpoints de backup en backend.

### Deuda técnica eliminada

- Eliminados archivos `App-*.tsx` de debug.
- Eliminados scripts `seed_*.js` sueltos en raíz.
- Eliminados docker-compose obsoletos.
- Eliminada propiedad `version` obsoleta de `docker-compose.yml`.
- Documentación actualizada con módulos reales activos.

### Documentación actualizada

- `README.md`
- `DOCUMENTACION_TECNICA_SIGAH.md`
- `DOCUMENTACION_COMPLETA.md`
- `DEPLOYMENT.md`
- `ARCHITECTURE.md`

---

## 3. Clonar en una PC Nueva

Si no existe carpeta previa del proyecto:

```bash
git clone https://github.com/ticinfraestructura/sigah.git
cd sigah
git checkout main
```

Si se quiere trabajar exactamente sobre la versión estable:

```bash
git checkout v1.1.0
```

Copiar el archivo `.env` correspondiente al entorno local antes de levantar Docker.

---

## 4. Actualizar una Carpeta Existente

Si en la otra PC ya existe una carpeta `sigah`, entrar a ella y revisar estado:

```bash
cd sigah
git status
```

### Si no hay cambios locales

```bash
git fetch origin
git checkout main
git pull origin main
```

### Si hay cambios locales y se quieren conservar

```bash
git stash push -m "backup cambios locales antes de actualizar"
git fetch origin
git checkout main
git pull origin main
```

Para recuperar los cambios guardados:

```bash
git stash list
git stash pop
```

### Si se quiere sobrescribir completamente con GitHub

Advertencia: esto descarta cambios locales no guardados.

```bash
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd
```

---

## 5. Opción Más Segura con Carpeta Existente

Si no se está seguro de si hay cambios importantes en la carpeta vieja, renombrarla y clonar limpio:

```powershell
Rename-Item sigah sigah_backup_antiguo
git clone https://github.com/ticinfraestructura/sigah.git sigah
cd sigah
git checkout main
```

Después copiar desde `sigah_backup_antiguo` solo lo necesario, especialmente:

```text
.env
```

---

## 6. Levantar el Sistema con Docker

Desde la raíz del proyecto:

```bash
docker-compose up -d --build
```

Verificar contenedores:

```bash
docker-compose ps
```

Verificar backend:

```bash
curl http://localhost:3002/api/health
```

---

## 7. URLs Locales

```text
Frontend: http://localhost:8082
Backend API: http://localhost:3002
Health Check: http://localhost:3002/api/health
```

---

## 8. Usuarios de Prueba

Contraseña por defecto:

```text
admin123
```

Usuarios:

```text
admin@sigah.com
bodega@sigah.com
operador@sigah.com
consulta@sigah.com
```

---

## 9. Backups del Sistema

La gestión de backups está disponible solo para `ADMIN` en:

```text
/backups
```

Funcionalidades:

- Listar copias de seguridad.
- Crear copia manual.
- Restaurar copia.
- Eliminar copia antigua.
- Ver estadísticas de backups.

El backend usa `pg_dump` para crear respaldos PostgreSQL y `psql` para restaurarlos.

---

## 10. Checklist Antes de Trabajar en Otra PC

- [ ] Entrar a la carpeta del proyecto.
- [ ] Ejecutar `git status`.
- [ ] Ejecutar `git fetch origin`.
- [ ] Ejecutar `git pull origin main` si no hay cambios locales.
- [ ] Confirmar que existe `.env`.
- [ ] Levantar con `docker-compose up -d --build`.
- [ ] Verificar `http://localhost:3002/api/health`.
- [ ] Abrir `http://localhost:8082`.
- [ ] Probar login con `admin@sigah.com`.

---

## 11. Checklist Antes de Cerrar una Sesión de Trabajo

- [ ] Ejecutar `git status`.
- [ ] Revisar cambios importantes.
- [ ] Ejecutar pruebas o validar manualmente las pantallas tocadas.
- [ ] Hacer commit local.
- [ ] Hacer push a GitHub.
- [ ] Si es versión estable, crear tag.

Comandos base:

```bash
git status
git add -A
git commit -m "mensaje claro del cambio"
git push origin main
```

Para tag estable:

```bash
git tag -a vX.Y.Z -m "Descripción de la versión"
git push origin vX.Y.Z
```

---

## 12. Instrucciones para una Próxima Sesión con IA

Al abrir una nueva sesión en otra PC, decir:

```text
Lee el archivo CONTINUIDAD_SIGAH.md y continúa desde ahí.
```

También se recomienda pedir que revise:

```text
README.md
DOCUMENTACION_TECNICA_SIGAH.md
ARCHITECTURE.md
DEPLOYMENT.md
DOCUMENTACION_COMPLETA.md
```

Esto evita depender del historial del chat y permite retomar el proyecto con contexto completo.

---

## 13. Comandos de Diagnóstico Rápido

```bash
git status
git log --oneline -5
docker-compose ps
docker logs sigah-github-backend --tail 50
docker logs sigah-github-frontend --tail 50
```

Verificar rol ADMIN en base de datos:

```bash
docker exec sigah-github-db psql -U sigah -d sigah -c "SELECT u.email, r.name FROM users u JOIN roles r ON u.\"roleId\" = r.id LIMIT 10;"
```

---

## 14. Nota Final

La fuente de verdad del proyecto es GitHub.  
El chat no debe ser la única fuente de continuidad.  
Este archivo resume cómo retomar, sincronizar y operar SIGAH sin perder avances.
