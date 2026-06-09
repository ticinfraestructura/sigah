# Daily Tasks Planner for SIGAH
# Planificador diario de tareas según optimización de tokens

param(
    [string]$Day = (Get-Date).DayOfWeek.ToString(),
    [switch]$ShowTasks,
    [switch]$Complete
)

# Base de datos de tareas por día
$TasksDatabase = @{
    "Monday" = @{
        Name = "Día de Nuevas Funcionalidades"
        TokenLimit = 25
        Tasks = @(
            @{
                Name = "Revisión de requerimientos pendientes"
                Tokens = 3
                Duration = "30 min"
                Priority = "Alta"
                Type = "Planificación"
            },
            @{
                Name = "Desarrollo de componente principal"
                Tokens = 15
                Duration = "2 horas"
                Priority = "Alta"
                Type = "Desarrollo"
            },
            @{
                Name = "Testing y validación de nueva funcionalidad"
                Tokens = 5
                Duration = "1 hora"
                Priority = "Media"
                Type = "Testing"
            },
            @{
                Name = "Documentación de cambios"
                Tokens = 2
                Duration = "30 min"
                Priority = "Baja"
                Type = "Documentación"
            }
        )
    }
    "Tuesday" = @{
        Name = "Día de Mejoras"
        TokenLimit = 20
        Tasks = @(
            @{
                Name = "Revisión de código existente"
                Tokens = 3
                Duration = "45 min"
                Priority = "Media"
                Type = "Revisión"
            },
            @{
                Name = "Optimización de consultas SQL"
                Tokens = 8
                Duration = "1.5 horas"
                Priority = "Alta"
                Type = "Optimización"
            },
            @{
                Name = "Mejoras de UI/UX específicas"
                Tokens = 6
                Duration = "1 hora"
                Priority = "Media"
                Type = "Frontend"
            },
            @{
                Name = "Refactoring de funciones críticas"
                Tokens = 3
                Duration = "45 min"
                Priority = "Media"
                Type = "Refactoring"
            }
        )
    }
    "Wednesday" = @{
        Name = "Día de Mantenimiento"
        TokenLimit = 15
        Tasks = @(
            @{
                Name = "Identificación de bugs críticos"
                Tokens = 2
                Duration = "30 min"
                Priority = "Alta"
                Type = "Análisis"
            },
            @{
                Name = "Corrección de errores reportados"
                Tokens = 8
                Duration = "2 horas"
                Priority = "Alta"
                Type = "Bug Fixing"
            },
            @{
                Name = "Validación de soluciones"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Media"
                Type = "Testing"
            },
            @{
                Name = "Actualización de dependencias"
                Tokens = 2
                Duration = "30 min"
                Priority = "Baja"
                Type = "Mantenimiento"
            }
        )
    }
    "Thursday" = @{
        Name = "Día de Documentación"
        TokenLimit = 10
        Tasks = @(
            @{
                Name = "Actualización de README.md"
                Tokens = 2
                Duration = "30 min"
                Priority = "Media"
                Type = "Documentación"
            },
            @{
                Name = "Comentarios en código crítico"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Media"
                Type = "Documentación"
            },
            @{
                Name = "Creación de guías de uso"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Baja"
                Type = "Documentación"
            },
            @{
                Name = "Planificación de próxima semana"
                Tokens = 2
                Duration = "30 min"
                Priority = "Alta"
                Type = "Planificación"
            }
        )
    }
    "Friday" = @{
        Name = "Día de Revisión y Limpieza"
        TokenLimit = 10
        Tasks = @(
            @{
                Name = "Code review de cambios semana"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Media"
                Type = "Revisión"
            },
            @{
                Name = "Refactoring menor de código"
                Tokens = 2
                Duration = "45 min"
                Priority = "Baja"
                Type = "Refactoring"
            },
            @{
                Name = "Organización de archivos"
                Tokens = 2
                Duration = "30 min"
                Priority = "Baja"
                Type = "Organización"
            },
            @{
                Name = "Limpieza de código muerto"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Media"
                Type = "Limpieza"
            }
        )
    }
    "Saturday" = @{
        Name = "Día de Reserva y Experimentación"
        TokenLimit = 10
        Tasks = @(
            @{
                Name = "Experimentación con nuevas tecnologías"
                Tokens = 4
                Duration = "1.5 horas"
                Priority = "Baja"
                Type = "Experimentación"
            },
            @{
                Name = "Aprendizaje y documentación"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Baja"
                Type = "Aprendizaje"
            },
            @{
                Name = "Emergencias y tareas críticas"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Alta"
                Type = "Emergencia"
            }
        )
    }
    "Sunday" = @{
        Name = "Día de Descanso y Planificación"
        TokenLimit = 10
        Tasks = @(
            @{
                Name = "Revisión semanal de logros"
                Tokens = 2
                Duration = "30 min"
                Priority = "Media"
                Type = "Revisión"
            },
            @{
                Name = "Planificación semana siguiente"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Alta"
                Type = "Planificación"
            },
            @{
                Name = "Lectura y aprendizaje"
                Tokens = 3
                Duration = "1 hora"
                Priority = "Baja"
                Type = "Aprendizaje"
            },
            @{
                Name = "Reserva para emergencias"
                Tokens = 2
                Duration = "30 min"
                Priority = "Alta"
                Type = "Reserva"
            }
        )
    }
}

