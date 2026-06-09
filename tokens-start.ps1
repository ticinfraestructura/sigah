# Token Start - Sistema simple de optimización de tokens
# Uso: .\tokens-start.ps1

# Obtener día actual
$Day = (Get-Date).DayOfWeek.ToString()
$Date = (Get-Date).ToString("yyyy-MM-dd")

# Límites diarios
$DailyLimits = @{
    "Monday" = 25
    "Tuesday" = 20
    "Wednesday" = 15
    "Thursday" = 10
    "Friday" = 10
    "Saturday" = 10
    "Sunday" = 10
}

$DailyLimit = $DailyLimits[$Day]
$TrackingFile = "C:\PROYECTOS\sigah\tokens-usage.json"

# Mostrar encabezado
Write-Host "🎯 TOKEN OPTIMIZATION SYSTEM - SIGAH" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Mostrar información del día
$DayName = switch ($Day) {
    "Monday" { "Lunes - Nuevas Funcionalidades" }
    "Tuesday" { "Martes - Mejoras" }
    "Wednesday" { "Miércoles - Mantenimiento" }
    "Thursday" { "Jueves - Documentación" }
    "Friday" { "Viernes - Revisión" }
    "Saturday" { "Sábado - Reserva" }
    "Sunday" { "Domingo - Planificación" }
}

Write-Host "📅 Hoy es: $DayName" -ForegroundColor White
Write-Host "📊 Límite de tokens: $DailyLimit%" -ForegroundColor Yellow
Write-Host ""

# Verificar si existe tracking
if (Test-Path $TrackingFile) {
    try {
        $tracking = Get-Content $TrackingFile -Raw | ConvertFrom-Json
        if ($tracking.date -eq $Date) {
            $usage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
            $available = $tracking.daily_limit - $tracking.daily_tokens_used
            
            Write-Host "📈 Estado actual:" -ForegroundColor White
            Write-Host "   Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage, 1))%)" -ForegroundColor $(if($usage -ge 90) {"Red"} elseif($usage -ge 80) {"Yellow"} else {"Green"})
            Write-Host "   Disponible: $available%" -ForegroundColor White
            Write-Host "   Tareas completadas: $($tracking.tasks_completed.Count)" -ForegroundColor White
            
            # Alertas
            if ($usage -ge 95) {
                Write-Host "   🔴 ALERTA ROJA: Modo emergencia!" -ForegroundColor Red
            }
            elseif ($usage -ge 90) {
                Write-Host "   🟠 ALERTA NARANJA: Alto riesgo!" -ForegroundColor Yellow
            }
            elseif ($usage -ge 80) {
                Write-Host "   ⚠️ ALERTA AMARILLA: Cuidado!" -ForegroundColor Yellow
            }
            
            Write-Host ""
        }
    }
    catch {
        Write-Host "📊 Estado: No inicializado" -ForegroundColor Yellow
    }
}

# Tareas recomendadas según día
Write-Host "📋 TAREAS RECOMENDADAS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

switch ($Day) {
    "Monday" {
        Write-Host "🚀 ALTO CONSUMO DISPONIBLE" -ForegroundColor Green
        Write-Host "• Revisión de requerimientos pendientes (3%)" -ForegroundColor Gray
        Write-Host "• Desarrollo de componente principal (15%)" -ForegroundColor Gray
        Write-Host "• Testing y validación (5%)" -ForegroundColor Gray
        Write-Host "• Documentación de cambios (2%)" -ForegroundColor Gray
    }
    "Tuesday" {
        Write-Host "⚡ CONSUMO MODERADO" -ForegroundColor Yellow
        Write-Host "• Revisión de código existente (3%)" -ForegroundColor Gray
        Write-Host "• Optimización de consultas SQL (8%)" -ForegroundColor Gray
        Write-Host "• Mejoras de UI/UX (6%)" -ForegroundColor Gray
        Write-Host "• Refactoring específico (3%)" -ForegroundColor Gray
    }
    "Wednesday" {
        Write-Host "🔧 CONSUMO MEDIO" -ForegroundColor Yellow
        Write-Host "• Identificación de bugs (2%)" -ForegroundColor Gray
        Write-Host "• Corrección de errores (8%)" -ForegroundColor Gray
        Write-Host "• Validación de soluciones (3%)" -ForegroundColor Gray
        Write-Host "• Actualización de dependencias (2%)" -ForegroundColor Gray
    }
    "Thursday" {
        Write-Host "📚 BAJO CONSUMO" -ForegroundColor Green
        Write-Host "• Actualización de README.md (2%)" -ForegroundColor Gray
        Write-Host "• Comentarios en código crítico (3%)" -ForegroundColor Gray
        Write-Host "• Creación de guías de uso (3%)" -ForegroundColor Gray
        Write-Host "• Planificación próxima semana (2%)" -ForegroundColor Gray
    }
    "Friday" {
        Write-Host "🧹 BAJO CONSUMO" -ForegroundColor Green
        Write-Host "• Code review semanal (3%)" -ForegroundColor Gray
        Write-Host "• Refactoring menor (2%)" -ForegroundColor Gray
        Write-Host "• Organización de archivos (2%)" -ForegroundColor Gray
        Write-Host "• Limpieza de código muerto (3%)" -ForegroundColor Gray
    }
    default {
        Write-Host "🔄 CONSUMO DE RESERVA" -ForegroundColor Green
        Write-Host "• Experimentación con nuevas tecnologías (4%)" -ForegroundColor Gray
        Write-Host "• Aprendizaje y documentación (3%)" -ForegroundColor Gray
        Write-Host "• Emergencias y tareas críticas (3%)" -ForegroundColor Gray
    }
}

