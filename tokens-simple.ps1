# Token Simple - Sistema basico de optimizacion de tokens
# Uso: .\tokens-simple.ps1

# Obtener dia actual
$Day = (Get-Date).DayOfWeek.ToString()
$Date = (Get-Date).ToString("yyyy-MM-dd")

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

# Mostrar encabezado
Write-Host "TOKEN OPTIMIZATION SYSTEM - SIGAH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Write-Host ""

# Mostrar informacion del dia
$DayName = switch ($Day) {
    "Monday" { "Lunes - Nuevas Funcionalidades" }
    "Tuesday" { "Martes - Mejoras" }
    "Wednesday" { "Miercoles - Mantenimiento" }
    "Thursday" { "Jueves - Documentacion" }
    "Friday" { "Viernes - Revision" }
    "Saturday" { "Sabado - Reserva" }
    "Sunday" { "Domingo - Planificacion" }
}

Write-Host "Hoy es: $DayName" -ForegroundColor White
Write-Host "Limite de tokens: $DailyLimit por ciento" -ForegroundColor Yellow
Write-Host ""

# Tareas recomendadas segun dia
Write-Host "TAREAS RECOMENDADAS" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray

switch ($Day) {
    "Monday" {
        Write-Host "ALTO CONSUMO DISPONIBLE" -ForegroundColor Green
        Write-Host "• Revision de requerimientos pendientes (3%)" -ForegroundColor Gray
        Write-Host "• Desarrollo de componente principal (15%)" -ForegroundColor Gray
        Write-Host "• Testing y validacion (5%)" -ForegroundColor Gray
        Write-Host "• Documentacion de cambios (2%)" -ForegroundColor Gray
    }
    "Tuesday" {
        Write-Host "CONSUMO MODERADO" -ForegroundColor Yellow
        Write-Host "• Revision de codigo existente (3%)" -ForegroundColor Gray
        Write-Host "• Optimizacion de consultas SQL (8%)" -ForegroundColor Gray
        Write-Host "• Mejoras de UI/UX (6%)" -ForegroundColor Gray
        Write-Host "• Refactoring especifico (3%)" -ForegroundColor Gray
    }
    "Wednesday" {
        Write-Host "CONSUMO MEDIO" -ForegroundColor Yellow
        Write-Host "• Identificacion de bugs (2%)" -ForegroundColor Gray
        Write-Host "• Correccion de errores (8%)" -ForegroundColor Gray
        Write-Host "• Validacion de soluciones (3%)" -ForegroundColor Gray
        Write-Host "• Actualizacion de dependencias (2%)" -ForegroundColor Gray
    }
    "Thursday" {
        Write-Host "BAJO CONSUMO" -ForegroundColor Green
        Write-Host "• Actualizacion de README.md (2%)" -ForegroundColor Gray
        Write-Host "• Comentarios en codigo critico (3%)" -ForegroundColor Gray
        Write-Host "• Creacion de guias de uso (3%)" -ForegroundColor Gray
        Write-Host "• Planificacion proxima semana (2%)" -ForegroundColor Gray
    }
    "Friday" {
        Write-Host "BAJO CONSUMO" -ForegroundColor Green
        Write-Host "• Code review semanal (3%)" -ForegroundColor Gray
        Write-Host "• Refactoring menor (2%)" -ForegroundColor Gray
        Write-Host "• Organizacion de archivos (2%)" -ForegroundColor Gray
        Write-Host "• Limpieza de codigo muerto (3%)" -ForegroundColor Gray
    }
    default {
        Write-Host "CONSUMO DE RESERVA" -ForegroundColor Green
        Write-Host "• Experimentacion con nuevas tecnologias (4%)" -ForegroundColor Gray
        Write-Host "• Aprendizaje y documentacion (3%)" -ForegroundColor Gray
        Write-Host "• Emergencias y tareas criticas (3%)" -ForegroundColor Gray
    }
}

Write-Host ""

# Consejos del dia
Write-Host "CONSEJOS DEL DIA" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray

