# Token Monitor Simplificado para SIGAH
param(
    [string]$TaskName = "",
    [int]$Tokens = 0,
    [switch]$Status,
    [switch]$Reset
)

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

$Day = (Get-Date).DayOfWeek.ToString()
$TrackingFile = "C:\PROYECTOS\sigah\token-usage.json"
$DailyLimit = $DailyLimits[$Day]

# Inicializar tracking
function Initialize-Tracking {
    $tracking = @{
        date = (Get-Date).ToString("yyyy-MM-dd")
        day = $Day
        daily_limit = $DailyLimit
        daily_tokens_used = 0
        tasks_completed = @()
        alerts_triggered = @()
    }
    
    $tracking | ConvertTo-Json -Depth 3 | Out-File -FilePath $TrackingFile -Encoding UTF8
    Write-Host "📊 Sistema inicializado para $Day" -ForegroundColor Green
    Write-Host "📈 Límite diario: $DailyLimit%" -ForegroundColor Yellow
    return $tracking
}

# Cargar tracking
function Load-Tracking {
    if (Test-Path $TrackingFile) {
        $content = Get-Content $TrackingFile -Raw | ConvertFrom-Json
        $currentDate = (Get-Date).ToString("yyyy-MM-dd")
        
        if ($content.date -ne $currentDate) {
            Write-Host "🔄 Nuevo día, reseteando..." -ForegroundColor Yellow
            return Initialize-Tracking
        }
        
        return $content
    } else {
        return Initialize-Tracking
    }
}

# Verificar alertas
function Check-Alerts($tracking) {
    $usage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
    
    if ($usage -ge 95 -and -not $tracking.alerts_triggered.Contains("ROJA")) {
        Write-Host "🔴 ALERTA ROJA: Modo emergencia! Uso: $([math]::Round($usage, 1))%" -ForegroundColor Red
        $tracking.alerts_triggered += "ROJA"
        Save-Tracking $tracking
    }
    elseif ($usage -ge 90 -and -not $tracking.alerts_triggered.Contains("NARANJA")) {
        Write-Host "🟠 ALERTA NARANJA: Alto riesgo! Uso: $([math]::Round($usage, 1))%" -ForegroundColor Yellow
        $tracking.alerts_triggered += "NARANJA"
        Save-Tracking $tracking
    }
    elseif ($usage -ge 80 -and -not $tracking.alerts_triggered.Contains("AMARILLA")) {
        Write-Host "⚠️ ALERTA AMARILLA: Cuidado! Uso: $([math]::Round($usage, 1))%" -ForegroundColor Yellow
        $tracking.alerts_triggered += "AMARILLA"
        Save-Tracking $tracking
    }
    
    return $usage
}

# Guardar tracking
function Save-Tracking($tracking) {
    $tracking | ConvertTo-Json -Depth 3 | Out-File -FilePath $TrackingFile -Encoding UTF8
}

# Mostrar estado
function Show-Status {
    $tracking = Load-Tracking
    $usage = Check-Alerts $tracking
    
    Write-Host "`n📊 ESTADO DE TOKENS" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "📅 Día: $($tracking.day)" -ForegroundColor White
    Write-Host "📈 Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage, 1))%)" -ForegroundColor $(if($usage -ge 90) {"Red"} elseif($usage -ge 80) {"Yellow"} else {"Green"})
    Write-Host "🔄 Disponible: $($tracking.daily_limit - $tracking.daily_tokens_used)%" -ForegroundColor White
    Write-Host "📋 Tareas: $($tracking.tasks_completed.Count)" -ForegroundColor White
    
    if ($tracking.alerts_triggered.Count -gt 0) {
        Write-Host "🚨 Alertas: $($tracking.alerts_triggered -join ', ')" -ForegroundColor Red
    }
}

# Registrar tarea
function Register-Task {
    if ($TaskName -eq "" -or $Tokens -eq 0) {
        Write-Host "❌ Especifica nombre de tarea y tokens: -TaskName 'tarea' -Tokens X" -ForegroundColor Red
        return
    }
    
    $tracking = Load-Tracking
    $tracking.daily_tokens_used += $Tokens
    
    $task = @{
        name = $TaskName
        tokens = $Tokens
        time = (Get-Date).ToString("HH:mm:ss")
        percentage = [math]::Round(($Tokens / $tracking.daily_limit) * 100, 2)
    }
    
    $tracking.tasks_completed += $task
    Save-Tracking $tracking
    
    Check-Alerts $tracking
    
    Write-Host "✅ Tarea registrada: $TaskName" -ForegroundColor Green
    Write-Host "📊 Tokens: $Tokens% ($($task.percentage)% del límite)" -ForegroundColor Cyan
    Show-Status
}

# Reset
if ($Reset) {
    Initialize-Tracking
    exit
}

# Status
if ($Status) {
    Show-Status
    exit
}

# Registrar tarea
if ($TaskName -ne "") {
    Register-Task
    exit
}

# Mostrar estado por defecto
Show-Status

# Sugerencias
$tracking = Load-Tracking
$usage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100

Write-Host "`n💡 SUGERENCIAS" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($usage -lt 50) {
    Write-Host "🚀 Alto consumo disponible:" -ForegroundColor Green
    Write-Host "• Nuevas funcionalidades" -ForegroundColor Gray
    Write-Host "• Desarrollo importante" -ForegroundColor Gray
}
elseif ($usage -lt 80) {
    Write-Host "⚡ Consumo moderado:" -ForegroundColor Yellow
    Write-Host "• Mejoras específicas" -ForegroundColor Gray
    Write-Host "• Optimización" -ForegroundColor Gray
}
elseif ($usage -lt 95) {
    Write-Host "🔋 Bajo consumo:" -ForegroundColor Yellow
    Write-Host "• Cambios menores" -ForegroundColor Gray
    Write-Host "• Documentación" -ForegroundColor Gray
}
else {
    Write-Host "🆘 Modo emergencia:" -ForegroundColor Red
    Write-Host "• Solo bugs críticos" -ForegroundColor Gray
    Write-Host "• Revisión sin cambios" -ForegroundColor Gray
}

Write-Host "`n📋 Comandos:" -ForegroundColor White
Write-Host "• .\token-monitor-simple.ps1" -ForegroundColor Gray
Write-Host "• .\token-monitor-simple.ps1 -TaskName 'tarea' -Tokens X" -ForegroundColor Gray
Write-Host "• .\token-monitor-simple.ps1 -Status" -ForegroundColor Gray
Write-Host "• .\token-monitor-simple.ps1 -Reset" -ForegroundColor Gray
