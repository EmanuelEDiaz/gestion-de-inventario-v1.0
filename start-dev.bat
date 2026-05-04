@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   INVENTARIO - INICIO RÁPIDO
echo ============================================
echo.

REM Verificar Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java no encontrado. Instala JDK 21+
    exit /b 1
)
echo [OK] Java encontrado

REM Verificar Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no encontrado. Instala Node.js
    exit /b 1
)
echo [OK] Node.js encontrado

REM Verificar pnpm
pnpm -v >nul 2>&1
if errorlevel 1 (
    echo [INFO] Instalando pnpm...
    npm install -g pnpm
)
echo [OK] pnpm disponible

REM Verificar si PostgreSQL está ejecutándose
sc query postgresql-x64-17 >nul 2>&1
if errorlevel 1 (
    echo [WARNING] PostgreSQL no está como servicio Windows
    echo [INFO] Asegúrate de que PostgreSQL esté ejecutándose en localhost:5432
) else (
    echo [OK] PostgreSQL disponible
)

echo.
echo ============================================
echo   INICIANDO BACKEND (Spring Boot)
echo ============================================
start "Backend - Spring Boot" cmd /k "cd /d %~dp0backend\inventory-app && mvn spring-boot:run -DskipTests"

echo [INFO] Esperando backend (30 segundos)...
timeout /t 30 /nobreak >nul

REM Verificar si el backend responde
curl -s http://localhost:8080/actuator/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Backend puede que no esté listo aún
) else (
    echo [OK] Backend iniciado en http://localhost:8080
)

echo.
echo ============================================
echo   INICIANDO FRONTEND (Next.js)
echo ============================================
start "Frontend - Next.js" cmd /k "cd /d %~dp0frontend && pnpm dev"

echo [INFO] Esperando frontend (15 segundos)...
timeout /t 15 /nobreak >nul

echo.
echo ============================================
echo   APLICACIÓN LISTA
echo ============================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8080
echo   API:      http://localhost:8080/api/v1
echo.
echo   Credenciales de prueba:
echo   - Usuario: admin
echo   - Contraseña: admin123
echo.
echo ============================================
echo Presiona cualquier tecla para salir...
echo ============================================
pause >nul