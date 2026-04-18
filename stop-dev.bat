@echo off
echo ============================================
echo   DETENER SERVICIOS DE INVENTARIO
echo ============================================

echo [INFO] Deteniendo procesos Java (backend)...
taskkill /F /IM java.exe 2>nul

echo [INFO] Deteniendo procesos Node (frontend)...
taskkill /F /IM node.exe 2>nul

echo [OK] Servicios detenidos
echo.
pause