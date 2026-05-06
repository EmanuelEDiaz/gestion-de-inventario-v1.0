#!/usr/bin/env bash
# ============================================================
#   INVENTARIO - INICIO BACKEND ONLY (Linux)
#   Uso: ./start-backend.sh
#   Para detener: Ctrl+C
#   Auto-instala: JDK 21, Maven (requiere sudo si faltan)
# ============================================================

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Colores ---
CY='\033[0;36m'; GN='\033[0;32m'; YL='\033[0;33m'; RD='\033[0;31m'; MG='\033[0;35m'; DG='\033[0;90m'; NC='\033[0m'

write_step() { echo; echo -e "${CY}>> $1${NC}"; }
write_ok()   { echo -e "${GN}   [OK] $1${NC}"; }
write_warn() { echo -e "${YL}   [!]  $1${NC}"; }
write_fail() { echo -e "${RD}   [X]  $1${NC}"; }

test_port() {
    (echo >/dev/tcp/localhost/"$1") 2>/dev/null
}

# ---- Instalar paquete apt si falta ----
apt_install() {
    local pkg="$1"
    write_warn "Instalando $pkg via apt..."
    sudo apt-get update -qq
    sudo apt-get install -y "$pkg"
}

# ---- Verificar version de Java >= 21 ----
java_ok() {
    command -v java &>/dev/null || return 1
    local ver
    ver=$(java -version 2>&1 | grep -oP '(?<=version ")[0-9]+' | head -1)
    [ "${ver:-0}" -ge 21 ] 2>/dev/null
}

echo
echo -e "${CY}============================================${NC}"
echo -e "${CY}   INVENTARIO - BACKEND ONLY${NC}"
echo -e "${CY}============================================${NC}"

# -------------------------------------------------------------------
# DEPENDENCIAS
# -------------------------------------------------------------------
write_step "Verificando e instalando dependencias..."

# Java 21
if ! java_ok; then
    write_warn "Java 21+ no encontrado. Instalando temurin-21-jdk..."
    # Adoptium repo (funciona en Ubuntu/Mint/Debian)
    if ! apt-cache show temurin-21-jdk &>/dev/null 2>&1; then
        sudo apt-get install -y wget apt-transport-https gnupg
        wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
            | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
        echo "deb https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo "$UBUNTU_CODENAME") main" \
            | sudo tee /etc/apt/sources.list.d/adoptium.list
        sudo apt-get update -qq
    fi
    sudo apt-get install -y temurin-21-jdk
fi
java_ver=$(java -version 2>&1 | head -1)
write_ok "Java: $java_ver"

# Maven
if ! command -v mvn &>/dev/null; then
    apt_install maven
fi
write_ok "Maven: $(mvn -v 2>&1 | head -1)"

# PostgreSQL check (no se instala automaticamente, debe estar configurado)
if systemctl is-active --quiet postgresql 2>/dev/null; then
    write_ok "PostgreSQL servicio ejecutandose"
elif test_port 5432; then
    write_ok "PostgreSQL respondiendo en :5432"
else
    write_warn "PostgreSQL no detectado en :5432"
    write_warn "Instala con: sudo apt install postgresql  y luego: sudo systemctl start postgresql"
    write_warn "Tambien necesitas crear la BD: sudo -u postgres createdb inventory"
    echo
    read -r -p "   Continuar de todas formas? [s/N] " resp
    [[ "$resp" =~ ^[Ss]$ ]] || exit 1
fi

# -------------------------------------------------------------------
# LIBERAR PUERTO 8080
# -------------------------------------------------------------------
if test_port 8080; then
    pid_8080=$(lsof -ti :8080 2>/dev/null | head -1 || true)
    if [ -n "$pid_8080" ]; then
        write_warn "Puerto 8080 ocupado (PID $pid_8080). Liberando..."
        kill -9 "$pid_8080" 2>/dev/null || true
        sleep 2
    fi
fi

# -------------------------------------------------------------------
# INICIAR BACKEND
# -------------------------------------------------------------------
write_step "Iniciando Backend (Spring Boot :8080)..."

BACKEND_DIR="$ROOT/backend/inventory-app"
write_ok "Directorio: $BACKEND_DIR"
echo
echo -e "   Credenciales: admin / admin123"
echo -e "${MG}   Swagger UI  : http://localhost:8080/swagger-ui.html${NC}"
echo -e "${YL}   Para detener: Ctrl+C${NC}"
echo -e "${CY}============================================${NC}"
echo

# Subshell para no cambiar el CWD del caller
(cd "$BACKEND_DIR" && \
    echo ">> Reparando migraciones Flyway..." && \
    mvn flyway:repair \
        -Dflyway.url=jdbc:postgresql://localhost:5432/inventory \
        -Dflyway.user=postgres \
        -Dflyway.password=postgres 2>&1 | grep -E "(repair|Repair|ERROR|WARN)" || true && \
    mvn spring-boot:run -Dmaven.test.skip=true)
