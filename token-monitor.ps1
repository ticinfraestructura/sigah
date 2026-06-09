# Token Monitor for SIGAH Development
# Sistema de monitoreo de tokens con alertas

param(
    [string]$Day = (Get-Date).DayOfWeek.ToString(),
    [int]$TotalTokens = 1000,
    [switch]$Reset
)

# Límites diarios según el plan
$DailyLimits = @{
    "Monday"    = 25  # Lunes - Nuevas funcionalidades
    "Tuesday"   = 20  # Martes - Mejoras
    "Wednesday" = 15  # Miércoles - Mantenimiento
    "Thursday"  = 10  # Jueves - Documentación
    "Friday"    = 10  # Viernes - Revisión
    "Saturday"  = 10  # Sábado - Reserva
    "Sunday"    = 10  # Domingo - Reserva
}

# Archivo de tracking
$TrackingFile = "C:\PROYECTOS\sigah\token-usage.json"

# Función para inicializar tracking
function Initialize-Tracking {
    $tracking = @{
        date = (Get-Date).ToString("yyyy-MM-dd")
        day = $Day
        daily_limit = $DailyLimits[$Day]
        daily_tokens_used = 0
        total_tokens_available = $TotalTokens
        tasks_completed = @()
        alerts_triggered = @()
        last_reset = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $tracking | ConvertTo-Json -Depth 3 | Out-File -FilePath $TrackingFile -Encoding UTF8
    Write-Host "📊 Sistema de tracking inicializado para $Day" -ForegroundColor Green
    Write-Host "📈 Límite diario: $($tracking.daily_limit)% del total" -ForegroundColor Yellow
}

# Función para cargar tracking existente
function Load-Tracking {
    if (Test-Path $TrackingFile) {
        $content = Get-Content $TrackingFile -Raw | ConvertFrom-Json
        $currentDate = (Get-Date).ToString("yyyy-MM-dd")
        
        # Reset si es nuevo día
        if ($content.date -ne $currentDate) {
            Write-Host "🔄 Nuevo día detectado, reseteando tracking..." -ForegroundColor Yellow
            Initialize-Tracking
            return Load-Tracking
        }
        
        return $content
    } else {
        Initialize-Tracking
        return Load-Tracking
    }
}

# Función para verificar alertas
function Check-Alerts($tracking) {
    $usage_percentage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
    
    # Alerta Roja - Crítico
    if ($usage_percentage -ge 95) {
        if (-not $tracking.alerts_triggered.Contains("ROJA")) {
            Write-Host "🔴 ALERTA ROJA: Modo emergencia activado! Consumo: $([math]::Round($usage_percentage, 1))%" -ForegroundColor Red
            Write-Host "⚠️ Solo realizar tareas críticas absolutamente necesarias" -ForegroundColor Red
            $tracking.alerts_triggered += "ROJA"
            Save-Tracking $tracking
        }
    }
    # Alerta Naranja - Alto Riesgo
    elseif ($usage_percentage -ge 90) {
        if (-not $tracking.alerts_triggered.Contains("NARANJA")) {
            Write-Host "🟠 ALERTA NARANJA: Alto riesgo de agotamiento! Consumo: $([math]::Round($usage_percentage, 1))%" -ForegroundColor Yellow
            Write-Host "⚠️ Solo tareas esenciales permitidas" -ForegroundColor Yellow
            $tracking.alerts_triggered += "NARANJA"
            Save-Tracking $tracking
        }
    }
    # Alerta Amarilla - Precaución
    elseif ($usage_percentage -ge 80) {
        if (-not $tracking.alerts_triggered.Contains("AMARILLA")) {
            Write-Host "⚠️ ALERTA AMARILLA: Acercándote al límite diario! Consumo: $([math]::Round($usage_percentage, 1))%" -ForegroundColor Yellow
            Write-Host "💡 Reduce la complejidad de las tareas" -ForegroundColor Yellow
            $tracking.alerts_triggered += "AMARILLA"
            Save-Tracking $tracking
        }
    }
    
    return $usage_percentage
}

# Función para guardar tracking
function Save-Tracking($tracking) {
    $tracking | ConvertTo-Json -Depth 3 | Out-File -FilePath $TrackingFile -Encoding UTF8
}

# Función para registrar tarea
function Register-Task($taskName, $tokensUsed) {
    $tracking = Load-Tracking
    $tracking.daily_tokens_used += $tokensUsed
    
    $task = @{
        name = $taskName
        tokens = $tokensUsed
        time = (Get-Date).ToString("HH:mm:ss")
        percentage = [math]::Round(($tokensUsed / $tracking.daily_limit) * 100, 2)
    }
    
    $tracking.tasks_completed += $task
    Save-Tracking $tracking
    
    Check-Alerts $tracking
    
    Write-Host "✅ Tarea registrada: $taskName" -ForegroundColor Green
    Write-Host "📊 Tokens usados: $tokensUsed ($($task.percentage)% del límite)" -ForegroundColor Cyan
}

# Función para mostrar estado actual
function Show-Status {
    $tracking = Load-Tracking
    $usage_percentage = Check-Alerts $tracking
    
    Write-Host "`n📊 ESTADO ACTUAL DE TOKENS" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📅 Día: $($tracking.day)" -ForegroundColor White
    Write-Host "🎯 Límite diario: $($tracking.daily_limit)%" -ForegroundColor White
    Write-Host "📈 Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage_percentage, 1))%)" -ForegroundColor $(if($usage_percentage -ge 90) {"Red"} elseif($usage_percentage -ge 80) {"Yellow"} else {"Green"})
    Write-Host "🔄 Disponible: $($tracking.daily_limit - $tracking.daily_tokens_used)%" -ForegroundColor White
    Write-Host "📋 Tareas completadas: $($tracking.tasks_completed.Count)" -ForegroundColor White
    
    if ($tracking.alerts_triggered.Count -gt 0) {
        Write-Host "🚨 Alertas activas: $($tracking.alerts_triggered -join ', ')" -ForegroundColor Red
    }
    
    Write-Host "`n📝 Últimas tareas:" -ForegroundColor White
    $tracking.tasks_completed | Select-Object -Last 3 | ForEach-Object {
        Write-Host "  • $($_.name) - $($_.tokens)% ($($_.time))" -ForegroundColor Gray
    }
}

# Función para sugerir tareas según nivel de consumo
function Suggest-Tasks {
    $tracking = Load-Tracking
    $usage_percentage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
    
    Write-Host "`n💡 SUGERENCIAS DE TAREAS" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    if ($usage_percentage -lt 50) {
        Write-Host "🚀 Alto consumo disponible:" -ForegroundColor Green
        Write-Host "  • Nuevas funcionalidades" -ForegroundColor Gray
        Write-Host "  • Refactoring importante" -ForegroundColor Gray
        Write-Host "  • Desarrollo de componentes" -ForegroundColor Gray
    }
    elseif ($usage_percentage -lt 80) {
        Write-Host "⚡ Consumo moderado:" -ForegroundColor Yellow
        Write-Host "  • Mejoras específicas" -ForegroundColor Gray
        Write-Host "  • Optimización de código" -ForegroundColor Gray
        Write-Host "  • Corrección de bugs" -ForegroundColor Gray
    }
    elseif ($usage_percentage -lt 95) {
        Write-Host "🔋 Bajo consumo:" -ForegroundColor Yellow
        Write-Host "  • Cambios menores" -ForegroundColor Gray
        Write-Host "  • Documentación" -ForegroundColor Gray
        Write-Host "  • Testing específico" -ForegroundColor Gray
    }
    else {
        Write-Host "🆘 Modo emergencia:" -ForegroundColor Red
        Write-Host "  • Solo bugs críticos" -ForegroundColor Gray
        Write-Host "  • Revisión sin cambios" -ForegroundColor Gray
        Write-Host "  • Planificación" -ForegroundColor Gray
    }
}

# Reset manual si se solicita
if ($Reset) {
    Initialize-Tracking
    Write-Host "🔄 Tracking reseteado manualmente" -ForegroundColor Green
    exit
}

# Mostrar ayuda si no hay parámetros específicos
if ($args.Count -eq 0) {
    Write-Host "🎯 TOKEN MONITOR PARA SIGAH" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor White
    Write-Host "  .\token-monitor.ps1                    - Mostrar estado actual" -ForegroundColor Gray
    Write-Host "  .\token-monitor.ps1 -Reset            - Resetear tracking" -ForegroundColor Gray
    Write-Host "  .\token-monitor.ps1 -Task 'nombre' X   - Registrar tarea con X% de tokens" -ForegroundColor Gray
    Write-Host ""
    Show-Status
    Suggest-Tasks
    exit
}

# Registrar tarea si se especifica
if ($args.Count -ge 2 -and $args[0] -eq "-Task") {
    $taskName = $args[1]
    $tokensUsed = if ($args.Count -ge 3) { [int]$args[2] } else { 5 }
    Register-Task $taskName $tokensUsed
    Show-Status
    exit
}

# Mostrar estado por defecto
Show-Status
Suggest-Tasks
