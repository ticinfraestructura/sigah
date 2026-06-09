# Token Estado - Ver estado actual de consumo de tokens
# Uso: .\tokens-estado.ps1

$TrackingFile = "C:\PROYECTOS\sigah\tokens-usage.json"

# Verificar si existe tracking
if (-not (Test-Path $TrackingFile)) {
    Write-Host "No hay datos de tracking. Ejecuta .\tokens-simple.ps1 para iniciar." -ForegroundColor Yellow
    exit
}

try {
    $tracking = Get-Content $TrackingFile -Raw | ConvertFrom-Json
    $Date = (Get-Date).ToString("yyyy-MM-dd")
    
    # Verificar si es el mismo dia
    if ($tracking.date -ne $Date) {
        Write-Host "Los datos son de otro dia. Ejecuta .\tokens-simple.ps1 para actualizar." -ForegroundColor Yellow
        exit
    }
    
    # Calcular estadisticas
    $usage = ($tracking.daily_tokens_used / $tracking.daily_limit) * 100
    $remaining = $tracking.daily_limit - $tracking.daily_tokens_used
    
    # Mostrar encabezado
    Write-Host "ESTADO DE TOKENS - SIGAH" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Gray
    Write-Host ""
    
    # Informacion general
    Write-Host "INFORMACION GENERAL" -ForegroundColor White
    Write-Host "========================" -ForegroundColor Gray
    Write-Host "Dia: $($tracking.day)" -ForegroundColor White
    Write-Host "Fecha: $($tracking.date)" -ForegroundColor White
    Write-Host "Limite diario: $($tracking.daily_limit)%" -ForegroundColor Yellow
    Write-Host ""
    
    # Estado actual
    Write-Host "ESTADO ACTUAL" -ForegroundColor White
    Write-Host "========================" -ForegroundColor Gray
    Write-Host "Usado: $($tracking.daily_tokens_used)% ($([math]::Round($usage, 1))%)" -ForegroundColor $(if($usage -ge 90) {"Red"} elseif($usage -ge 80) {"Yellow"} else {"Green"})
    Write-Host "Disponible: $remaining%" -ForegroundColor White
    Write-Host "Tareas completadas: $($tracking.tasks_completed.Count)" -ForegroundColor White
    Write-Host ""
    
    # Alertas
    if ($usage -ge 95) {
        Write-Host "ALERTAS ACTIVAS" -ForegroundColor Red
        Write-Host "========================" -ForegroundColor Gray
        Write-Host "ROJA: Modo emergencia activado!" -ForegroundColor Red
        Write-Host "• Solo tareas criticas absolutamente necesarias" -ForegroundColor Gray
        Write-Host "• Priorizar bugs y errores urgentes" -ForegroundColor Gray
        Write-Host ""
    }
    elseif ($usage -ge 90) {
        Write-Host "ALERTAS ACTIVAS" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Gray
        Write-Host "NARANJA: Alto riesgo de agotamiento!" -ForegroundColor Yellow
        Write-Host "• Solo tareas esenciales permitidas" -ForegroundColor Gray
        Write-Host "• Evitar nuevas funcionalidades" -ForegroundColor Gray
        Write-Host ""
    }
    elseif ($usage -ge 80) {
        Write-Host "ALERTAS ACTIVAS" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Gray
        Write-Host "AMARILLA: Acercandose al limite!" -ForegroundColor Yellow
        Write-Host "• Reducir complejidad de tareas" -ForegroundColor Gray
        Write-Host "• Cambios menores y especificos" -ForegroundColor Gray
        Write-Host ""
    }
    else {
        Write-Host "ESTADO: Normal" -ForegroundColor Green
        Write-Host "========================" -ForegroundColor Gray
        Write-Host "• Puedes continuar con tareas planificadas" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Sugerencias segun consumo
    Write-Host "SUGERENCIAS" -ForegroundColor White
    Write-Host "========================" -ForegroundColor Gray
    
    if ($usage -lt 50) {
        Write-Host "• Tienes mucho consumo disponible" -ForegroundColor Green
        Write-Host "• Puedes desarrollar nuevas funcionalidades" -ForegroundColor Gray
        Write-Host "• Buen momento para tareas complejas" -ForegroundColor Gray
    }
    elseif ($usage -lt 80) {
        Write-Host "• Consumo moderado disponible" -ForegroundColor Yellow
        Write-Host "• Enfocate en mejoras especificas" -ForegroundColor Gray
        Write-Host "• Prioriza optimizacion y bugs" -ForegroundColor Gray
    }
    elseif ($usage -lt 95) {
        Write-Host "• Bajo consumo disponible" -ForegroundColor Yellow
        Write-Host "• Solo cambios menores y documentacion" -ForegroundColor Gray
        Write-Host "• Evita desarrollo complejo" -ForegroundColor Gray
    }
    else {
        Write-Host "• Modo emergencia" -ForegroundColor Red
        Write-Host "• Solo bugs criticos" -ForegroundColor Gray
        Write-Host "• Revision sin cambios" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Historial de tareas
    if ($tracking.tasks_completed.Count -gt 0) {
        Write-Host "HISTORIAL DE TAREAS" -ForegroundColor White
        Write-Host "========================" -ForegroundColor Gray
        
        # Mostrar todas las tareas
        for ($i = 0; $i -lt $tracking.tasks_completed.Count; $i++) {
            $task = $tracking.tasks_completed[$i]
            Write-Host "$($i + 1). $($task.name)" -ForegroundColor White
            Write-Host "   Tokens: $($task.tokens)% | Hora: $($task.time)" -ForegroundColor Gray
        }
        
        Write-Host ""
        
        # Resumen de tareas
        Write-Host "RESUMEN DE TAREAS" -ForegroundColor White
        Write-Host "========================" -ForegroundColor Gray
        Write-Host "Total tareas: $($tracking.tasks_completed.Count)" -ForegroundColor White
        Write-Host "Promedio por tarea: $([math]::Round($tracking.daily_tokens_used / $tracking.tasks_completed.Count, 1))%" -ForegroundColor Yellow
        Write-Host "Tarea mas grande: $([math]::Round(($tracking.tasks_completed | ForEach-Object { $_.tokens } | Measure-Object -Maximum).Maximum, 1))%" -ForegroundColor Cyan
        Write-Host "Tarea mas pequena: $([math]::Round(($tracking.tasks_completed | ForEach-Object { $_.tokens } | Measure-Object -Minimum).Minimum, 1))%" -ForegroundColor Cyan
    }
    
    Write-Host ""
    
    # Proyeccion
    Write-Host "PROYECCION DEL DIA" -ForegroundColor White
    Write-Host "========================" -ForegroundColor Gray
    Write-Host "Progreso del dia: $([math]::Round($usage, 1))%" -ForegroundColor $(if($usage -ge 90) {"Red"} elseif($usage -ge 80) {"Yellow"} else {"Green"})
    Write-Host "Queda por usar: $remaining%" -ForegroundColor White
    
    if ($remaining -gt 10) {
        Write-Host "• Buen ritmo para completar el dia" -ForegroundColor Green
    }
    elseif ($remaining -gt 5) {
        Write-Host "• Ritmo moderado, cuidado con el consumo" -ForegroundColor Yellow
    }
    else {
        Write-Host "• Ritmo alto, considera pausar tareas complejas" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Para registrar una nueva tarea:" -ForegroundColor Cyan
    Write-Host ".\tokens-registrar.ps1 'Nombre de tarea' X" -ForegroundColor Gray
    
}
catch {
    Write-Host "Error al leer los datos de tracking." -ForegroundColor Red
    Write-Host "Ejecuta .\tokens-simple.ps1 para reiniciar el sistema." -ForegroundColor Yellow
}
