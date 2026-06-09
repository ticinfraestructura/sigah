# 🎯 Sistema de Optimización de Tokens - Instrucciones Rápidas

## 🚀 Inicio Diario (Cada Mañana)

```powershell
.\tokens-simple.ps1
```

## 📊 Ver Estado Actual (Cualquier Momento)

```powershell
.\tokens-estado.ps1
```

## ✅ Registrar Tarea Completada

```powershell
.\tokens-registrar.ps1 "Nombre de la tarea" X
```

Ejemplo:
```powershell
.\tokens-registrar.ps1 "Arreglar bug de login" 5
```

## 📋 Límites Diarios

- **Lunes**: 25% - Nuevas Funcionalidades
- **Martes**: 20% - Mejoras
- **Miércoles**: 15% - Mantenimiento
- **Jueves**: 10% - Documentación
- **Viernes**: 10% - Revisión
- **Sábado**: 10% - Reserva
- **Domingo**: 10% - Planificación

## 🚨 Alertas Automáticas

- **🟡 Amarilla (80%)**: Reduce complejidad
- **🟠 Naranja (90%)**: Solo tareas esenciales
- **🔴 Roja (95%)**: Modo emergencia

## 💡 Consejos Clave

### ✅ Haz Siempre
- Piensa antes de pedir código
- Usa `read_file` primero
- Sé específico en tus peticiones
- Registra cada tarea completada

### ❌ Nunca Hagas
- "Revisa todo el proyecto"
- "Explícame todo el sistema"
- "Mejora esto" (sin especificar)
- Reescribir código completo

## 🔋 Tareas de Emergencia (Bajo Consumo)

- Revisión de código sin cambios (1%)
- Actualización de comentarios (2%)
- Organización de archivos (1%)
- Documentación existente (2%)
- Planificación (1%)

## 📱 Flujo Diario Recomendado

1. **Mañana**: `.\tokens-simple.ps1`
2. **Antes de cada tarea**: `.\tokens-estado.ps1`
3. **Después de cada tarea**: `.\tokens-registrar.ps1 "tarea" X`
4. **Durante el día**: Monitorear consumo

## 🎯 Ejemplo Práctico

```powershell
# Inicio del día
.\tokens-simple.ps1

# Ver estado
.\tokens-estado.ps1

# Hacer una tarea (ej: arreglar bug)
.\tokens-registrar.ps1 "Arreglar bug de login" 5

# Ver estado actualizado
.\tokens-estado.ps1
```

## 🔄 Reset Automático

El sistema se resetea automáticamente cada día nuevo.

## 📁 Archivos del Sistema

- `tokens-simple.ps1` - Inicio y recomendaciones
- `tokens-estado.ps1` - Ver estado actual
- `tokens-registrar.ps1` - Registrar tareas
- `tokens-usage.json` - Datos de tracking (no editar manualmente)

## 🆘 Ayuda

Si tienes problemas:
1. Ejecuta `.\tokens-simple.ps1` para reiniciar
2. Verifica que estés en la carpeta correcta
3. Usa PowerShell (no CMD)

---

**Recuerda**: PIENSA → PLANIFICA → ACTÚA → MONITOREA
