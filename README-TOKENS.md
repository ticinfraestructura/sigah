# 🎯 Sistema de Optimización de Tokens - SIGAH

## 📋 Descripción General

Este sistema te ayuda a optimizar el consumo de tokens para que nunca te quedes sin capacidad de codificar. Incluye monitoreo en tiempo real, alertas automáticas y planificación diaria de tareas.

## 🚀 Inicio Rápido

### 1. Comienza tu día
```powershell
.\quick-start-tokens.ps1
```

### 2. Monitorea tu consumo
```powershell
.\token-monitor.ps1
```

### 3. Registra tus tareas
```powershell
.\token-monitor.ps1 -Task "Desarrollo de componente" 15
```

### 4. Planifica tu día
```powershell
.\daily-tasks-planner.ps1
```

## 📁 Archivos del Sistema

| Archivo | Función | Uso |
|---------|---------|-----|
| `quick-start-tokens.ps1` | Inicio rápido del día | Todas las mañanas |
| `token-monitor.ps1` | Monitoreo y alertas | Durante el día |
| `token-plan.config.json` | Configuración central del plan | Cambios de límites/alertas |
| `daily-tasks-planner.ps1` | Planificación de tareas | Planificación semanal |
| `README-TOKENS.md` | Esta guía | Referencia |

## 📊 Distribución Semanal de Tokens

| Día | Límite | Tipo de Trabajo | Intensidad |
|-----|--------|-----------------|------------|
| **Lunes** | 25% | Nuevas Funcionalidades | 🚀 Alta |
| **Martes** | 20% | Mejoras | ⚡ Media |
| **Miércoles** | 15% | Mantenimiento | 🔧 Media |
| **Jueves** | 10% | Documentación | 📚 Baja |
| **Viernes** | 10% | Revisión | 🧹 Baja |
| **Sábado** | 10% | Reserva | 🔄 Emergencia |
| **Domingo** | 10% | Reserva | 🔄 Emergencia |

> La reserva de fin de semana equivale al 20% semanal total, distribuida como 10% sábado y 10% domingo.

## 🚨 Sistema de Alertas

### 🟡 Alerta Amarilla (80% del límite)
- **Acción**: Reduce complejidad de tareas
- **Mensaje**: "⚠️ Acercándote al límite diario"

### 🟠 Alerta Naranja (90% del límite)
- **Acción**: Solo tareas esenciales
- **Mensaje**: "🟠 Alto riesgo de agotamiento"

### 🔴 Alerta Roja (95% del límite)
- **Acción**: Modo emergencia
- **Mensaje**: "🔴 Modo emergencia activado"

## 📋 Comandos Principales

### Monitoreo
```powershell
# Ver estado actual
.\token-monitor.ps1

# Registrar tarea completada
.\token-monitor.ps1 -Task "Nombre de tarea" -Tokens 10

# Resetear tracking (nuevo día)
.\token-monitor.ps1 -Reset

# Ver resumen semanal
.\token-monitor.ps1 -Weekly
```

### Planificación
```powershell
# Ver tareas de hoy
.\daily-tasks-planner.ps1

# Marcar tarea completada
.\daily-tasks-planner.ps1 -Complete 1

# Ver resumen semanal
.\daily-tasks-planner.ps1 -Weekly
```

### Inicio Rápido
```powershell
# Ver todo
.\quick-start-tokens.ps1

# Solo estado
.\quick-start-tokens.ps1 -Status

# Solo tareas de hoy
.\quick-start-tokens.ps1 -Today
```

## 💡 Estrategias de Ahorro

### ✅ Prácticas Recomendadas
- **Piensa antes de actuar**: Define claramente qué quieres hacer
- **Usa `read_file` primero**: Lee archivos antes de pedir cambios
- **Sé específico**: Pide cambios concretos, no reescrituras
- **Múltiples tools en paralelo**: Ahorra tokens en exploraciones

### ❌ Prácticas a Evitar
- **Exploraciones amplias**: "Revisa todo el proyecto"
- **Preguntas vagas**: "Mejora esto"
- **Resscrituras completas**: "Crea de nuevo el componente"
- **Consultas generales**: "Explícame todo el sistema"

## 🎯 Tareas por Nivel de Consumo

### 🚀 Alto Consumo (Disponible Lunes-Martes)
- Nuevas funcionalidades
- Desarrollo de componentes
- Refactoring importante
- Optimización compleja

### ⚡ Consumo Medio (Disponible Miércoles)
- Mejoras específicas
- Corrección de bugs
- Optimización simple
- Testing específico

### 🔋 Bajo Consumo (Disponible Jueves-Viernes)
- Cambios menores
- Documentación
- Revisión de código
- Organización

