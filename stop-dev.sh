#!/usr/bin/env bash
# ============================================================
#   INVENTARIO - DETENER ENTORNO DE DESARROLLO (Linux)
#   Uso: ./stop-dev.sh
#   Solo mata procesos en puertos 8080 y 3000, no procesos globales
# ============================================================

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.dev-pids.json"

# --- Colores ---
CY='\033[0;36m'; GN='\033[0;32m'; YL='\033[0;33m'; RD='\033[0;31m'; NC='\033[0m'

write_step() { echo; echo -e "${CY}>> $1${NC}"; }
write_ok()   { echo -e "${GN}   [OK] $1${NC}"; }
write_warn() { echo -e "${YL}   [!]  $1${NC}"; }

echo
echo -e "${RD}============================================${NC}"
echo -e "${RD}   INVENTARIO - DETENIENDO SERVICIOS${NC}"
echo -e "${RD}============================================${NC}"

# --- Matar proceso en puerto 8080 (Backend Java) ---
write_step "Deteniendo Backend (puerto 8080)..."
if lsof -ti :8080 &>/dev/null; then
    pid_8080=$(lsof -ti :8080)
    proc_name=$(ps -p "$pid_8080" -o comm= 2>/dev/null || echo "proceso")
    write_warn "Matando $proc_name PID $pid_8080"
    kill -9 "$pid_8080" 2>/dev/null || true
    write_ok "Backend detenido"
else
    write_warn "Nada escuchando en :8080"
fi

# --- Matar proceso en puerto 3000 (Frontend Next.js) ---
write_step "Deteniendo Frontend (puerto 3000)..."
if lsof -ti :3000 &>/dev/null; then
    pid_3000=$(lsof -ti :3000)
    proc_name=$(ps -p "$pid_3000" -o comm= 2>/dev/null || echo "node")
    write_warn "Matando $proc_name PID $pid_3000"
    kill -9 "$pid_3000" 2>/dev/null || true
    write_ok "Frontend detenido"
else
    write_warn "Nada escuchando en :3000"
fi

# --- Cerrar ventanas guardadas en .dev-pids.json ---
if [ -f "$PID_FILE" ]; then
    write_step "Cerrando ventanas del entorno..."

    backend_window=$(grep -oP '"backendWindow":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || true)
    frontend_window=$(grep -oP '"frontendWindow":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || true)

    for pid in $backend_window $frontend_window; do
        if [ -n "$pid" ] && [ "$pid" -gt 0 ]; then
            if ps -p "$pid" &>/dev/null; then
                proc_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "ventana")
                write_warn "Cerrando $proc_name PID $pid"
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done

    rm -f "$PID_FILE"
    write_ok ".dev-pids.json eliminado"
else
    write_warn "No se encontro .dev-pids.json"
fi

echo
echo -e "${GN}============================================${NC}"
echo -e "${GN}   TODOS LOS SERVICIOS DETENIDOS${NC}"
echo -e "${GN}============================================${NC}"