# Implementación del Plan de Optimización de Tokens

## Fuente del plan

```text
C:\Users\Administrador\.windsurf\plans\plan-token-optimizacion-c390c2.md
```

## Componentes implementados

### Configuración central

Archivo:

```text
token-plan.config.json
```

Contiene:

- Distribución semanal de tokens.
- Límite diario por día.
- Umbral de alerta por tarea individual.
- Mensajes y acciones de alertas amarilla, naranja y roja.
- Plan de contingencia para <20%, <10% y <5% disponible.

### Monitor principal

Archivo:

```text
token-monitor.ps1
```

Funciones disponibles:

```powershell
.\token-monitor.ps1
.\token-monitor.ps1 -Task "Nombre de tarea" -Tokens 5
.\token-monitor.ps1 -Reset
.\token-monitor.ps1 -Weekly
```

Capacidades:

- Carga configuración desde `token-plan.config.json`.
- Reinicia tracking al cambiar de día.
- Registra tareas completadas.
- Evita registrar tareas que exceden el límite diario disponible.
- Activa alertas por consumo diario:
  - Amarilla: 80%.
  - Naranja: 90%.
  - Roja: 95%.
- Activa alerta por tarea individual cuando se supera el umbral del día.
- Guarda tracking diario en `token-usage.json`.
- Guarda resumen semanal en `token-weekly-usage.json`.
- Muestra recomendaciones según tokens restantes.

### Documentación

Archivo actualizado:

```text
README-TOKENS.md
```

Cambios:

- Agregado `token-plan.config.json` como archivo del sistema.
- Ajustada reserva de fin de semana al 20% semanal total.
- Actualizados comandos de registro con `-Tokens`.
- Agregado comando `-Weekly`.

## Distribución semanal implementada

| Día | Límite | Alerta por tarea |
|---|---:|---:|
| Lunes | 25% | >30% |
| Martes | 20% | >25% |
| Miércoles | 15% | >20% |
| Jueves | 10% | >15% |
| Viernes | 10% | >12% |
| Sábado | 10% | >25% |
| Domingo | 10% | >25% |

## Archivos de estado generados por el sistema

```text
token-usage.json
token-weekly-usage.json
```

Estos archivos contienen estado operativo y pueden cambiar diariamente.

## Flujo recomendado

### Inicio del día

```powershell
.\token-monitor.ps1
```

### Después de cada tarea

```powershell
.\token-monitor.ps1 -Task "Descripción corta" -Tokens 5
```

### Resumen semanal

```powershell
.\token-monitor.ps1 -Weekly
```

### Reinicio manual

```powershell
.\token-monitor.ps1 -Reset
```
