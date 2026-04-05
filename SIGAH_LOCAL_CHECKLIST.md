# SIGAH - Checklist de Verificación Local

## Pre-requisitos

- [ ] Docker Desktop instalado y en modo **Linux containers**
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Puertos libres: 3000, 3001, 5050, 5433, 6380, 8081
- [ ] Archivo `.env` creado a partir de `.env.example`

## Despliegue

- [ ] `docker compose -f docker-compose.dev.new.yml up -d` ejecutado sin errores
- [ ] 6 contenedores corriendo (`docker ps`)
- [ ] PostgreSQL healthy
- [ ] Redis healthy
- [ ] Seed ejecutado: `docker exec sigah-backend-dev npx prisma db seed`

## Backend (API)

- [ ] Health check OK: `curl http://localhost:3001/api/health` → `{"status":"ok"}`
- [ ] Login funciona: POST `/api/auth/login` con admin@sigah.com / admin123 → JWT token
- [ ] Productos: GET `/api/products` → 14 productos
- [ ] Categorías: GET `/api/categories` → 6 categorías
- [ ] Beneficiarios: GET `/api/beneficiaries` → 4 beneficiarios
- [ ] Solicitudes: GET `/api/requests` → 4 solicitudes
- [ ] Kits: GET `/api/kits` → 3 kits
- [ ] Dashboard: GET `/api/dashboard` → datos de resumen
- [ ] Logs sin errores críticos: `docker logs sigah-backend-dev`

## Frontend (UI)

- [ ] Página carga: `http://localhost:3000/sigah/` → HTML válido
- [ ] Proxy API funciona: `http://localhost:3000/sigah-api/health` → HTTP 200
- [ ] Login en navegador: admin@sigah.com / admin123 → redirige a Dashboard
- [ ] Dashboard muestra datos (productos, solicitudes, gráficos)
- [ ] Módulo Inventario: lista productos con stock
- [ ] Módulo Kits: muestra 3 kits configurados
- [ ] Módulo Beneficiarios: muestra 4 beneficiarios
- [ ] Módulo Solicitudes: muestra solicitudes en distintos estados
- [ ] Navegación entre módulos funciona sin errores
- [ ] Responsive: funciona en resolución móvil

## Roles y Permisos

- [ ] Login con admin@sigah.com → ve todos los módulos
- [ ] Login con consulta@sigah.com → solo lectura (sin botones Crear/Editar/Eliminar)
- [ ] Login con bodega@sigah.com → acceso a inventario y preparación
- [ ] Login con operador@sigah.com → acceso a solicitudes y beneficiarios

## Herramientas de Desarrollo

- [ ] pgAdmin accesible: `http://localhost:5050`
- [ ] Redis Commander accesible: `http://localhost:8081`
- [ ] PostgreSQL directo: `localhost:5433` (sigah / dev123 / sigah_dev)

## Base de Datos

- [ ] 24 tablas creadas (verificar con `\dt` en psql)
- [ ] 46 permisos en tabla `permissions`
- [ ] 6 roles en tabla `roles`
- [ ] 6 usuarios en tabla `users`
- [ ] 14 productos en tabla `products`
- [ ] Lotes de inventario con stock > 0

## Estabilidad

- [ ] Backend no se reinicia solo (logs limpios por 5 min)
- [ ] Frontend sin errores de consola en navegador
- [ ] No hay errores CORS en consola del navegador
- [ ] Hot reload funciona: cambiar código → refleja cambios

## Resultado Final

- [ ] **SIGAH funciona correctamente en local**
- [ ] **Todos los módulos accesibles y funcionales**
- [ ] **Base de datos poblada con datos de prueba**
- [ ] **Documentación completa generada**
