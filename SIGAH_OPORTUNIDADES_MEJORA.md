# SIGAH — Análisis de Oportunidades de Mejora

**Fecha:** 28 de Marzo de 2026  
**Analista:** Cascade AI  
**Alcance:** Seguridad, Consistencia, Coherencia, UI/UX

---

## Resumen Ejecutivo

SIGAH tiene una base sólida: arquitectura limpia, RBAC funcional, segregación de funciones, auditoría completa, dark mode, y un flujo de entregas robusto de 6 pasos. Sin embargo, hay **42 oportunidades de mejora** distribuidas así:

| Área | Críticas | Importantes | Deseables | Total |
|---|---|---|---|---|
| 🔒 Seguridad | 5 | 6 | 3 | 14 |
| 🔗 Consistencia | 2 | 5 | 3 | 10 |
| 🧩 Coherencia | 1 | 4 | 3 | 8 |
| 🎨 Belleza (UI/UX) | 0 | 4 | 6 | 10 |
| **Total** | **8** | **19** | **15** | **42** |

---

## 🔒 SEGURIDAD

### CRÍTICAS (resolver antes de producción)

#### SEC-01: JWT Secret hardcodeado en desarrollo
**Archivo:** `backend/src/middleware/auth.middleware.ts:17`
```typescript
const SECRET = JWT_SECRET || 'sigah-dev-secret-key-min-32-chars!';
```
**Riesgo:** Si `JWT_SECRET` no se configura, cualquiera puede firmar tokens.  
**Solución:** Forzar error fatal en arranque si `JWT_SECRET` no existe (incluso en desarrollo). Generar un secret aleatorio por defecto para dev:
```typescript
const SECRET = JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es OBLIGATORIO en producción');
  }
  const crypto = require('crypto');
  const devSecret = crypto.randomBytes(64).toString('hex');
  console.warn('⚠️ Usando JWT_SECRET aleatorio de desarrollo');
  return devSecret;
})();
```

#### SEC-02: Token almacenado en localStorage (vulnerable a XSS)
**Archivo:** `frontend/src/context/AuthContext.tsx:52`
```typescript
localStorage.setItem('token', newToken);
```
**Riesgo:** Un ataque XSS puede robar el token JWT.  
**Solución:** Migrar a cookies `httpOnly` + `secure` + `sameSite`:
- Backend: enviar token como cookie `Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict`
- Frontend: eliminar `localStorage.getItem('token')`, el browser envía la cookie automáticamente
- Impacto: **alto** pero vale la pena para producción

#### SEC-03: Contraseñas de seed débiles
**Archivo:** `backend/src/seed.ts` — todas las cuentas usan `admin123`
**Riesgo:** Si el seed se ejecuta en producción, todos los usuarios tienen password trivial.  
**Solución:**
- Agregar check: no ejecutar seed si `NODE_ENV=production`
- Forzar cambio de contraseña en primer login
- Implementar política de contraseña mínima: 8+ chars, 1 mayúscula, 1 número

#### SEC-04: Sin validación de input en backend (sanitización)
**Archivos:** Todos los `routes/*.ts`  
**Riesgo:** Inyección SQL (mitigado por Prisma) pero no XSS almacenado. Un usuario podría guardar `<script>alert('xss')</script>` en un campo `notes`.  
**Solución:** Agregar middleware de sanitización:
```typescript
import { sanitize } from 'express-validator';
// O usar xss-clean / DOMPurify en el servidor
app.use(xssClean());
```
Y validar con `express-validator` o `zod` en cada endpoint.

#### SEC-05: Endpoint de health expone información sensible
**Archivo:** `backend/src/index.ts:185-193`
```typescript
res.json({ 
  status: 'ok', 
  memory: process.memoryUsage()  // ⚠️ Expone heap, RSS
});
```
**Riesgo:** Facilita fingerprinting y ataques de denegación de servicio.  
**Solución:** En producción, responder solo `{ status: 'ok' }`. La info extendida solo en `/api/health/detailed` protegido por auth admin.

---

### IMPORTANTES

#### SEC-06: Sin CSRF protection
El frontend hace requests directamente con Axios. Si se migra a cookies httpOnly (SEC-02), necesitará protección CSRF.  
**Solución:** Implementar token CSRF con `csurf` o doble-submit cookie pattern.

