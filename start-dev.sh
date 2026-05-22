#!/usr/bin/env zsh
# ============================================================
#   INVENTARIO - INICIO DE DESARROLLO (Linux)
#   Uso: ./start-dev.sh
#   Para detener todo: Ctrl+C o ./stop-dev.sh
#   Auto-instala: JDK 21, Maven, Node.js 22 LTS, pnpm
#   (requiere sudo para instalaciones del sistema)
# ============================================================

set -euo pipefail
SCRIPT_PATH="${(%):-%x}"
ROOT="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
PID_FILE="$ROOT/.dev-pids.json"

CY='\033[0;36m'; GN='\033[0;32m'; YL='\033[0;33m'; RD='\033[0;31m'
MG='\033[0;35m'; DG='\033[0;90m'; NC='\033[0m'

write_step() { echo; echo -e "${CY}>> $1${NC}"; }
write_ok()   { echo -e "${GN}   [OK] $1${NC}"; }
write_warn() { echo -e "${YL}   [!]  $1${NC}"; }

test_port() {
    (echo >/dev/tcp/localhost/"$1") 2>/dev/null
}

wait_for_port() {
    local port=$1 name=$2 max=${3:-120} elapsed=0
    while ! test_port "$port" && [ "$elapsed" -lt "$max" ]; do
        echo -e "${DG}   [~] Esperando $name en :$port ... ($elapsed/${max}s)${NC}"
        sleep 5
        elapsed=$((elapsed + 5))
    done
    if test_port "$port"; then
        write_ok "$name listo en :$port"
        return 0
    else
        write_warn "$name no respondio en ${max}s (puede tardar mas)"
        return 1
    fi
}

java_ok() {
    command -v java &>/dev/null || return 1
    local ver
    ver=$(java -version 2>&1 | grep -oP '(?<=version ")[0-9]+' | head -1)
    [ "${ver:-0}" -ge 21 ] 2>/dev/null
}

node_ok() {
    command -v node &>/dev/null || return 1
    local ver
    ver=$(node -v 2>&1 | grep -oP '[0-9]+' | head -1)
    [ "${ver:-0}" -ge 20 ] 2>/dev/null
}

TERMINAL_SCRIPTS=()

open_terminal() {
    local title="$1" dir="$2" cmd="$3" suffix="${4:-default}"
    local terminal_pid=$$
    local script_file

    script_file="/tmp/.dev_terminal_${suffix}_$$.sh"
    {
        echo "#!/bin/bash"
        echo "cd \"$dir\""
        echo "$cmd"
        echo "exec bash"
    } > "$script_file"
    chmod +x "$script_file"
    TERMINAL_SCRIPTS+=("$script_file")

    if command -v konsole &>/dev/null; then
        konsole --separate --noclose --title "$title" -e "$script_file" &
        terminal_pid=$!
    elif command -v kitty &>/dev/null; then
        kitty --hold --title "$title" -e "$script_file" &
        terminal_pid=$!
    elif command -v gnome-terminal &>/dev/null; then
        gnome-terminal --title="$title" -- "$script_file" &
        terminal_pid=$!
    elif command -v xfce4-terminal &>/dev/null; then
        xfce4-terminal --title="$title" -e "$script_file" &
        terminal_pid=$!
    else
        write_warn "Sin emulador GUI. '$title' ejecutandose en background (log: ${title// /_}.log)"
        zsh "$script_file" >"$ROOT/${title// /_}.log" 2>&1 &
        terminal_pid=$!
    fi

    echo "$terminal_pid"
}

cleanup_scripts() {
    for script in "${TERMINAL_SCRIPTS[@]}"; do
        rm -f "$script" 2>/dev/null || true
    done
}

echo
echo -e "${CY}============================================${NC}"
echo -e "${CY}   INVENTARIO - ENTORNO DE DESARROLLO${NC}"
echo -e "${CY}============================================${NC}"

write_step "Verificando e instalando dependencias del sistema..."

