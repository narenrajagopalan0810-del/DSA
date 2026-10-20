@echo off
title Samurai Hanoi - Native C Backend Server
echo ==========================================================
echo   ⛩️  SAMURAI TOWER OF HANOI - NATIVE C BACKEND ⛩️
echo ==========================================================
cd /d "%~dp0\c_backend"

:: Build native C backend if binary is not present
if not exist "hanoi_server.exe" (
    echo [*] Compiling native C backend engine...
    call build.bat
)

:: Run native compiled C server directly
if exist "hanoi_server.exe" (
    echo [*] Launching Native C WinSock2 Backend on port 8080...
    hanoi_server.exe 8080
) else (
    echo [ERROR] Failed to find or compile hanoi_server.exe!
    pause
)