#### SEC-07: Rate limiting solo por IP
**Archivo:** `backend/src/index.ts:103-127`  
Si múltiples usuarios comparten IP (NAT, VPN corporativa), el rate limiter los bloquea a todos.  
**Solución:** Rate limit por `userId` después de autenticación, y por IP solo para login.

#### SEC-08: Sin expiración de sesión en frontend
**Archivo:** `frontend/src/context/AuthContext.tsx`  
El token se almacena indefinidamente. Si el usuario cierra el browser sin logout, la sesión persiste.  
**Solución:** 
- Implementar idle timeout (15 min sin actividad → logout automático)
- Mostrar modal "Su sesión expirará en X segundos" antes del logout

#### SEC-09: Fetch directo sin usar la instancia Axios centralizada
**Archivo:** `frontend/src/pages/DeliveriesManagement.tsx:688`
```typescript
const response = await fetch(`/api/beneficiaries?search=...`, {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});
```
**Riesgo:** Bypasea el interceptor de 401 y la baseURL configurada.  
**Solución:** Usar `beneficiaryApi.getAll({ search: query })` del servicio centralizado.

#### SEC-10: CORS permite requests sin origin
**Archivo:** `backend/src/index.ts:79`
```typescript
if (!origin) return callback(null, true);
```
**Riesgo:** Permite requests desde Postman, curl o cualquier tool sin origin header.  
**Solución:** En producción, solo permitir origins conocidos. Agregar excepción configurable para health checks.

#### SEC-11: Sin logging de intentos de login fallidos
El auth limiter cuenta intentos pero no los registra en auditoría.  
**Solución:** Agregar `AuditLog` para cada intento de login fallido con IP, email intentado, timestamp.

---

### DESEABLES

#### SEC-12: Sin 2FA (autenticación de dos factores)
Para un sistema humanitario con datos sensibles, 2FA vía email o TOTP sería ideal.

#### SEC-13: Sin política de rotación de contraseñas
No hay campo `passwordChangedAt` ni forzado de cambio periódico.

#### SEC-14: Headers de seguridad podrían ser más estrictos
Agregar `Permissions-Policy`, `Referrer-Policy: strict-origin`, y CSP más restrictivo.

---

## 🔗 CONSISTENCIA

### CRÍTICAS

#### CON-01: Dos páginas de entregas con lógica duplicada
**Archivos:**
- `Deliveries.tsx` (58 líneas) — tabla simple, sin estados, sin acciones
- `DeliveriesManagement.tsx` (861 líneas) — flujo completo de 6 pasos

**Problema:** `Deliveries.tsx` está incompleta y no muestra el estado de la entrega, ni el código, ni permite acciones. Es confusa respecto a `DeliveriesManagement.tsx`.  
**Solución:** Eliminar `Deliveries.tsx` y usar solo `DeliveriesManagement.tsx` como la vista principal de entregas, o convertir `Deliveries.tsx` en una vista de historial filtrada.

#### CON-02: Mezcla de idiomas en código
**Ejemplos:**
- `VALID_TRANSITIONS`, `statusLabels`, `populationLabels` → inglés en keys, español en values ✅
- `generateRequestCode()` → inglés
- `throw new AppError('Beneficiario no encontrado', 404)` → español ✅
- Comentarios: mezcla de inglés y español
- Variables: `receivedBy`, `deliveryDate` → inglés
- Nombres de roles en BD: `'Administrador'`, `'Bodega'` → español

**Problema:** Inconsistente. El modelo de datos usa inglés, los mensajes de error español, los roles español.  
**Solución:** Definir convención clara:
- **Código y variables:** Inglés
- **Mensajes de error al usuario:** Español (ya está bien)
- **Nombres de roles en BD:** Usar códigos en inglés (`ADMIN`, `WAREHOUSE`) y label en español para la UI

---

### IMPORTANTES

#### CON-03: Manejo de errores inconsistente en frontend
**Ejemplos variados:**
```typescript
// Inventory.tsx → usa alert()
alert(error.response?.data?.error || 'Error al guardar');

// Dashboard.tsx → solo console.error
console.error('Error loading dashboard:', error);

// DeliveriesManagement.tsx → usa alert()
alert(error.response?.data?.error || 'Error al procesar la acción');
```
**Solución:** Crear componente `<Toast>` o usar librería (react-hot-toast, sonner) para notificaciones uniformes:
```typescript
// Reemplazar todos los alert() y console.error con:
toast.error(error.response?.data?.error || 'Error al guardar');
toast.success('Producto creado exitosamente');
```