Write-Host ""

# Consejos del día
Write-Host "💡 CONSEJOS DEL DÍA" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

switch ($Day) {
    "Monday" {
        Write-Host "🚀 Hoy es día de alta intensidad:" -ForegroundColor Green
        Write-Host "• Prioriza las tareas más importantes primero" -ForegroundColor Gray
        Write-Host "• Usa read_file en paralelo para ahorrar tokens" -ForegroundColor Gray
        Write-Host "• Evita exploraciones amplias del proyecto" -ForegroundColor Gray
    }
    "Tuesday" {
        Write-Host "⚡ Hoy es día de mejoras:" -ForegroundColor Yellow
        Write-Host "• Enfócate en optimización específica" -ForegroundColor Gray
        Write-Host "• Usa edit en lugar de reescribir código" -ForegroundColor Gray
        Write-Host "• Prioriza bugs críticos" -ForegroundColor Gray
    }
    "Wednesday" {
        Write-Host "🔧 Hoy es día de mantenimiento:" -ForegroundColor Yellow
        Write-Host "• Cambios mínimos y específicos" -ForegroundColor Gray
        Write-Host "• Una línea a la vez" -ForegroundColor Gray
        Write-Host "• Documenta cada cambio" -ForegroundColor Gray
    }
    "Thursday" {
        Write-Host "📚 Hoy es día de documentación:" -ForegroundColor Green
        Write-Host "• Solo lectura y comentarios" -ForegroundColor Gray
        Write-Host "• Planificación sin código" -ForegroundColor Gray
        Write-Host "• Organización de archivos" -ForegroundColor Gray
    }
    "Friday" {
        Write-Host "🧹 Hoy es día de limpieza:" -ForegroundColor Green
        Write-Host "• Revisión sin cambios" -ForegroundColor Gray
        Write-Host "• Code review eficiente" -ForegroundColor Gray
        Write-Host "• Prepara para la semana siguiente" -ForegroundColor Gray
    }
    default {
        Write-Host "🔄 Hoy es día de reserva:" -ForegroundColor Green
        Write-Host "• Solo emergencias si es necesario" -ForegroundColor Gray
        Write-Host "• Aprendizaje y experimentación" -ForegroundColor Gray
        Write-Host "• Conserva tokens para la semana" -ForegroundColor Gray
    }
}

Write-Host ""

# Comandos útiles
Write-Host "⚡ COMANDOS ÚTILES" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Iniciar día: .\tokens-start.ps1" -ForegroundColor Gray
Write-Host "• Registrar tarea: (Manual) Editar tokens-usage.json" -ForegroundColor Gray
Write-Host "• Ver estado: .\tokens-start.ps1" -ForegroundColor Gray
Write-Host ""

# Tareas de bajo consumo
Write-Host "🔋 TAREAS DE BAJO CONSUMO (Emergencia)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• Revisión de código sin cambios (1%)" -ForegroundColor Gray
Write-Host "• Actualización de comentarios (2%)" -ForegroundColor Gray
Write-Host "• Organización de archivos (1%)" -ForegroundColor Gray
Write-Host "• Documentación existente (2%)" -ForegroundColor Gray
Write-Host "• Planificación de próximas tareas (1%)" -ForegroundColor Gray
Write-Host "• Investigación sin código (2%)" -ForegroundColor Gray
Write-Host ""

# Resumen semanal
Write-Host "📊 RESUMEN SEMANAL" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Lunes: 25% - Nuevas Funcionalidades" -ForegroundColor White
Write-Host "Martes: 20% - Mejoras" -ForegroundColor White
Write-Host "Miércoles: 15% - Mantenimiento" -ForegroundColor White
Write-Host "Jueves: 10% - Documentación" -ForegroundColor White
Write-Host "Viernes: 10% - Revisión" -ForegroundColor White
Write-Host "Sábado: 10% - Reserva" -ForegroundColor White
Write-Host "Domingo: 10% - Planificación" -ForegroundColor White
Write-Host ""
Write-Host "📈 Total semanal: 100%" -ForegroundColor Green
Write-Host "🔄 Promedio diario: 14.3%" -ForegroundColor Yellow
Write-Host ""

# Mensaje final
Write-Host "🎯 RECUERDA:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "• PIENSA antes de actuar" -ForegroundColor White
Write-Host "• PLANIFICA tus tareas" -ForegroundColor White
Write-Host "• ACTÚA con precisión" -ForegroundColor White
Write-Host "• MONITOREA tu consumo" -ForegroundColor White
Write-Host ""

Write-Host "✅ ¡Buen día de trabajo productivo!" -ForegroundColor Green
