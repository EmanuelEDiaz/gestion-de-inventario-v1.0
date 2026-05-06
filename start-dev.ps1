#!/usr/bin/env pwsh
# ============================================================
#   INVENTARIO - INICIO DE DESARROLLO
#   Uso: .\start-dev.ps1
#   Para detener todo: .\stop-dev.ps1
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

function Wait-ForPort {
    param([int]$Port, [string]$Name, [int]$MaxSec = 120)
    $elapsed = 0
    while (-not (Test-Port $Port) -and $elapsed -lt $MaxSec) {
        Write-Host "   [~] Esperando $Name en :$Port ... ($elapsed/$MaxSec s)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
        $elapsed += 5
    }
    if (Test-Port $Port) { Write-OK "$Name listo en :$Port"; return $true }
    else { Write-Warn "$Name no respondio en $MaxSec s (puede tardar mas)"; return $false }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   INVENTARIO - ENTORNO DE DESARROLLO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Pre-flight checks ---
Write-Step "Verificando dependencias..."

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Fail "Java no encontrado. Instala JDK 21+"; exit 1
}
$javaOut = (java -version 2>&1)[0]
Write-OK "Java: $javaOut"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail "Node.js no encontrado. Instala Node.js 20+"; exit 1
}
$nodeVer = node -v 2>&1
Write-OK "Node.js: $nodeVer"

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Warn "pnpm no encontrado. Instalando..."; npm install -g pnpm
} else {
    $pnpmVer = pnpm -v 2>&1
    Write-OK "pnpm: $pnpmVer"
}

$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") { Write-OK "PostgreSQL servicio ejecutandose" }
elseif (Test-Port 5432) { Write-OK "PostgreSQL respondiendo en :5432" }
else { Write-Warn "PostgreSQL no detectado en :5432 - asegurate de que este corriendo" }

# --- PID tracking ---
$pidFile = Join-Path $ROOT ".dev-pids.json"

# --- Backend ---
Write-Step "Iniciando Backend (Spring Boot :8080)..."

$prev8080 = (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($prev8080) {
    Write-Warn "Puerto 8080 ocupado (PID $prev8080). Liberando..."
    Stop-Process -Id $prev8080 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

$backendDir = Join-Path $ROOT "backend\inventory-app"
$backendProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-NoProfile", "-Command", "Set-Location '$backendDir'; Write-Host '=== BACKEND (Spring Boot) ===' -ForegroundColor Cyan; Write-Host '>> Reparando migraciones Flyway...' -ForegroundColor Cyan; mvn flyway:repair '-Dflyway.url=jdbc:postgresql://localhost:5432/inventory' '-Dflyway.user=postgres' '-Dflyway.password=postgres' 2>&1 | Select-String '(repair|Repair|ERROR|WARN)'; mvn spring-boot:run -DskipTests" `
    -PassThru
Write-OK "Ventana backend abierta (PID $($backendProc.Id))"

# --- Frontend ---
Write-Step "Iniciando Frontend (Next.js :3000)..."

$prev3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1
if ($prev3000) {
    Write-Warn "Puerto 3000 ocupado (PID $prev3000). Liberando..."
    Stop-Process -Id $prev3000 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

$frontendDir = Join-Path $ROOT "frontend"
$frontendProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-NoProfile", "-Command", "Set-Location '$frontendDir'; Write-Host '=== FRONTEND (Next.js) ===' -ForegroundColor Magenta; pnpm dev" `
    -PassThru
Write-OK "Ventana frontend abierta (PID $($frontendProc.Id))"

# --- Guardar PIDs ---
@{ backendWindow = $backendProc.Id; frontendWindow = $frontendProc.Id } | ConvertTo-Json | Set-Content $pidFile
Write-OK "PIDs guardados en .dev-pids.json"

# --- Esperar servicios ---
Write-Step "Esperando que los servicios respondan..."
Write-Host "   (El backend puede tardar 1-2 min la primera vez)" -ForegroundColor DarkGray

$backOk  = Wait-ForPort 8080 "Backend"  120
$frontOk = Wait-ForPort 3000 "Frontend"  60

# --- Resumen ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   APLICACION EN MARCHA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
$bStatus = if ($backOk)  { "http://localhost:8080" } else { "http://localhost:8080 (iniciando...)" }
$fStatus = if ($frontOk) { "http://localhost:3000" } else { "http://localhost:3000 (iniciando...)" }
Write-Host "   Frontend  : $fStatus" -ForegroundColor $(if ($frontOk) { "Green" } else { "Yellow" })
Write-Host "   Backend   : $bStatus" -ForegroundColor $(if ($backOk)  { "Green" } else { "Yellow" })
Write-Host "   Swagger   : http://localhost:8080/swagger-ui.html" -ForegroundColor Magenta
Write-Host "   Health    : http://localhost:8080/actuator/health" -ForegroundColor DarkGray
Write-Host "   API       : http://localhost:8080/api/v1" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Credenciales: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "   Para detener: .\stop-dev.ps1" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""