# Función para mostrar tareas del día
function Show-DayTasks {
    $dayInfo = $TasksDatabase[$Day]
    
    Write-Host "`n📅 TAREAS PARA $Day.ToUpper()" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "🎯 $($dayInfo.Name)" -ForegroundColor White
    Write-Host "📊 Límite de tokens: $($dayInfo.TokenLimit)%" -ForegroundColor Yellow
    Write-Host ""
    
    $totalTokens = 0
    for ($i = 0; $i -lt $dayInfo.Tasks.Count; $i++) {
        $task = $dayInfo.Tasks[$i]
        $totalTokens += $task.Tokens
        
        $priorityColor = switch ($task.Priority) {
            "Alta" { "Red" }
            "Media" { "Yellow" }
            "Baja" { "Green" }
            default { "White" }
        }
        
        Write-Host "📋 Tarea $($i + 1): $($task.Name)" -ForegroundColor White
        Write-Host "   💰 Tokens: $($task.Tokens)%" -ForegroundColor Cyan
        Write-Host "   ⏱️  Duración: $($task.Duration)" -ForegroundColor Gray
        Write-Host "   🎯 Prioridad: $($task.Priority)" -ForegroundColor $priorityColor
        Write-Host "   📝 Tipo: $($task.Type)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "📈 Total tokens planeados: $totalTokens%" -ForegroundColor $(if($totalTokens -le $dayInfo.TokenLimit) {"Green"} else {"Red"})
    
    if ($totalTokens -gt $dayInfo.TokenLimit) {
        Write-Host "⚠️ ADVERTENCIA: Excedes el límite diario de tokens!" -ForegroundColor Red
    } else {
        $remaining = $dayInfo.TokenLimit - $totalTokens
        Write-Host "✅ Tokens disponibles adicionales: $remaining%" -ForegroundColor Green
    }
}

# Función para mostrar tareas de bajo consumo
function Show-LowConsumptionTasks {
    Write-Host "`n🔋 TAREAS DE BAJO CONSUMO (Para cuando tengas pocos tokens)" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $lowConsumptionTasks = @(
        @{Name = "Revisión de código sin cambios"; Tokens = 1; Duration = "30 min"},
        @{Name = "Actualización de comentarios"; Tokens = 2; Duration = "45 min"},
        @{Name = "Organización de archivos"; Tokens = 1; Duration = "20 min"},
        @{Name = "Documentación existente"; Tokens = 2; Duration = "1 hora"},
        @{Name = "Planificación de próximas tareas"; Tokens = 1; Duration = "30 min"},
        @{Name = "Investigación sin código"; Tokens = 2; Duration = "1 hora"},
        @{Name = "Revisión de logs"; Tokens = 1; Duration = "20 min"},
        @{Name = "Limpieza de variables no usadas"; Tokens = 1; Duration = "15 min"}
    )
    
    foreach ($task in $lowConsumptionTasks) {
        Write-Host "• $($task.Name)" -ForegroundColor Gray
        Write-Host "  💰 Tokens: $($task.Tokens)% | ⏱️ $($task.Duration)" -ForegroundColor Green
        Write-Host ""
    }
}

# Función para marcar tarea completada
function Complete-Task {
    param([int]$TaskNumber)
    
    $dayInfo = $TasksDatabase[$Day]
    
    if ($TaskNumber -lt 1 -or $TaskNumber -gt $dayInfo.Tasks.Count) {
        Write-Host "❌ Número de tarea inválido. Debe ser entre 1 y $($dayInfo.Tasks.Count)" -ForegroundColor Red
        return
    }
    
    $task = $dayInfo.Tasks[$TaskNumber - 1]
    
    # Registrar en el sistema de monitoreo
    .\token-monitor.ps1 -Task $task.Name $task.Tokens
    
    Write-Host "✅ Tarea completada: $($task.Name)" -ForegroundColor Green
    Write-Host "📊 Tokens registrados: $($task.Tokens)%" -ForegroundColor Cyan
}

# Función para mostrar resumen semanal
function Show-WeeklySummary {
    Write-Host "`n📊 RESUMEN SEMANAL DE TOKENS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $days = @("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    $totalWeeklyLimit = 0
    
    foreach ($day in $days) {
        $dayInfo = $TasksDatabase[$day]
        $totalWeeklyLimit += $dayInfo.TokenLimit
        
        $dayName = switch ($day) {
            "Monday" { "Lunes" }
            "Tuesday" { "Martes" }
            "Wednesday" { "Miércoles" }
            "Thursday" { "Jueves" }
            "Friday" { "Viernes" }
            "Saturday" { "Sábado" }
            "Sunday" { "Domingo" }
        }
        
        Write-Host "$dayName`: $([string]::Format("{0,3}", $dayInfo.TokenLimit))% - $($dayInfo.Name)" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "📈 Límite total semanal: $totalWeeklyLimit%" -ForegroundColor Green
    Write-Host "🔄 Promedio diario: $([math]::Round($totalWeeklyLimit / 7, 1))%" -ForegroundColor Yellow
}

# Mostrar ayuda si no hay parámetros
if ($args.Count -eq 0) {
    Write-Host "🎯 DAILY TASKS PLANNER PARA SIGAH" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor White
    Write-Host "  .\daily-tasks-planner.ps1                    - Mostrar tareas de hoy" -ForegroundColor Gray
    Write-Host "  .\daily-tasks-planner.ps1 -ShowTasks         - Mostrar todas las tareas del día" -ForegroundColor Gray
    Write-Host "  .\daily-tasks-planner.ps1 -Complete X        - Marcar tarea X como completada" -ForegroundColor Gray
    Write-Host "  .\daily-tasks-planner.ps1 -Weekly            - Mostrar resumen semanal" -ForegroundColor Gray
    Write-Host ""
    
    Show-DayTasks
    Show-LowConsumptionTasks
    exit
}

# Ejecutar comandos específicos
if ($ShowTasks) {
    Show-DayTasks
    exit
}

if ($Complete -and $args.Count -ge 2) {
    Complete-Task -TaskNumber ([int]$args[1])
    exit
}

if ($args.Count -ge 1 -and $args[0] -eq "-Weekly") {
    Show-WeeklySummary
    exit
}

# Mostrar tareas del día por defecto
Show-DayTasks
Show-LowConsumptionTasks
