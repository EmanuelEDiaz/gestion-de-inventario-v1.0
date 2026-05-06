# Primero: forzar bypass de política de ejecución
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue

#!/usr/bin/env pwsh
# ============================================================
#   INVENTARIO - INICIO BACKEND ONLY
#   Uso: .\start-backend.ps1
#   Para detener: Ctrl+C o cerrar ventana
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot

function Write-Step { param([string]$msg) Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "   [!]  $msg" -ForegroundColor Yellow }
function Write-Fail { param([string]$msg) Write-Host "   [X]  $msg" -ForegroundColor Red }

function Test-Port {
    param([int]$Port)
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $conn = $tcp.BeginConnect("localhost", $Port, $null, $null)
        $ok = $conn.AsyncWaitHandle.WaitOne(1000, $false)
        $tcp.Close()
        return $ok
    } catch { return $false }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   INVENTARIO - BACKEND ONLY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Pre-flight checks ---
Write-Step "Verificando dependencias..."

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Fail "Java no encontrado. Instala JDK 21+"; exit 1
}
$javaOut = (java -version 2>&1)[0]
Write-OK "Java: $javaOut"

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") { Write-OK "PostgreSQL servicio ejecutandose" }
elseif (Test-Port 5432) { Write-OK "PostgreSQL respondiendo en :5432" }
else { Write-Warn "PostgreSQL no detectado en :5432 - asegurate de que este corriendo" }

# --- Check port 8080 ---
$prev8080 = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($prev8080) {
    Write-Warn "Puerto 8080 ocupado (PID $prev8080). Liberando..."
    Stop-Process -Id $prev8080 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# --- Start Backend ---
Write-Step "Iniciando Backend (Spring Boot :8080)..."

$backendDir = Join-Path $ROOT "backend\inventory-app"
Write-OK "Directorio: $backendDir"
Write-Host ""
Write-Host "   Credenciales: admin / admin123" -ForegroundColor White
Write-Host "   Swagger UI  : http://localhost:8080/swagger-ui.html" -ForegroundColor Magenta
Write-Host "   Para detener: Ctrl+C" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Push-Location $backendDir
try {
    # Repair any failed Flyway migrations before starting
    Write-Step "Reparando historial de migraciones Flyway..."
    mvn flyway:repair "-Dflyway.url=jdbc:postgresql://localhost:5432/inventory" `
        "-Dflyway.user=postgres" "-Dflyway.password=postgres" `
        "-Dflyway.locations=classpath:db/migration" 2>&1 | Where-Object { $_ -match "(ERROR|WARN|Repair|repair)" } | ForEach-Object { Write-Host "   $_" }
    Write-OK "Flyway repair completado"

    mvn spring-boot:run "-Dmaven.test.skip=true"
} finally {
    Pop-Location
}