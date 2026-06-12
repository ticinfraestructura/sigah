# Token Monitor for SIGAH Development
# Sistema de monitoreo de tokens con alertas basado en token-plan.config.json

param(
    [string]$Day = (Get-Date).DayOfWeek.ToString(),
    [int]$TotalTokens = 1000,
    [string]$Task = "",
    [int]$Tokens = 0,
    [switch]$Reset,
    [switch]$Weekly
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigFile = Join-Path $ProjectRoot "token-plan.config.json"
$TrackingFile = Join-Path $ProjectRoot "token-usage.json"
$WeeklyFile = Join-Path $ProjectRoot "token-weekly-usage.json"

function Get-TokenConfig {
    if (-not (Test-Path $ConfigFile)) {
        throw "No existe el archivo de configuración: $ConfigFile"
    }

    return Get-Content $ConfigFile -Raw | ConvertFrom-Json
}

function Get-DayPlan {
    param($config, [string]$dayName)
    return $config.weeklyDistribution.$dayName
}

function Save-Tracking {
    param($tracking)
    $tracking | ConvertTo-Json -Depth 6 | Out-File -FilePath $TrackingFile -Encoding UTF8
}

function New-Tracking {
    $config = Get-TokenConfig
    $dayPlan = Get-DayPlan $config $Day

    if (-not $dayPlan) {
        throw "Dia no soportado: $Day"
    }

    $tracking = [ordered]@{
        date = (Get-Date).ToString("yyyy-MM-dd")
        day = $Day
        day_label = $dayPlan.label
        daily_limit = [int]$dayPlan.limit
        single_task_alert = [int]$dayPlan.singleTaskAlert
        focus = $dayPlan.focus
        daily_tokens_used = 0
        total_tokens_available = $TotalTokens
        tasks_completed = @()
        alerts_triggered = @()
        last_reset = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }

    Save-Tracking $tracking
    Write-Host "Sistema de tracking inicializado para $($dayPlan.label)" -ForegroundColor Green
    Write-Host "Limite diario: $($tracking.daily_limit)% del total semanal" -ForegroundColor Yellow
    return $tracking
}

function Load-Tracking {
    $currentDate = (Get-Date).ToString("yyyy-MM-dd")

    if (Test-Path $TrackingFile) {
        $content = Get-Content $TrackingFile -Raw | ConvertFrom-Json

        if ($content.date -eq $currentDate) {
            return $content
        }

        Write-Host "Nuevo dia detectado, reiniciando tracking diario..." -ForegroundColor Yellow
    }

    return New-Tracking
}

function Load-Weekly {
    $weekKey = "{0}-{1}" -f (Get-Date).Year, (Get-Culture).Calendar.GetWeekOfYear((Get-Date), [System.Globalization.CalendarWeekRule]::FirstFourDayWeek, [DayOfWeek]::Monday)

    if (Test-Path $WeeklyFile) {
        $weekly = Get-Content $WeeklyFile -Raw | ConvertFrom-Json
        if ($weekly.week -eq $weekKey) {
            return $weekly
        }
    }

    return [ordered]@{
        week = $weekKey
        started_at = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        days = @()
    }
}

function Save-WeeklyDay {
    param($tracking)
    $weekly = Load-Weekly
    $days = @($weekly.days | Where-Object { $_.date -ne $tracking.date })
    $days += [ordered]@{
        date = $tracking.date
        day = $tracking.day
        day_label = $tracking.day_label
        limit = $tracking.daily_limit
        used = $tracking.daily_tokens_used
        tasks = @($tracking.tasks_completed).Count
        alerts = $tracking.alerts_triggered
    }
    $weekly.days = $days
    $weekly | ConvertTo-Json -Depth 6 | Out-File -FilePath $WeeklyFile -Encoding UTF8
}

function Add-Alert {
    param($tracking, [string]$code, [string]$message)

    if (-not @($tracking.alerts_triggered).Contains($code)) {
        $tracking.alerts_triggered += $code
        Write-Host $message -ForegroundColor $(if ($code -eq "ROJA") { "Red" } else { "Yellow" })
    }
}

function Check-Alerts {
    param($tracking)
    $config = Get-TokenConfig
    $usage = if ($tracking.daily_limit -gt 0) { ($tracking.daily_tokens_used / $tracking.daily_limit) * 100 } else { 0 }

    if ($usage -ge $config.alerts.red.threshold) {
        Add-Alert $tracking $config.alerts.red.code $config.alerts.red.message
        Write-Host $config.alerts.red.action -ForegroundColor Red
    }
    elseif ($usage -ge $config.alerts.orange.threshold) {
        Add-Alert $tracking $config.alerts.orange.code $config.alerts.orange.message
        Write-Host $config.alerts.orange.action -ForegroundColor Yellow
    }
    elseif ($usage -ge $config.alerts.yellow.threshold) {
        Add-Alert $tracking $config.alerts.yellow.code $config.alerts.yellow.message
        Write-Host $config.alerts.yellow.action -ForegroundColor Yellow
    }

    Save-Tracking $tracking
    Save-WeeklyDay $tracking
    return $usage
}

function Check-SingleTaskAlert {
    param($tracking, [int]$tokensUsed)

    if ($tokensUsed -gt $tracking.single_task_alert) {
        $code = "TAREA_ALTA_$($tracking.date)_$((Get-Date).ToString('HHmmss'))"
        $tracking.alerts_triggered += $code
        Write-Host "ALERTA POR TAREA: esta tarea consumio $tokensUsed%, supera el umbral de $($tracking.single_task_alert)% para $($tracking.day_label)." -ForegroundColor Yellow
    }
}

function Register-Task {
    param([string]$taskName, [int]$tokensUsed)

    if ([string]::IsNullOrWhiteSpace($taskName) -or $tokensUsed -le 0) {
        Write-Host "Uso: .\token-monitor.ps1 -Task 'Nombre de tarea' -Tokens 5" -ForegroundColor Red
        exit 1
    }

    $tracking = Load-Tracking
    $remaining = $tracking.daily_limit - $tracking.daily_tokens_used

    if ($tokensUsed -gt $remaining) {
        Write-Host "La tarea excede el limite diario. Disponible: $remaining%, solicitado: $tokensUsed%." -ForegroundColor Red
        Write-Host "Registra una tarea menor o cambia a modo conservador." -ForegroundColor Yellow
        exit 1
    }

    $taskRecord = [ordered]@{
        name = $taskName
        tokens = $tokensUsed
        time = (Get-Date).ToString("HH:mm:ss")
        percentage = [math]::Round(($tokensUsed / $tracking.daily_limit) * 100, 2)
    }

    $tracking.daily_tokens_used = [int]$tracking.daily_tokens_used + $tokensUsed
    $tracking.tasks_completed += $taskRecord

    Check-SingleTaskAlert $tracking $tokensUsed
    Save-Tracking $tracking
    $usage = Check-Alerts $tracking

    Write-Host "Tarea registrada: $taskName" -ForegroundColor Green
    Write-Host "Tokens usados: $tokensUsed% ($($taskRecord.percentage)% del limite diario)" -ForegroundColor Cyan
    Write-Host "Uso diario actual: $([math]::Round($usage, 1))%" -ForegroundColor Cyan
}

function Show-Status {
    $tracking = Load-Tracking
    $usage = Check-Alerts $tracking
    $remaining = $tracking.daily_limit - $tracking.daily_tokens_used

    Write-Host ""
    Write-Host "ESTADO ACTUAL DE TOKENS" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host "Dia: $($tracking.day_label) ($($tracking.day))" -ForegroundColor White
    Write-Host "Enfoque: $($tracking.focus)" -ForegroundColor White
    Write-Host "Limite diario: $($tracking.daily_limit)%" -ForegroundColor White
    Write-Host "Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage, 1))%)" -ForegroundColor $(if ($usage -ge 90) { "Red" } elseif ($usage -ge 80) { "Yellow" } else { "Green" })
    Write-Host "Disponible: $remaining%" -ForegroundColor White
    Write-Host "Tareas completadas: $(@($tracking.tasks_completed).Count)" -ForegroundColor White

    if (@($tracking.alerts_triggered).Count -gt 0) {
        Write-Host "Alertas activas: $($tracking.alerts_triggered -join ', ')" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "Ultimas tareas:" -ForegroundColor White
    @($tracking.tasks_completed) | Select-Object -Last 5 | ForEach-Object {
        Write-Host "  - $($_.name): $($_.tokens)% ($($_.time))" -ForegroundColor Gray
    }
}

function Show-Suggestions {
    $tracking = Load-Tracking
    $remaining = $tracking.daily_limit - $tracking.daily_tokens_used
    $usage = if ($tracking.daily_limit -gt 0) { ($tracking.daily_tokens_used / $tracking.daily_limit) * 100 } else { 0 }
    $remainingRate = 100 - $usage
    $config = Get-TokenConfig

    Write-Host ""
    Write-Host "SUGERENCIAS" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray

    if ($remainingRate -lt 5) {
        Write-Host $config.contingency.under5 -ForegroundColor Red
    }
    elseif ($remainingRate -lt 10) {
        Write-Host $config.contingency.under10 -ForegroundColor Red
    }
    elseif ($remainingRate -lt 20 -or $usage -ge 80) {
        Write-Host $config.contingency.under20 -ForegroundColor Yellow
    }
    elseif ($usage -lt 50) {
        Write-Host "Puedes hacer desarrollo activo, manteniendo tareas acotadas." -ForegroundColor Green
    }
    else {
        Write-Host "Prioriza mejoras especificas, bugs y validaciones cortas." -ForegroundColor Yellow
    }
}

function Show-Weekly {
    $config = Get-TokenConfig
    $weekly = Load-Weekly

    Write-Host ""
    Write-Host "RESUMEN SEMANAL DE TOKENS" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray

    foreach ($dayName in @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")) {
        $plan = Get-DayPlan $config $dayName
        $record = @($weekly.days | Where-Object { $_.day -eq $dayName } | Select-Object -Last 1)
        $used = if ($record.Count -gt 0) { $record[0].used } else { 0 }
        Write-Host "$($plan.label): limite $($plan.limit)% | usado $used% | $($plan.focus)" -ForegroundColor White
    }
}

if ($Reset) {
    New-Tracking | Out-Null
    Write-Host "Tracking reseteado manualmente" -ForegroundColor Green
    exit 0
}

if ($Weekly) {
    Show-Weekly
    exit 0
}

if (-not [string]::IsNullOrWhiteSpace($Task)) {
    Register-Task $Task $Tokens
    Show-Status
    Show-Suggestions
    exit 0
}

Show-Status
Show-Suggestions
