# Disponibilidad real de kits en Egresos de Kits

## Objetivo

Asegurar que el combo de `Gestión de Inventario -> Egresos de Kits` muestre la disponibilidad real de kits registrada en inventario, usando la tabla `kit_inventory` del backend.

## Cambios aplicados

- El endpoint de kits incorpora el inventario real del kit desde `kit_inventory`.
- El frontend `KitExits` usa `kit.inventory[0].quantity` para llenar `totalAvailable`.
- La pestaña `Egresos de Kits` renderiza el componente real `KitExits` dentro de `InventoryManagement`.
- Se retiró la solución temporal con cantidades hardcodeadas.
- El build del frontend quedó habilitado con `vite build` para generar `dist` sin quedar bloqueado por archivos TypeScript antiguos/no usados por la app principal.

## Archivos principales

- `backend/src/routes/kit.routes.ts`
- `frontend/src/pages/KitExits.tsx`
- `frontend/src/pages/InventoryManagement.tsx`
- `frontend/package.json`

## Validación realizada

Desde `frontend/`:

```bash
npm run build
```

Resultado esperado:

- Build exitoso.
- Carpeta `frontend/dist` generada.

## Prueba funcional

1. Reiniciar/reconstruir el servicio frontend que sirve `localhost:8080`.
2. Abrir `http://localhost:8080/inventory-admin`.
3. Ir a `Gestión de Inventario`.
4. Entrar a la pestaña `Egresos de Kits`.
5. Abrir el combo de kits.
6. Confirmar que el kit muestre la cantidad real en paréntesis, por ejemplo:

```text
KIT-ALI-001 - Kit de Alimentos Básico (5)
```

## Nota importante

Si el sistema se prueba en `localhost:3003`, ese puerto corresponde al servidor de desarrollo de Vite. Para que el ajuste sea persistente en `localhost:8080`, debe usarse el build actualizado o reconstruirse el contenedor/servicio frontend.
