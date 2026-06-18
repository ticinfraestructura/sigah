# Checklist Pruebas Manuales - Módulo Kits SIGAH

## Preparación
- [ ] Acceder a: `http://172.16.61.203:8081`
- [ ] Login con: `admin@test.com` (o usuario de producción)
- [ ] Navegar a: Gestión de Inventario → Pestaña Kits

---

## 1. Visualización de Kits (5 min)

### 1.1 Listado de Kits
- [ ] Se muestran los 2 kits de prueba: KIT01, KIT02
- [ ] Código visible: KIT01 = "Kit Alimentación", KIT02 = "Kit Higiene"
- [ ] Estado: "Activo" en ambos
- [ ] Cantidad de componentes visible

### 1.2 Detalle de Kit
- [ ] Click en KIT01 → abre detalle
- [ ] Muestra componentes: 2 arroz + 1 aceite
- [ ] Click en KIT02 → abre detalle
- [ ] Muestra componentes: 3 jabón

**Resultado esperado:** Datos coinciden con carga de prueba

---

## 2. Disponibilidad de Kits (10 min) ⭐ CRÍTICO

### 2.1 Reporte de Disponibilidad
- [ ] Ir a: Reportes → Kits → Disponibilidad
- [ ] Verificar columnas: Kit, Stock Físico, Puede Armar, Total Disponible

### 2.2 Validación de Cálculos
| Kit | Stock Físico (Bodega) | Puede Armar (Componentes) | Total |
|-----|----------------------|---------------------------|-------|
| KIT01 | 10 (cargado) | 50 arroz/2=25, 50 aceite/1=50 → **25** | 35 |
| KIT02 | 5 (cargado) | 30 jabón/3=10 → **10** | 15 |

- [ ] **KIT01:** Stock Físico = 10, Puede Armar = 25, Total = 35
- [ ] **KIT02:** Stock Físico = 5, Puede Armar = 10, Total = 15

### 2.3 Consistencia con otras pantallas
- [ ] Ir a: Inventario → Egresos de Kits
- [ ] Combo "Seleccionar Kit" debe mostrar cantidades disponibles
- [ ] KIT01 debe mostrar disponibilidad ~35
- [ ] KIT02 debe mostrar disponibilidad ~15

**Resultado esperado:** Números consistentes en reporte y egresos

---

## 3. Entrada de Kits (Ingreso) (15 min)

### 3.1 Registrar Entrada
- [ ] Ir a: Inventario → Ingresos de Kits
- [ ] Seleccionar KIT01
- [ ] Cantidad: 5
- [ ] Lote: TEST-001
- [ ] Razón: "Prueba de ingreso"
- [ ] Guardar

### 3.2 Validar Impacto
- [ ] **Stock Físico KIT01 debe aumentar:** 10 → 15
- [ ] Ir a Reporte Disponibilidad: Total KIT01 debe ser 40 (15+25)
- [ ] Ir a Egresos: Disponibilidad KIT01 debe mostrar ~40

### 3.3 Verificar Historial
- [ ] Reportes → Kits → Ingresos
- [ ] Debe aparecer ingreso con: KIT01, 5 unidades, TEST-001

**Resultado esperado:** Stock actualizado consistentemente

---

## 4. Salida de Kits (Egreso) (15 min)

### 4.1 Registrar Salida
- [ ] Ir a: Inventario → Egresos de Kits
- [ ] Seleccionar KIT02
- [ ] Cantidad: 2
- [ ] Beneficiario: Juan Perez
- [ ] Razón: "Prueba de entrega"
- [ ] Guardar

### 4.2 Validar Impacto
- [ ] **Stock Físico KIT02 debe disminuir:** 5 → 3
- [ ] Ir a Reporte Disponibilidad: Total KIT02 debe ser 13 (3+10)
- [ ] Ir a Egresos: Disponibilidad KIT02 debe mostrar ~13

### 4.3 Verificar Restricciones
- [ ] Intentar egresar 20 KIT02 (más del stock)
- [ ] El sistema debe BLOQUEAR o advertir
- [ ] Mensaje de error claro: "Stock insuficiente"

### 4.4 Historial de Egresos
- [ ] Reportes → Kits → Egresos
- [ ] Debe aparecer salida con: KIT02, 2 unidades, Juan Perez

**Resultado esperado:** No permite egreso sin stock

---

## 5. Reportes y Filtros (10 min)

### 5.1 Filtros por Kit
- [ ] Reporte de Ingresos → Filtrar por KIT01
- [ ] Solo debe mostrar ingresos de KIT01
- [ ] Reporte de Egresos → Filtrar por KIT02
- [ ] Solo debe mostrar egresos de KIT02

### 5.2 Filtros por Fecha
- [ ] Seleccionar rango: hoy
- [ ] Debe mostrar solo movimientos del día

### 5.3 Exportación
- [ ] Reporte de Disponibilidad → Exportar Excel
- [ ] Archivo descargado con datos correctos
- [ ] Reporte de Ingresos → Exportar PDF (si aplica)

**Resultado esperado:** Filtros funcionan, exportación genera archivos válidos

---

## 6. Integridad de Datos (5 min)

### 6.1 Consistencia Final
Después de todas las operaciones:

| Kit | Stock Inicial | Entradas | Salidas | Stock Esperado |
|-----|---------------|----------|---------|----------------|
| KIT01 | 10 | +5 | 0 | **15** |
| KIT02 | 5 | 0 | -2 | **3** |

- [ ] Reporte Disponibilidad muestra KIT01: 15 físico + puede armar
- [ ] Reporte Disponibilidad muestra KIT02: 3 físico + puede armar
- [ ] Egresos muestra cantidades disponibles correctas

### 6.2 Sin Errores 500
- [ ] Ningún error rojo en consola (F12 → Console)
- [ ] Ningún error P2023 (Prisma)
- [ ] Todas las operaciones completan sin recargar página

---

## Resultado de Pruebas

| # | Prueba | Estado | Notas |
|---|--------|--------|-------|
| 1 | Visualización | ⬜ | |
| 2 | Disponibilidad - cálculos | ⬜ | |
| 3 | Disponibilidad - consistencia | ⬜ | |
| 4 | Entrada de kits | ⬜ | |
| 5 | Salida de kits | ⬜ | |
| 6 | Validación stock insuficiente | ⬜ | |
| 7 | Filtros | ⬜ | |
| 8 | Exportación | ⬜ | |
| 9 | Integridad final | ⬜ | |

**Leyenda:**
- ✅ PASS - Funciona correctamente
- ❌ FAIL - Tiene bug
- ⚠️ WARN - Funciona pero con comportamiento extraño

---

## Bugs Encontrados

| # | Descripción | Severidad | Pasos para reproducir | Evidencia |
|---|-------------|-----------|---------------------|-----------|
| 1 | | | | |
| 2 | | | | |

---

## Próximos Pasos

- [ ] Corregir bugs encontrados
- [ ] Re-ejecutar pruebas fallidas
- [ ] Pasar a pruebas de Solicitudes y Entregas