switch ($Day) {
    "Monday" {
        Write-Host "Hoy es dia de alta intensidad:" -ForegroundColor Green
        Write-Host "• Prioriza las tareas mas importantes primero" -ForegroundColor Gray
        Write-Host "• Usa read_file en paralelo para ahorrar tokens" -ForegroundColor Gray
        Write-Host "• Evita exploraciones amplias del proyecto" -ForegroundColor Gray
    }
    "Tuesday" {
        Write-Host "Hoy es dia de mejoras:" -ForegroundColor Yellow
        Write-Host "• Enfocate en optimizacion especifica" -ForegroundColor Gray
        Write-Host "• Usa edit en lugar de reescribir codigo" -ForegroundColor Gray
        Write-Host "• Prioriza bugs criticos" -ForegroundColor Gray
    }
    "Wednesday" {
        Write-Host "Hoy es dia de mantenimiento:" -ForegroundColor Yellow
        Write-Host "• Cambios minimos y especificos" -ForegroundColor Gray
        Write-Host "• Una linea a la vez" -ForegroundColor Gray
        Write-Host "• Documenta cada cambio" -ForegroundColor Gray
    }
    "Thursday" {
        Write-Host "Hoy es dia de documentacion:" -ForegroundColor Green
        Write-Host "• Solo lectura y comentarios" -ForegroundColor Gray
        Write-Host "• Planificacion sin codigo" -ForegroundColor Gray
        Write-Host "• Organizacion de archivos" -ForegroundColor Gray
    }
    "Friday" {
        Write-Host "Hoy es dia de limpieza:" -ForegroundColor Green
        Write-Host "• Revision sin cambios" -ForegroundColor Gray
        Write-Host "• Code review eficiente" -ForegroundColor Gray
        Write-Host "• Prepara para la semana siguiente" -ForegroundColor Gray
    }
    default {
        Write-Host "Hoy es dia de reserva:" -ForegroundColor Green
        Write-Host "• Solo emergencias si es necesario" -ForegroundColor Gray
        Write-Host "• Aprendizaje y experimentacion" -ForegroundColor Gray
        Write-Host "• Conserva tokens para la semana" -ForegroundColor Gray
    }
}

Write-Host ""

# Comandos utiles
Write-Host "COMANDOS UTILES" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host "• Iniciar dia: .\tokens-simple.ps1" -ForegroundColor Gray
Write-Host "• Ver estado: .\tokens-simple.ps1" -ForegroundColor Gray
Write-Host ""

# Tareas de bajo consumo
Write-Host "TAREAS DE BAJO CONSUMO (Emergencia)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Gray
Write-Host "• Revision de codigo sin cambios (1%)" -ForegroundColor Gray
Write-Host "• Actualizacion de comentarios (2%)" -ForegroundColor Gray
Write-Host "• Organizacion de archivos (1%)" -ForegroundColor Gray
Write-Host "• Documentacion existente (2%)" -ForegroundColor Gray
Write-Host "• Planificacion de proximas tareas (1%)" -ForegroundColor Gray
Write-Host "• Investigacion sin codigo (2%)" -ForegroundColor Gray
Write-Host ""

# Resumen semanal
Write-Host "RESUMEN SEMANAL" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Gray
Write-Host "Lunes: 25% - Nuevas Funcionalidades" -ForegroundColor White
Write-Host "Martes: 20% - Mejoras" -ForegroundColor White
Write-Host "Miercoles: 15% - Mantenimiento" -ForegroundColor White
Write-Host "Jueves: 10% - Documentacion" -ForegroundColor White
Write-Host "Viernes: 10% - Revision" -ForegroundColor White
Write-Host "Sabado: 10% - Reserva" -ForegroundColor White
Write-Host "Domingo: 10% - Planificacion" -ForegroundColor White
Write-Host ""
Write-Host "Total semanal: 100%" -ForegroundColor Green
Write-Host "Promedio diario: 14.3%" -ForegroundColor Yellow
Write-Host ""

# Mensaje final
Write-Host "RECUERDA:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Gray
Write-Host "• PIENSA antes de actuar" -ForegroundColor White
Write-Host "• PLANIFICA tus tareas" -ForegroundColor White
Write-Host "• ACTUA con precision" -ForegroundColor White
Write-Host "• MONITOREA tu consumo" -ForegroundColor White
Write-Host ""

Write-Host "Buen dia de trabajo productivo!" -ForegroundColor Green
