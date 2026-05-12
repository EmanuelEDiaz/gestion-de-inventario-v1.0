#!/usr/bin/env zsh
# ============================================================
#   INVENTARIO - DETENER ENTORNO DE DESARROLLO (Linux)
#   Uso: ./stop-dev.sh
#
#   Estrategia:
#   1. Lee PIDs del archivo .dev-pids.json (guardado por start-dev.sh)
#   2. Mata el proceso raíz (mvn/pnpm) que crea un process group
#   3. También mata procesos hijos recursivamente
#   4. Cierra las ventanas de terminal
#   5. Libera los puertos 8080 y 3000 si algo queda
#
#   Formatos soportados:
#   - Nuevo: {"backend": X, "frontend": Y}
#   - Antiguo: {"backendWindow": X, "backendProcess": Y, "frontendWindow": Z, "frontendProcess": W}
# ============================================================

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT/.dev-pids.json"

CY='\033[0;36m'; GN='\033[0;32m'; YL='\033[0;33m'; RD='\033[0;31m'; NC='\033[0m'

write_step() { echo; echo -e "${CY}>> $1${NC}"; }
write_ok()   { echo -e "${GN}   [OK] $1${NC}"; }
write_warn() { echo -e "${YL}   [!]  $1${NC}"; }

kill_process_tree() {
    local pid=$1 sig=${2:-TERM}

    if ! ps -p "$pid" &>/dev/null; then
        return 0
    fi

    local comm children
    comm=$(ps -p "$pid" -o comm= 2>/dev/null || echo "proceso")

    children=$(pgrep -P "$pid" 2>/dev/null || true)
    if [ -n "$children" ]; then
        while read -r child; do
            kill_process_tree "$child" "$sig"
        done <<< "$children"
    fi

    if ps -p "$pid" &>/dev/null; then
        write_warn "Matando $comm (PID $pid)"
        kill -"$sig" "$pid" 2>/dev/null || true
    fi
}

echo
echo -e "${RD}============================================${NC}"
echo -e "${RD}   INVENTARIO - DETENIENDO SERVICIOS${NC}"
echo -e "${RD}============================================${NC}"

stopped_backend=0
stopped_frontend=0

if [ -f "$PID_FILE" ]; then
    write_step "Leyendo PIDs desde .dev-pids.json..."

    if command -v jq &>/dev/null; then
        backend_pid=$(jq -r '.backend // .backendWindow // empty' "$PID_FILE" 2>/dev/null || true)
        frontend_pid=$(jq -r '.frontend // .frontendWindow // empty' "$PID_FILE" 2>/dev/null || true)
    else
        backend_pid=$(grep -oP '"backend":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || grep -oP '"backendWindow":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || true)
        frontend_pid=$(grep -oP '"frontend":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || grep -oP '"frontendWindow":\s*\K[0-9]+' "$PID_FILE" 2>/dev/null || true)
    fi

    if [ -n "$backend_pid" ] && [ "$backend_pid" -gt 0 ] 2>/dev/null; then
        write_step "Deteniendo Backend (PID $backend_pid)..."
        if kill_process_tree "$backend_pid" TERM; then
            sleep 1
            if ps -p "$backend_pid" &>/dev/null 2>&1; then
                write_warn "Forzando con SIGKILL..."
                kill_process_tree "$backend_pid" KILL
            fi
            write_ok "Backend detenido"
            stopped_backend=1
        fi
    fi

    if [ -n "$frontend_pid" ] && [ "$frontend_pid" -gt 0 ] 2>/dev/null; then
        write_step "Deteniendo Frontend (PID $frontend_pid)..."
        if kill_process_tree "$frontend_pid" TERM; then
            sleep 1
            if ps -p "$frontend_pid" &>/dev/null 2>&1; then
                write_warn "Forzando con SIGKILL..."
                kill_process_tree "$frontend_pid" KILL
            fi
            write_ok "Frontend detenido"
            stopped_frontend=1
        fi
    fi

    rm -f "$PID_FILE"
    write_ok ".dev-pids.json eliminado"
else
    write_warn "No se encontro .dev-pids.json"
fi

write_step "Limpiando puertos..."
for port in 8080 3000; do
    if command -v lsof &>/dev/null && lsof -ti :"$port" &>/dev/null 2>&1; then
        pid=$(lsof -ti :"$port" 2>/dev/null | head -1 || true)
        if [ -n "$pid" ]; then
            comm=$(ps -p "$pid" -o comm= 2>/dev/null || echo "proceso")
            write_warn "Puerto $port aun ocupado por $comm (PID $pid). Matando..."
            kill -9 "$pid" 2>/dev/null || true
        fi
    fi
done
write_ok "Puertos liberados"

echo
echo -e "${GN}============================================${NC}"
if [ "$stopped_backend" -eq 1 ] && [ "$stopped_frontend" -eq 1 ]; then
    echo -e "${GN}   TODOS LOS SERVICIOS DETENIDOS${NC}"
elif [ "$stopped_backend" -eq 1 ] || [ "$stopped_frontend" -eq 1 ]; then
    echo -e "${YL}   ALGUNOS SERVICIOS DETENIDOS${NC}"
else
    echo -e "${YL}   NO SE ENCONTRARON SERVICIOS ACTIVOS${NC}"
fi
echo -e "${GN}============================================${NC}"
echo