### 🆘 Modo Emergencia (Cualquier día)
- Solo bugs críticos
- Revisión sin cambios
- Planificación
- Investigación sin código

## 📈 Métricas y Monitoreo

### Indicadores Clave
- **Tokens por tarea**: No más del 10% del límite diario
- **Tiempo por tarea**: 30-45 minutos máximo
- **Tareas completadas**: Seguir ritmo diario
- **Alertas activadas**: Minimizar activación

### Dashboard Diario
```powershell
# Ver estado completo
.\token-monitor.ps1

# Ver sugerencias
.\quick-start-tokens.ps1 -Today
```

## 🔄 Flujo de Trabajo Recomendado

### Mañana (Inicio del Día)
1. **Ejecutar**: `.\quick-start-tokens.ps1`
2. **Revisar**: Tareas recomendadas del día
3. **Planificar**: Priorizar según límite de tokens

### Durante el Día
1. **Antes de cada tarea**: Verificar tokens disponibles
2. **Durante tarea**: Monitorear consumo
3. **Después de tarea**: Registrar inmediatamente

### Fin del Día
1. **Revisar**: Consumo total del día
2. **Planificar**: Día siguiente
3. **Ajustar**: Estrategia si es necesario

## 📱 Checklist Diario

### ✅ Antes de Empezar
- [ ] Ejecutar `.\quick-start-tokens.ps1`
- [ ] Verificar nivel de alerta
- [ ] Identificar tareas prioritarias
- [ ] Establecer límite de tiempo

### ✅ Durante el Día
- [ ] Monitorear consumo cada hora
- [ ] Registrar cada tarea completada
- [ ] Revisar alertas si aparecen
- [ ] Ajustar complejidad según consumo

### ✅ Al Finalizar
- [ ] Ver consumo total del día
- [ ] Registrar última tarea
- [ ] Planificar día siguiente
- [ ] Anotar lecciones aprendidas

## 🎪 Tareas de Relleno Productivo

Cuando tengas pocos tokens disponibles:

### 📚 Documentación (2-3% tokens)
- Actualizar README.md
- Agregar comentarios al código
- Crear guías de uso
- Documentar APIs

### 🔧 Mantenimiento (1-2% tokens)
- Organizar archivos
- Limpiar código muerto
- Actualizar dependencias
- Revisión de logs

### 📋 Planificación (1% tokens)
- Planificar próximas tareas
- Definir prioridades
- Investigar soluciones
- Leer documentación

### 🧪 Testing (2-3% tokens)
- Revisión de tests existentes
- Crear tests simples
- Validar funcionalidades
- Documentar casos de uso

## 🚨 Plan de Contingencia

### Si te quedas con <20% tokens
- **Modo**: Conservador
- **Tareas**: Solo críticas
- **Duración**: Hasta recarga

### Si te quedas con <10% tokens
- **Modo**: Emergencia
- **Tareas**: Solo bugs críticos
- **Duración**: Hasta recarga

### Si te quedas con <5% tokens
- **Modo**: Supervivencia
- **Tareas**: Solo lectura
- **Duración**: Hasta recarga

## 🔄 Mejora Continua

### Semanalmente
- Analizar consumo real vs planificado
- Identificar patrones de consumo
- Ajustar límites si es necesario
- Planificar siguiente semana

### Mensualmente
- Evaluar efectividad del sistema
- Optimizar estrategias de ahorro
- Identificar áreas de mejora
- Actualizar documentación

## 📞 Soporte y Ayuda

### Comandos de Ayuda
```powershell
# Ayuda general
.\quick-start-tokens.ps1 -Help

# Ayuda monitoreo
.\token-monitor.ps1

# Ayuda planificación
.\daily-tasks-planner.ps1
```

### Problemas Comunes
- **No se inicializa el tracking**: Ejecutar `.\token-monitor.ps1`
- **Alertas falsas**: Verificar archivo `token-usage.json`
- **Tareas no registradas**: Usar formato correcto de comando

## 🎯 Objetivos del Sistema

1. **Productividad Diaria**: Tener trabajo útil todos los días
2. **Sostenibilidad**: Nunca quedarse sin tokens
3. **Calidad**: Mantener alto estándar de trabajo
4. **Flexibilidad**: Adaptarse a necesidades cambiantes
5. **Mejora Continua**: Optimizar consumo constantemente

---

## 🚀 ¡Empieza Ahora!

```powershell
# Comienza tu día productivo
.\quick-start-tokens.ps1
```

**Recuerda**: La clave es **PIENSA → PLANIFICA → ACTÚA**

---

*Última actualización: Junio 2026*
