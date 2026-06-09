# Token Registrar - Sistema simple para registrar uso de tokens
# Uso: .\tokens-registrar.ps1 "Nombre de tarea" 5

param(
    [Parameter(Mandatory=$true)]
    [string]$TaskName,
    
    [Parameter(Mandatory=$true)]
    [int]$Tokens
)

# Validar parametros
if ($Tokens -lt 1 -or $Tokens -gt 50) {
    Write-Host "Error: Los tokens deben estar entre 1 y 50" -ForegroundColor Red
    exit
}

# Obtener informacion del dia
$Day = (Get-Date).DayOfWeek.ToString()
$Date = (Get-Date).ToString("yyyy-MM-dd")
$Time = (Get-Date).ToString("HH:mm:ss")

# Limites diarios
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

# Cargar o crear tracking
if (Test-Path $TrackingFile) {
    try {
        $tracking = Get-Content $TrackingFile -Raw | ConvertFrom-Json
        
        # Reset si es nuevo dia
        if ($tracking.date -ne $Date) {
            $tracking = @{
                date = $Date
                day = $Day
                daily_limit = $DailyLimit
                daily_tokens_used = 0
                tasks_completed = @()
                alerts_triggered = @()
            }
        }
    }
    catch {
        $tracking = @{
            date = $Date
            day = $Day
            daily_limit = $DailyLimit
            daily_tokens_used = 0
            tasks_completed = @()
            alerts_triggered = @()
        }
    }
} else {
    $tracking = @{
        date = $Date
        day = $Day
        daily_limit = $DailyLimit
        daily_tokens_used = 0
        tasks_completed = @()
        alerts_triggered = @()
    }
}

# Verificar si hay tokens disponibles
$available = $tracking.daily_limit - $tracking.daily_tokens_used
if ($Tokens -gt $available) {
    Write-Host "Error: No tienes suficientes tokens disponibles" -ForegroundColor Red
    Write-Host "Disponibles: $available%" -ForegroundColor Yellow
    Write-Host "Solicitados: $Tokens%" -ForegroundColor Red
    exit
}

# Registrar tarea
$task = @{
    name = $TaskName
    tokens = $Tokens
    time = $Time
    percentage = [math]::Round(($Tokens / $tracking.daily_limit) * 100, 2)
}

$tracking.daily_tokens_used += $Tokens
$tracking.tasks_completed += $task

# Guardar tracking
$tracking | ConvertTo-Json -Depth 3 | Out-File -FilePath $TrackingFile -Encoding UTF8

# Mostrar resultado
Write-Host "Tarea registrada exitosamente!" -ForegroundColor Green
Write-Host "Nombre: $TaskName" -ForegroundColor White
Write-Host "Tokens: $Tokens%" -ForegroundColor Cyan
Write-Host "Porcentaje del dia: $($task.percentage)%" -ForegroundColor Gray
Write-Host "Hora: $Time" -ForegroundColor Gray
Write-Host ""

# Mostrar estado actual
$usage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
$remaining = $tracking.daily_limit - $tracking.daily_tokens_used

Write-Host "ESTADO ACTUAL" -ForegroundColor White
Write-Host "========================" -ForegroundColor Gray
Write-Host "Dia: $($tracking.day)" -ForegroundColor White
Write-Host "Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage, 1))%)" -ForegroundColor $(if($usage -ge 90) {"Red"} elseif($usage -ge 80) {"Yellow"} else {"Green"})
Write-Host "Disponible: $remaining%" -ForegroundColor White
Write-Host "Tareas completadas: $($tracking.tasks_completed.Count)" -ForegroundColor White

# Alertas
if ($usage -ge 95) {
    Write-Host "ALERTA ROJA: Modo emergencia!" -ForegroundColor Red
}
elseif ($usage -ge 90) {
    Write-Host "ALERTA NARANJA: Alto riesgo!" -ForegroundColor Yellow
}
elseif ($usage -ge 80) {
    Write-Host "ALERTA AMARILLA: Cuidado!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ultimas tareas:" -ForegroundColor White
$tracking.tasks_completed | Select-Object -Last 3 | ForEach-Object {
    Write-Host "• $($_.name) - $($_.tokens)% ($($_.time))" -ForegroundColor Gray
}
