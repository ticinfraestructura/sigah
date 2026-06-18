# Script simple para preparar BD de pruebas
Write-Host "Preparando sigah_test..." -ForegroundColor Green

# Copiar esquema
Write-Host "Copiando esquema..." -ForegroundColor Yellow
docker exec sigah-db pg_dump -U sigah -d sigah --schema-only --no-owner --no-privileges > c:\temp\schema_test.sql
docker exec -i sigah-db psql -U sigah -d sigah_test < c:\temp\schema_test.sql

Write-Host "Listo. Esquema copiado." -ForegroundColor Green
