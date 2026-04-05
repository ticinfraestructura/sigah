# SIGAH — Estimación de Costos por Mejora (en Créditos)

**Fecha:** 28 de Marzo de 2026

## Criterios de Estimación

| Complejidad | Créditos | Descripción |
|---|---|---|
| 🟢 Trivial | 5-10 | 1-2 archivos, cambio puntual, sin lógica nueva |
| 🟡 Simple | 10-20 | 2-4 archivos, lógica menor, componente pequeño |
| 🟠 Moderada | 20-40 | 4-8 archivos, componente nuevo, refactoring parcial |
| 🔴 Compleja | 40-70 | 8+ archivos, arquitectura nueva, cambios transversales |
| ⚫ Muy compleja | 70-100+ | Cambio arquitectónico, múltiples sistemas afectados |

> **1 crédito ≈ 1 interacción con Cascade** (prompt + respuesta + ediciones).  
> Las estimaciones incluyen: análisis, implementación, y verificación básica.

---

## 🔒 SEGURIDAD

| ID | Mejora | Complejidad | Créditos | Archivos afectados |
|---|---|---|---|---|
| SEC-01 | Eliminar JWT secret hardcoded | 🟢 Trivial | **5** | auth.middleware.ts |
| SEC-02 | Migrar tokens a httpOnly cookies | ⚫ Muy compleja | **80** | auth.routes.ts, auth.middleware.ts, AuthContext.tsx, api.ts, index.ts, vite.config |
| SEC-03 | Proteger seed en producción + política de password | 🟡 Simple | **10** | seed.ts, auth.routes.ts |
| SEC-04 | Validación de input con Zod (todos los endpoints) | 🔴 Compleja | **50** | Todos los routes/*.ts (12 archivos), nuevo middleware |
| SEC-05 | Restringir health endpoint | 🟢 Trivial | **5** | index.ts |
| SEC-06 | Protección CSRF | 🟠 Moderada | **25** | index.ts, api.ts, auth middleware |
| SEC-07 | Rate limiting por userId | 🟡 Simple | **10** | index.ts, auth.middleware.ts |
| SEC-08 | Idle timeout de sesión | 🟠 Moderada | **20** | AuthContext.tsx, nuevo hook useIdleTimeout, Layout.tsx |
| SEC-09 | Corregir fetch directo en DeliveriesManagement | 🟢 Trivial | **5** | DeliveriesManagement.tsx |
| SEC-10 | Restringir CORS sin origin en producción | 🟢 Trivial | **5** | index.ts |
| SEC-11 | Logging de login fallidos en auditoría | 🟡 Simple | **10** | auth.routes.ts |
| SEC-12 | 2FA (TOTP o email) | ⚫ Muy compleja | **100** | Nuevo servicio, auth.routes.ts, Login.tsx, nuevo componente 2FA |
| SEC-13 | Política de rotación de contraseñas | 🟡 Simple | **15** | auth.routes.ts, schema.prisma, migración |
| SEC-14 | Headers de seguridad adicionales | 🟢 Trivial | **5** | index.ts |
| | **Subtotal Seguridad** | | **345** | |

---

## 🔗 CONSISTENCIA

| ID | Mejora | Complejidad | Créditos | Archivos afectados |
|---|---|---|---|---|
| CON-01 | Unificar vistas de entregas | 🟠 Moderada | **25** | Deliveries.tsx, DeliveriesManagement.tsx, App.tsx (rutas) |
| CON-02 | Convención de idiomas (roles en BD) | 🟠 Moderada | **30** | seed.ts, auth.middleware.ts, DeliveriesManagement.tsx, Layout.tsx, migración |
| CON-03 | Reemplazar alert() con Toast system | 🟡 Simple | **15** | Instalar react-hot-toast, 8 páginas que usan alert() |
| CON-04 | Reemplazar confirm() con ConfirmModal | 🟡 Simple | **15** | Nuevo componente ConfirmModal, Inventory.tsx, Requests.tsx |
| CON-05 | Componente Modal base reutilizable | 🟠 Moderada | **20** | Nuevo Modal.tsx, refactor de 4 modales existentes |
| CON-06 | Paginación en frontend | 🟠 Moderada | **30** | Nuevo Pagination.tsx, Inventory, Beneficiaries, Requests, Deliveries |
| CON-07 | Skeleton loaders (usar el existente) | 🟡 Simple | **15** | Skeleton.tsx (ya existe), 6 páginas de listado |
| CON-08 | Debounce en búsquedas | 🟢 Trivial | **5** | Inventory.tsx, Beneficiaries.tsx, Requests.tsx, DeliveriesManagement.tsx |
| CON-09 | Formateo de fechas centralizado | 🟡 Simple | **10** | Nuevo utils/dates.ts, ~10 archivos que formatean fechas |
| CON-10 | Middleware de Prisma en vez de req.app.get | 🟡 Simple | **10** | Nuevo middleware, todos los routes (12 archivos) |
| | **Subtotal Consistencia** | | **175** | |

---

## 🧩 COHERENCIA

| ID | Mejora | Complejidad | Créditos | Archivos afectados |
|---|---|---|---|---|
| COH-01 | Unificar info de entregas (ya incluida en CON-01) | — | **0** | (incluido arriba) |
| COH-02 | Dashboard adaptado por rol | 🟡 Simple | **15** | Dashboard.tsx |
| COH-03 | Stepper de 6 pasos en entregas | 🟡 Simple | **15** | DeliveriesManagement.tsx (panel lateral) |
| COH-04 | Corregir dark mode en DeliveriesManagement | 🟢 Trivial | **5** | DeliveriesManagement.tsx |
| COH-05 | Breadcrumbs de navegación | 🟠 Moderada | **20** | Nuevo Breadcrumb.tsx, Layout.tsx, todas las páginas (rutas) |
| COH-06 | Toasts de éxito en CRUD (ya incluida en CON-03) | — | **0** | (incluido arriba) |
| COH-07 | Búsqueda global (Ctrl+K) | 🔴 Compleja | **45** | Nuevo SearchModal.tsx, nuevo endpoint /api/search, Layout.tsx |
| COH-08 | Atajos de teclado | 🟡 Simple | **10** | Nuevo hook useKeyboard, Layout.tsx |
| | **Subtotal Coherencia** | | **110** | |

---

## 🎨 BELLEZA (UI/UX)

| ID | Mejora | Complejidad | Créditos | Archivos afectados |
|---|---|---|---|---|
| UI-01 | Mejorar tablas (avatares, iconos, progress) | 🟠 Moderada | **25** | Nuevo Avatar.tsx, Inventory.tsx, Beneficiaries.tsx, Requests.tsx |
| UI-02 | Microinteracciones en Dashboard | 🟡 Simple | **15** | Dashboard.tsx, AnimatedComponents.tsx (ya existe) |
| UI-03 | Sidebar con indicador lateral activo | 🟢 Trivial | **5** | Layout.tsx |
| UI-04 | Validación inline en formularios | 🟠 Moderada | **30** | Instalar react-hook-form + zod, refactor 4 modales de formulario |
| UI-05 | Mejorar pantalla de Login | 🟡 Simple | **15** | Login.tsx, agregar SVG ilustración |
| UI-06 | Empty states con ilustración y CTA | 🟡 Simple | **10** | Nuevo EmptyState.tsx, 6 páginas de listado |
| UI-07 | Transiciones entre páginas | 🟡 Simple | **10** | App.tsx, instalar framer-motion |
| UI-08 | Gráficos Recharts dark mode | 🟡 Simple | **10** | Dashboard.tsx |
| UI-09 | Banner de desconexión | 🟡 Simple | **10** | api.ts (interceptor), nuevo ConnectionBanner.tsx, Layout.tsx |
| UI-10 | Footer con versión | 🟢 Trivial | **5** | Layout.tsx |
| | **Subtotal Belleza** | | **135** | |

---

## 📊 RESUMEN GENERAL

| Área | Mejoras | Créditos | % del Total |
|---|---|---|---|
| 🔒 Seguridad | 14 | **345** | 45% |
| 🔗 Consistencia | 10 | **175** | 23% |
| 🧩 Coherencia | 8 | **110** | 14% |
| 🎨 Belleza | 10 | **135** | 18% |
| **TOTAL** | **42** | **765** | 100% |

---

## 💰 PAQUETES RECOMENDADOS (por presupuesto)

### Paquete MÍNIMO — Solo Seguridad Crítica
> "Lo indispensable para ir a producción"

| ID | Mejora | Créditos |
|---|---|---|
| SEC-01 | JWT secret hardcoded | 5 |
| SEC-03 | Proteger seed + password policy | 10 |
| SEC-05 | Restringir health | 5 |
| SEC-09 | Fix fetch directo | 5 |
| SEC-10 | CORS sin origin | 5 |
| SEC-14 | Headers adicionales | 5 |
| COH-04 | Fix dark mode entregas | 5 |
| | **Total Paquete Mínimo** | **40 créditos** |

---

### Paquete RECOMENDADO — Producción Sólida
> "Seguro, consistente y profesional"

| ID | Mejora | Créditos |
|---|---|---|
| | Todo el Paquete Mínimo | 40 |
| SEC-04 | Validación Zod | 50 |
| SEC-07 | Rate limit por userId | 10 |
| SEC-08 | Idle timeout sesión | 20 |
| SEC-11 | Log login fallidos | 10 |
| CON-01 | Unificar entregas | 25 |
| CON-03 | Sistema de Toasts | 15 |
| CON-04 | ConfirmModal | 15 |
| CON-05 | Modal base | 20 |
| CON-06 | Paginación | 30 |
| CON-08 | Debounce búsquedas | 5 |
| COH-02 | Dashboard por rol | 15 |
| COH-03 | Stepper 6 pasos | 15 |
| UI-03 | Sidebar indicador | 5 |
| UI-10 | Footer versión | 5 |
| | **Total Paquete Recomendado** | **280 créditos** |

---

### Paquete PREMIUM — Experiencia Completa
> "Bonito, seguro, y listo para impresionar"

| ID | Mejora | Créditos |
|---|---|---|
| | Todo el Paquete Recomendado | 280 |
| SEC-02 | Cookies httpOnly | 80 |
| SEC-06 | CSRF protection | 25 |
| CON-07 | Skeleton loaders | 15 |
| CON-09 | Fechas centralizadas | 10 |
| UI-01 | Tablas mejoradas | 25 |
| UI-02 | Microinteracciones | 15 |
| UI-04 | Validación inline | 30 |
| UI-05 | Login mejorado | 15 |
| UI-06 | Empty states | 10 |
| UI-07 | Transiciones | 10 |
| UI-08 | Charts dark mode | 10 |
| UI-09 | Banner conexión | 10 |
| COH-05 | Breadcrumbs | 20 |
| | **Total Paquete Premium** | **555 créditos** |

---

### Paquete COMPLETO — Todo incluido
> "Absolutamente todo, incluyendo 2FA y búsqueda global"

| | Créditos |
|---|---|
| Todo el Paquete Premium | 555 |
| + SEC-12 (2FA) | 100 |
| + SEC-13 (Rotación passwords) | 15 |
| + CON-02 (Convención idiomas) | 30 |
| + CON-10 (Middleware Prisma) | 10 |
| + COH-07 (Búsqueda global) | 45 |
| + COH-08 (Atajos teclado) | 10 |
| **Total Paquete Completo** | **765 créditos** |

---

## ⚡ ROI — ¿Dónde invertir primero?

| Inversión | Créditos | Impacto |
|---|---|---|
| 🥇 Toasts + ConfirmModal + Debounce | 35 | UX mejora dramáticamente con poco esfuerzo |
| 🥈 Fix seguridad triviales (5 items) | 25 | Producción segura con mínima inversión |
| 🥉 Unificar entregas + Stepper 6 pasos | 40 | El módulo más complejo se vuelve claro |
| 4️⃣ Paginación + Skeletons | 45 | Profesionalismo percibido sube mucho |
| 5️⃣ Sidebar + Footer + Dark mode fix | 15 | Detalles que suman calidad visual |

**Mi recomendación:** Empezar con el **Paquete Recomendado (280 créditos)** que cubre lo esencial para producción con calidad profesional.