#### CON-04: Confirmaciones con `confirm()` nativo del browser
**Archivos:** `Inventory.tsx:38`, `Requests.tsx:27`, `Requests.tsx:41`
```typescript
if (!confirm(`¿Desactivar el producto "${product.name}"?`)) return;
```
**Problema:** El `confirm()` del navegador es feo, no personalizable, y bloquea el hilo.  
**Solución:** Crear componente `<ConfirmModal>` reutilizable con diseño consistente al resto de la app.

#### CON-05: Estilos de modal inconsistentes
| Modal | Backdrop | Header | Max-width |
|---|---|---|---|
| ProductModal | `bg-black/60` | Con bg-gray-50 | max-w-lg |
| BeneficiaryModal | `bg-black/50` | Sin bg | max-w-lg |
| CancelModal | `bg-black bg-opacity-50` | Sin bg | max-w-md |
| ConfirmDeliveryModal | `bg-black bg-opacity-50` | Sin bg | max-w-lg |

**Solución:** Extraer componente `<Modal>` base:
```tsx
<Modal title="Título" size="md" onClose={handleClose}>
  {children}
</Modal>
```

#### CON-06: Paginación no implementada en el frontend
El backend soporta paginación (`page`, `limit`, `total`, `pages`) pero el frontend no la usa. Todos los listados cargan todo con `limit=50` por defecto.  
**Solución:** Crear componente `<Pagination>` y usarlo en Inventario, Beneficiarios, Solicitudes, Entregas.

#### CON-07: Loading states inconsistentes
Todos los módulos usan el mismo spinner:
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
```
Pero no hay skeleton loaders, ni estados vacíos consistentes.  
**Solución:** Hay un `Skeleton.tsx` en `components/ui/` que no se usa. Implementar skeleton loaders para tablas y cards.

---

### DESEABLES

#### CON-08: Debounce en búsquedas
Los inputs de búsqueda disparan un fetch en cada keystroke. Agregar debounce de 300ms.

#### CON-09: Fechas sin formateo consistente
Algunos usan `toLocaleDateString()`, otros `toLocaleString()`, sin zona horaria explícita.  
**Solución:** Crear helper `formatDate(date, format)` centralizado o usar `date-fns`.

#### CON-10: Imports de Prisma Client repetidos en cada ruta
Cada handler hace `const prisma: PrismaClient = req.app.get('prisma')`. Podría ser middleware.

---

## 🧩 COHERENCIA

### CRÍTICA

#### COH-01: `Deliveries.tsx` muestra datos completamente diferentes a `DeliveriesManagement.tsx`
La ruta `/deliveries` (simple) muestra: Solicitud, Fecha, Beneficiario, Entregado Por, Tipo.  
La ruta `/deliveries-management` (completa) muestra: Código, Estado, Solicitud, Beneficiario, Bodega, Fecha.  
**Problema:** Un usuario que navega a "Entregas" ve una cosa; el admin que va a "Gestión Entregas" ve otra. La información no es coherente.  
**Solución:** Unificar en una sola vista con filtros por estado y permisos por rol.

---

### IMPORTANTES

#### COH-02: Dashboard no adapta contenido al rol
**Archivo:** `Dashboard.tsx:97`  
El Dashboard muestra siempre los mismos 4 KPIs y acciones rápidas para todos los roles. Un usuario de Consulta ve "Nueva Solicitud" pero no puede crear una.  
**Solución:** Filtrar acciones rápidas y KPIs según permisos del usuario. Mostrar solo lo relevante para cada rol.

#### COH-03: Workflow visual incompleto en Deliveries
El panel lateral de `DeliveriesManagement.tsx` muestra 4 pasos visuales (Creada, Autorización, Preparación, Entrega) pero el flujo real tiene 6 pasos. Faltan "Recibida en Bodega" e "In Preparation" como pasos visuales separados.  
**Solución:** Renderizar los 6 pasos del workflow como un stepper vertical completo.

#### COH-04: Estados de entregas no mapean a dark mode
**Archivo:** `DeliveriesManagement.tsx:193`  
```tsx
<h1 className="text-2xl font-bold text-gray-900">Gestión de Entregas</h1>
```
Falta `dark:text-white` en este componente, a diferencia de los demás módulos que sí lo tienen.  
**Solución:** Auditar todos los componentes para consistencia de dark mode.

#### COH-05: Falta breadcrumb de navegación
El usuario no sabe en qué parte del sistema está. No hay breadcrumbs ni título dinámico en el header.  
**Solución:** Agregar breadcrumb contextual: `Dashboard > Inventario > Arroz 1kg`

---

### DESEABLES

#### COH-06: Sin confirmación visual de acciones exitosas
Al crear un producto, beneficiario o solicitud, el modal se cierra silenciosamente. No hay feedback de "Creado con éxito".  
**Solución:** Toast de éxito después de cada operación CRUD.

#### COH-07: Búsqueda global ausente
No hay buscador global que permita encontrar un beneficiario, producto o solicitud desde cualquier parte.

#### COH-08: Sin atajos de teclado
Para operaciones frecuentes (nueva solicitud, buscar) no hay atajos. Ctrl+K para búsqueda global sería ideal.

---

## 🎨 BELLEZA (UI/UX)

### IMPORTANTES

#### UI-01: Tablas planas sin personalidad visual
Las tablas de Inventario, Beneficiarios y Solicitudes son funcionales pero básicas. Todas se ven igual.  
**Mejoras sugeridas:**
- **Avatares** para beneficiarios (iniciales con color basado en nombre)
- **Iconos de categoría** coloreados para productos (no el genérico Package gris)
- **Progress bars** para mostrar % de entrega en solicitudes
- **Status chips** con colores más vibrantes y ícono integrado
- Ejemplo de avatar:
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
     flex items-center justify-center text-white font-bold text-sm">
  {firstName[0]}{lastName[0]}
</div>
```

