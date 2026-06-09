# Quick Start Token Optimization
# Script rápido para comenzar el día con optimización de tokens

param(
    [switch]$Status,
    [switch]$Today,
    [switch]$Help
)

# Función para mostrar estado rápido
function Show-QuickStatus {
    Write-Host "🚀 QUICK START - TOKENS SIGAH" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    # Verificar día actual
    $day = (Get-Date).DayOfWeek.ToString()
    $dayName = switch ($day) {
        "Monday" { "Lunes - Nuevas Funcionalidades" }
        "Tuesday" { "Martes - Mejoras" }
        "Wednesday" { "Miércoles - Mantenimiento" }
        "Thursday" { "Jueves - Documentación" }
        "Friday" { "Viernes - Revisión" }
        "Saturday" { "Sábado - Reserva" }
        "Sunday" { "Domingo - Planificación" }
    }
    
    Write-Host "📅 Hoy es: $dayName" -ForegroundColor White
    Write-Host ""
    
    # Verificar estado del monitor
    $trackingFile = "C:\PROYECTOS\sigah\token-usage.json"
    if (Test-Path $trackingFile) {
        $tracking = Get-Content $trackingFile -Raw | ConvertFrom-Json
        $usage_percentage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
        
        Write-Host "📊 Estado actual:" -ForegroundColor White
        Write-Host "   Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage_percentage, 1))%)" -ForegroundColor $(if($usage_percentage -ge 90) {"Red"} elseif($usage_percentage -ge 80) {"Yellow"} else {"Green"})
        Write-Host "   Disponible: $($tracking.daily_limit - $tracking.daily_tokens_used)%" -ForegroundColor White
        Write-Host "   Tareas completadas: $($tracking.tasks_completed.Count)" -ForegroundColor White
        
        if ($tracking.alerts_triggered.Count -gt 0) {
            Write-Host "   🚨 Alertas: $($tracking.alerts_triggered -join ', ')" -ForegroundColor Red
        }
    } else {
        Write-Host "📊 Estado: No inicializado" -ForegroundColor Yellow
        Write-Host "💡 Ejecuta: .\token-monitor.ps1 para inicializar" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# Función para mostrar tareas de hoy
function Show-TodayTasks {
    $day = (Get-Date).DayOfWeek.ToString()
    
    Write-Host "📋 TAREAS RECOMENDADAS PARA HOY" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    # Tareas según el día
    switch ($day) {
        "Monday" {
            Write-Host "🚀 ALTO CONSUMO DISPONIBLE (25%)" -ForegroundColor Green
            Write-Host "• Revisión de requerimientos pendientes" -ForegroundColor Gray
            Write-Host "• Desarrollo de componente principal" -ForegroundColor Gray
            Write-Host "• Testing y validación" -ForegroundColor Gray
            Write-Host "• Documentación de cambios" -ForegroundColor Gray
        }
        "Tuesday" {
            Write-Host "⚡ CONSUMO MODERADO (20%)" -ForegroundColor Yellow
            Write-Host "• Revisión de código existente" -ForegroundColor Gray
            Write-Host "• Optimización de consultas SQL" -ForegroundColor Gray
            Write-Host "• Mejoras de UI/UX" -ForegroundColor Gray
            Write-Host "• Refactoring específico" -ForegroundColor Gray
        }
        "Wednesday" {
            Write-Host "🔧 CONSUMO MEDIO (15%)" -ForegroundColor Yellow
            Write-Host "• Identificación de bugs" -ForegroundColor Gray
            Write-Host "• Corrección de errores" -ForegroundColor Gray
            Write-Host "• Validación de soluciones" -ForegroundColor Gray
            Write-Host "• Actualización de dependencias" -ForegroundColor Gray
        }
        "Thursday" {
            Write-Host "📚 BAJO CONSUMO (10%)" -ForegroundColor Green
            Write-Host "• Actualización de README" -ForegroundColor Gray
            Write-Host "• Comentarios en código" -ForegroundColor Gray
            Write-Host "• Creación de guías" -ForegroundColor Gray
            Write-Host "• Planificación" -ForegroundColor Gray
        }
        "Friday" {
            Write-Host "🧹 BAJO CONSUMO (10%)" -ForegroundColor Green
            Write-Host "• Code review semanal" -ForegroundColor Gray
            Write-Host "• Refactoring menor" -ForegroundColor Gray
            Write-Host "• Organización de archivos" -ForegroundColor Gray
            Write-Host "• Limpieza de código" -ForegroundColor Gray
        }
        default {
            Write-Host "🔄 CONSUMO DE RESERVA (10%)" -ForegroundColor Green
            Write-Host "• Experimentación" -ForegroundColor Gray
            Write-Host "• Aprendizaje" -ForegroundColor Gray
            Write-Host "• Emergencias" -ForegroundColor Gray
            Write-Host "• Planificación" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
}

# Función para mostrar comandos rápidos
function Show-QuickCommands {
    Write-Host "⚡ COMANDOS RÁPIDOS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📊 Ver estado:" -ForegroundColor White
    Write-Host "   .\token-monitor.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📋 Ver tareas de hoy:" -ForegroundColor White
    Write-Host "   .\daily-tasks-planner.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Registrar tarea:" -ForegroundColor White
    Write-Host "   .\token-monitor.ps1 -Task 'nombre' X" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔄 Completar tarea:" -ForegroundColor White
    Write-Host "   .\daily-tasks-planner.ps1 -Complete X" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📈 Ver resumen semanal:" -ForegroundColor White
    Write-Host "   .\daily-tasks-planner.ps1 -Weekly" -ForegroundColor Gray
    Write-Host ""
}

# Función para mostrar consejos del día
function Show-DailyTips {
    $day = (Get-Date).DayOfWeek.ToString()
    
    Write-Host "💡 CONSEJOS DEL DÍA" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    switch ($day) {
        "Monday" {
            Write-Host "🚀 Hoy es día de alta intensidad:" -ForegroundColor Green
            Write-Host "• Prioriza las tareas más importantes primero" -ForegroundColor Gray
            Write-Host "• Usa `read_file` en paralelo para ahorrar tokens" -ForegroundColor Gray
            Write-Host "• Evita exploraciones amplias del proyecto" -ForegroundColor Gray
        }
        "Tuesday" {
            Write-Host "⚡ Hoy es día de mejoras:" -ForegroundColor Yellow
            Write-Host "• Enfócate en optimización específica" -ForegroundColor Gray
            Write-Host "• Usa `edit` en lugar de reescribir código" -ForegroundColor Gray
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
}

# Mostrar ayuda
if ($Help) {
    Write-Host "🎯 QUICK START TOKEN OPTIMIZATION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor White
    Write-Host "  .\quick-start-tokens.ps1              - Mostrar todo (por defecto)" -ForegroundColor Gray
    Write-Host "  .\quick-start-tokens.ps1 -Status      - Solo estado actual" -ForegroundColor Gray
    Write-Host "  .\quick-start-tokens.ps1 -Today       - Solo tareas de hoy" -ForegroundColor Gray
    Write-Host "  .\quick-start-tokens.ps1 -Help        - Esta ayuda" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Uso recomendado:" -ForegroundColor White
    Write-Host "  1. Ejecutar al inicio del día" -ForegroundColor Gray
    Write-Host "  2. Seguir las recomendaciones" -ForegroundColor Gray
    Write-Host "  3. Registrar cada tarea completada" -ForegroundColor Gray
    Write-Host "  4. Monitorear consumo constantemente" -ForegroundColor Gray
    Write-Host ""
    exit
}

# Ejecutar según parámetros
if ($Status) {
    Show-QuickStatus
    Show-QuickCommands
    exit
}

if ($Today) {
    Show-TodayTasks
    Show-DailyTips
    exit
}

# Mostrar todo por defecto
Show-QuickStatus
Show-TodayTasks
Show-DailyTips
Show-QuickCommands
