# Estado del Sistema SIGAH — 2026-07-14

## Ambiente de Ejecución
| Componente | Valor |
|---|---|
| **URL local** | http://localhost:8080 |
| **Docker Compose** | `docker-compose.yml` |
| **Versión** | v1.3.2 |
| **Stack Docker** | `sigah-github-*` |

## Contenedores Docker
| Contenedor | Estado | Puerto |
|---|---|---|
| `sigah-github-frontend` | ✅ Running | 8080→80 |
| `sigah-github-backend` | ✅ Running | 3001 |
| `sigah-github-db` (PostgreSQL) | ✅ Healthy | 5432 |
| `sigah-github-redis` | ✅ Healthy | 6379 |

---

## Credenciales del Sistema

### Administrador Principal
| Campo | Valor |
|---|---|
| **Email** | `admin@sigah.com` |
| **Password** | `Admin2026!` |
| **Rol** | Administrador |

### Otros usuarios de prueba
| Email | Password | Rol |
|---|---|---|
| `autorizador@sigah.com` | (restaurado del backup) | Autorizador |
| `bodega@sigah.com` | (restaurado del backup) | Bodeguero |
| `consulta@sigah.com` | (restaurado del backup) | Consulta |
| `despachador@sigah.com` | (restaurado del backup) | Despachador |
| `operador@sigah.com` | (restaurado del backup) | Operador |
| `ptorres@mail.com` | (restaurado del backup) | Administrador |

> ⚠️ Los passwords de usuarios distintos a `admin@sigah.com` provienen del backup del 2026-07-02. Si no funcionan, resetear desde la interfaz de Gestión de Usuarios.

---

## Datos Restaurados (backup 2026-07-02 UAT)
| Tabla | Registros |
|---|---|
| Usuarios | 7 |
| Roles | 7 |
| Productos | 15 |
| Kits | 6 |
| Categorías | 6 |
| Beneficiarios | 4 |

---

## Acciones realizadas en esta sesión (2026-07-14)

1. **`git pull --rebase origin main`** — Integración de 4 commits del trabajo desde casa
2. **Ajuste docker-compose.yml** — Puerto backend 3002→3001 para ambiente local
3. **Restauración de BD** — desde `sigah_backup_20260702_uat.dump`
4. **Reset password admin** — `Admin2026!` (hash bcrypt actualizado en BD)

---

## Backup de Esta Sesión
| Archivo | Tamaño | Formato |
|---|---|---|
| `sigah_backup_2026-07-14_10-54.dump` | 0.23 MB | pg_dump -Fc (binario) |

---

## Git — Commits integrados desde casa
```
e78ae07  docs: polish technical architecture diagram
fd2b1cb  security: harden local deployment headers cors and login rate limit
2c1c964  docs: add SIGAH continuity guide for future sessions
09b4037  feat: Fix critical bugs, eliminate technical debt, update documentation v1.1.0
```