#### UI-02: Cards del Dashboard sin microinteracciones
Los KPI cards son estáticos. Agregar:
- **Animación de entrada** al cargar (fade-in escalonado)
- **Hover effect** con elevación sutil
- **Trend indicators** (↑12% vs mes anterior)
- **Sparkline** mini-gráfico dentro de cada card

#### UI-03: Sidebar sin indicador visual de sección activa
El sidebar marca el link activo con color, pero no tiene indicador lateral (barra izquierda) ni transición suave. Los mejores dashboards usan:
```tsx
<div className={`border-l-4 ${isActive ? 'border-primary-600' : 'border-transparent'} 
     transition-all duration-200`}>
```

#### UI-04: Formularios sin validación visual en tiempo real
Los modales de creación no muestran errores de campo hasta que el backend responde. Debería haber validación inline:
- Borde rojo + mensaje debajo del campo con error
- Borde verde cuando el campo es válido
- Indicador de campo obligatorio más visible (asterisco rojo)

---

### DESEABLES

#### UI-05: Login sin ilustración ni branding
La pantalla de login es funcional pero genérica. Sugerencias:
- Agregar ilustración lateral (SVG de ayuda humanitaria)
- Logo de la organización
- Gradient animado sutil en el fondo
- Versión del sistema en footer

#### UI-06: Empty states genéricos
Cuando un listado está vacío, muestra solo texto. Mejores prácticas:
```tsx
<div className="text-center py-12">
  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
  <h3 className="text-lg font-medium text-gray-900">No hay beneficiarios</h3>
  <p className="text-gray-500 mt-1">Comience agregando el primer beneficiario</p>
  <button className="btn-primary mt-4">
    <Plus className="w-4 h-4 mr-2" /> Agregar Beneficiario
  </button>
</div>
```

#### UI-07: Sin transiciones entre páginas
La navegación entre módulos es abrupta (render instantáneo). Agregar:
- Fade-in de contenido (200ms)
- Skeleton loader durante carga
- Scroll automático al top en cambio de ruta

#### UI-08: Gráficos sin tooltips dark mode
Los gráficos de Recharts en el Dashboard no adaptan colores a dark mode. Las líneas de grilla, texto de ejes y tooltips mantienen colores claros.

#### UI-09: Sin indicador de conexión/desconexión
Si el backend se cae o la red falla, el usuario no recibe feedback. Agregar banner de "Sin conexión" cuando las requests fallan.

