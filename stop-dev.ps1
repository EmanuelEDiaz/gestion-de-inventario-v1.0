#!/usr/bin/env pwsh
# ============================================================
#   INVENTARIO - DETENER ENTORNO DE DESARROLLO
#   Uso: .\stop-dev.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot

function Write-Step { param([string]$msg) Write-Host "" ; Write-Host ">> $msg" -ForegroundColor Cyan }
function Write-OK   { param([string]$msg) Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "   [!]  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "   INVENTARIO - DETENIENDO SERVICIOS" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red

# --- Matar proceso en puerto 8080 (Backend Java) ---
Write-Step "Deteniendo Backend (puerto 8080)..."
$conns8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conns8080) {
    foreach ($conn in $conns8080) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Warn "Matando $($proc.Name) PID $($proc.Id)"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-OK "Backend detenido"
} else {
    Write-Warn "Nada escuchando en :8080"
}

# Matar cualquier java.exe restante de Maven
$javaProcs = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcs) {
    Write-Warn "$($javaProcs.Count) proceso(s) java.exe encontrado(s). Matando..."
    $javaProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-OK "java.exe terminado(s)"
}

# --- Matar proceso en puerto 3000 (Frontend Node) ---
Write-Step "Deteniendo Frontend (puerto 3000)..."
$conns3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conns3000) {
    foreach ($conn in $conns3000) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Warn "Matando $($proc.Name) PID $($proc.Id)"
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-OK "Frontend detenido"
} else {
    Write-Warn "Nada escuchando en :3000"
}

# --- Cerrar ventanas PowerShell del entorno ---
$pidFile = Join-Path $ROOT ".dev-pids.json"
if (Test-Path $pidFile) {
    Write-Step "Cerrando ventanas de terminal del entorno..."
    $pids = Get-Content $pidFile | ConvertFrom-Json
    foreach ($prop in $pids.PSObject.Properties) {
        $procId = [int]$prop.Value
        if ($procId -gt 0) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Warn "Cerrando $($proc.Name) PID $procId [$($prop.Name)]"
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Remove-Item $pidFile -Force
    Write-OK ".dev-pids.json eliminado"
} else {
    Write-Warn "No se encontro .dev-pids.json"
}

# Matar procesos mvn si quedaron
$mvnProcs = Get-Process -Name "mvn" -ErrorAction SilentlyContinue
if ($mvnProcs) {
    $mvnProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-OK "Procesos mvn terminados"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   TODOS LOS SERVICIOS DETENIDOS" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""