if ! java_ok; then
    write_warn "Java 21+ no encontrado. Instalando Eclipse Temurin 21..."
    sudo apt-get install -y wget apt-transport-https gnupg
    wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
        | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
    UBUNTU_CODENAME=$(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
    echo "deb https://packages.adoptium.net/artifactory/deb ${UBUNTU_CODENAME} main" \
        | sudo tee /etc/apt/sources.list.d/adoptium.list
    sudo apt-get update -qq
    sudo apt-get install -y temurin-21-jdk
fi
write_ok "Java: $(java -version 2>&1 | head -1)"

if ! command -v mvn &>/dev/null; then
    write_warn "Maven no encontrado. Instalando..."
    sudo apt-get update -qq
    sudo apt-get install -y maven
fi
write_ok "Maven: $(mvn -v 2>&1 | head -1)"

if ! node_ok; then
    write_warn "Node.js 20+ no encontrado. Instalando Node.js 22 LTS via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
write_ok "Node.js: $(node -v)"

if ! command -v pnpm &>/dev/null; then
    write_warn "pnpm no encontrado. Instalando..."
    npm install -g pnpm
fi
write_ok "pnpm: $(pnpm -v)"

if systemctl is-active --quiet postgresql 2>/dev/null; then
    write_ok "PostgreSQL servicio ejecutandose"
elif test_port 5432; then
    write_ok "PostgreSQL respondiendo en :5432"
else
    write_warn "PostgreSQL no detectado en :5432"
    write_warn "Instala:   sudo apt install postgresql"
    write_warn "Configura: sudo -u postgres psql -c \"CREATE DATABASE inventory;\""
    echo
    read -r -p "   Continuar de todas formas? [s/N] " resp
    [[ "$resp" =~ ^[Ss]$ ]] || exit 1
fi

write_step "Verificando dependencias del proyecto..."

FRONTEND_DIR="$ROOT/frontend"
BACKEND_DIR="$ROOT/backend/inventory-app"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    write_warn "node_modules no encontrado. Ejecutando pnpm install..."
    (cd "$FRONTEND_DIR" && pnpm install)
fi
write_ok "Frontend: dependencias listas"

if [ ! -d "$BACKEND_DIR/target/classes" ]; then
    write_warn "Backend sin compilar. Descargando dependencias Maven..."
    (cd "$BACKEND_DIR" && mvn dependency:resolve -q)
fi
write_ok "Backend: dependencias listas"

for port in 8080 3000; do
    if test_port "$port"; then
        pid_port=$(lsof -ti :"$port" 2>/dev/null | head -1 || true)
        if [ -n "$pid_port" ]; then
            write_warn "Puerto $port ocupado (PID $pid_port). Liberando..."
            kill "$pid_port" 2>/dev/null || true
            sleep 2
        fi
    fi
done

write_step "Iniciando Backend (Spring Boot :8080)..."
open_terminal "BACKEND - Spring Boot" "$ROOT" "./start-backend.sh" "backend" &
backend_pid=$!
write_ok "Backend iniciado (PID: $backend_pid)"

write_step "Iniciando Frontend (Next.js :3000)..."
FRONTEND_CMD="echo '=== FRONTEND (Next.js) ===' && pnpm approve-builds sharp unrs-resolver && NODE_OPTIONS=\"--max-old-space-size=1536\" pnpm dev"
open_terminal "FRONTEND - Next.js" "$FRONTEND_DIR" "$FRONTEND_CMD" "frontend" &
frontend_pid=$!
write_ok "Frontend iniciado (PID: $frontend_pid)"

printf '{"backend": %s, "frontend": %s}\n' "$backend_pid" "$frontend_pid" > "$PID_FILE"
write_ok "PIDs guardados en .dev-pids.json"

write_step "Esperando que los servicios respondan..."
echo -e "${DG}   (El backend puede tardar 1-2 min la primera vez)${NC}"

back_ok=0; front_ok=0
wait_for_port 8080 "Backend"  120 && back_ok=1 || true
wait_for_port 3000 "Frontend" 60 && front_ok=1 || true

echo
echo -e "${CY}============================================${NC}"
echo -e "${CY}   APLICACION EN MARCHA${NC}"
echo -e "${CY}============================================${NC}"

b_url="http://localhost:8080"; [ $back_ok  -eq 0 ] && b_url+=' (iniciando...)'
f_url="http://localhost:3000"; [ $front_ok -eq 0 ] && f_url+=' (iniciando...)'

[ $front_ok -eq 1 ] && echo -e "${GN}   Frontend  : $f_url${NC}" || echo -e "${YL}   Frontend  : $f_url${NC}"
[ $back_ok  -eq 1 ] && echo -e "${GN}   Backend   : $b_url${NC}" || echo -e "${YL}   Backend   : $b_url${NC}"
echo -e "${MG}   Swagger   : http://localhost:8080/swagger-ui.html${NC}"
echo -e "${DG}   Health    : http://localhost:8080/actuator/health${NC}"
echo -e "${DG}   API       : http://localhost:8080/api/v1${NC}"
echo
echo    "   Credenciales: admin / admin123"
echo
echo -e "${YL}   Para detener: Ctrl+C${NC}"
echo -e "${CY}============================================${NC}"
echo

cleanup() {
    echo
    echo -e "${YL}>> Cerrando ventanas...${NC}"
    kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

wait