#### UI-10: Footer ausente
No hay footer con versión, copyright, o links de ayuda. Un footer mínimo le da profesionalismo:
```tsx
<footer className="text-center text-xs text-gray-400 py-4 border-t">
  SIGAH v1.0.0 · Sistema de Gestión de Ayudas Humanitarias · © 2024
</footer>
```

---

## 📋 PLAN DE ACCIÓN PRIORIZADO

### Sprint 1 — Antes de Producción (1-2 semanas)

| # | Mejora | Esfuerzo | Impacto |
|---|---|---|---|
| 1 | SEC-01: Eliminar JWT secret hardcoded | 1h | 🔴 Crítico |
| 2 | SEC-03: Proteger seed en producción | 1h | 🔴 Crítico |
| 3 | SEC-05: Restringir health endpoint | 30min | 🔴 Crítico |
| 4 | SEC-04: Agregar validación de input con zod | 4h | 🔴 Crítico |
| 5 | SEC-09: Corregir fetch directo en DeliveriesManagement | 30min | 🟡 Importante |
| 6 | CON-01: Unificar vistas de entregas | 2h | 🔴 Crítico |
| 7 | CON-03: Reemplazar alert() con Toast | 3h | 🟡 Importante |
| 8 | CON-04: Reemplazar confirm() con ConfirmModal | 2h | 🟡 Importante |
| 9 | COH-04: Corregir dark mode en DeliveriesManagement | 1h | 🟡 Importante |
| 10 | SEC-11: Logging de intentos de login fallidos | 2h | 🟡 Importante |

### Sprint 2 — Mejora de Experiencia (2-3 semanas)

| # | Mejora | Esfuerzo | Impacto |
|---|---|---|---|
| 11 | CON-05: Componente Modal base | 3h | 🟡 Importante |
| 12 | CON-06: Implementar paginación frontend | 4h | 🟡 Importante |
| 13 | CON-07: Skeleton loaders | 3h | 🟡 Importante |
| 14 | UI-01: Mejorar tablas (avatares, iconos) | 4h | 🟡 Importante |
| 15 | UI-04: Validación inline en formularios | 4h | 🟡 Importante |
| 16 | COH-02: Dashboard adaptado por rol | 3h | 🟡 Importante |
| 17 | COH-03: Stepper de 6 pasos en entregas | 3h | 🟡 Importante |
| 18 | COH-06: Toasts de éxito en operaciones CRUD | 2h | 🟢 Deseable |
| 19 | CON-08: Debounce en búsquedas | 1h | 🟢 Deseable |
| 20 | CON-09: Formateo de fechas centralizado | 2h | 🟢 Deseable |

### Sprint 3 — Pulido y Seguridad Avanzada (3-4 semanas)

| # | Mejora | Esfuerzo | Impacto |
|---|---|---|---|
| 21 | SEC-02: Migrar tokens a httpOnly cookies | 8h | 🔴 Crítico |
| 22 | SEC-06: Protección CSRF | 4h | 🟡 Importante |
| 23 | SEC-08: Sesión con idle timeout | 4h | 🟡 Importante |
| 24 | UI-02: Microinteracciones en Dashboard | 4h | 🟢 Deseable |
| 25 | UI-03: Sidebar con indicador lateral | 1h | 🟢 Deseable |
| 26 | UI-05: Mejorar pantalla de login | 3h | 🟢 Deseable |
| 27 | UI-06: Empty states con ilustración | 2h | 🟢 Deseable |
| 28 | UI-07: Transiciones entre páginas | 2h | 🟢 Deseable |
| 29 | COH-05: Breadcrumbs | 3h | 🟢 Deseable |
| 30 | COH-07: Búsqueda global | 6h | 🟢 Deseable |

---

## Resumen Visual de Estado Actual

```
SEGURIDAD     ████████░░░░  67% — Buena base, falta hardening
CONSISTENCIA  ██████░░░░░░  50% — Funcional pero con deuda técnica
COHERENCIA    ███████░░░░░  58% — Flujos completos, UX parcial
BELLEZA       ███████░░░░░  60% — Limpio pero genérico

OVERALL       ███████░░░░░  59% — Sólido para MVP, necesita pulido para producción
```

**Conclusión:** SIGAH es un sistema **funcional y bien arquitectado**. Las mejoras críticas de seguridad (SEC-01 a SEC-05) deben resolverse antes de producción. Las mejoras de consistencia y UI elevarán significativamente la percepción de calidad sin cambiar la lógica de negocio.
