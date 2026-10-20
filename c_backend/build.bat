@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo  Building Tower of Hanoi C Backend Engine
echo ====================================================

:: Check local w64devkit GCC
if exist "%~dp0w64devkit\bin\gcc.exe" (
    echo [FOUND] Bundled GCC detected in w64devkit.
    echo Compiling hanoi_server.exe ...
    "%~dp0w64devkit\bin\gcc.exe" -O2 -Wall server.c hanoi.c -o hanoi_server.exe -lws2_32
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_server.exe
    ) else (
        echo [ERROR] Failed to compile server.c
        exit /b 1
    )
    echo Compiling hanoi_cli.exe ...
    "%~dp0w64devkit\bin\gcc.exe" -O2 -Wall hanoi_cli.c hanoi.c -o hanoi_cli.exe
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_cli.exe
    )
    goto finish
)

:: Check GCC (MinGW / MSYS2 / WinLibs / w64devkit in PATH)
where gcc >nul 2>nul
if %errorlevel% equ 0 (
    echo [FOUND] GCC compiler detected.
    echo Compiling hanoi_server.exe ...
    gcc -O2 -Wall server.c hanoi.c -o hanoi_server.exe -lws2_32
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_server.exe
    ) else (
        echo [ERROR] Failed to compile server.c
        exit /b 1
    )
    echo Compiling hanoi_cli.exe ...
    gcc -O2 -Wall hanoi_cli.c hanoi.c -o hanoi_cli.exe
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_cli.exe
    )
    goto finish
)

:: Check Clang (LLVM)
where clang >nul 2>nul
if %errorlevel% equ 0 (
    echo [FOUND] Clang compiler detected.
    echo Compiling hanoi_server.exe ...
    clang -O2 -Wall server.c hanoi.c -o hanoi_server.exe -lws2_32
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_server.exe
    ) else (
        echo [ERROR] Failed to compile server.c
        exit /b 1
    )
    echo Compiling hanoi_cli.exe ...
    clang -O2 -Wall hanoi_cli.c hanoi.c -o hanoi_cli.exe
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_cli.exe
    )
    goto finish
)

:: Check MSVC (cl.exe)
where cl >nul 2>nul
if %errorlevel% equ 0 (
    echo [FOUND] Microsoft Visual C++ (MSVC) compiler detected.
    echo Compiling hanoi_server.exe ...
    cl /O2 /W3 server.c hanoi.c /Fe:hanoi_server.exe ws2_32.lib
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_server.exe
    )
    echo Compiling hanoi_cli.exe ...
    cl /O2 /W3 hanoi_cli.c hanoi.c /Fe:hanoi_cli.exe
    if !errorlevel! equ 0 (
        echo [OK] Successfully built hanoi_cli.exe
    )
    goto finish
)

:: Check TinyCC (tcc.exe)
where tcc >nul 2>nul
if %errorlevel% equ 0 (
    echo [FOUND] TinyCC compiler detected.
    tcc server.c hanoi.c -o hanoi_server.exe -lws2_32
    tcc hanoi_cli.c hanoi.c -o hanoi_cli.exe
    echo [OK] Built binaries using TinyCC.
    goto finish
)

echo [NOTICE] No native C compiler found in PATH.
echo You can run the C logic immediately using:
echo   python run_server.py
echo Or install GCC via winget / MinGW / LLVM.
exit /b 2

:finish
echo ====================================================
echo Build Complete!
echo Run './hanoi_server.exe' to start the native C HTTP backend.
echo Run './hanoi_cli.exe' to play in terminal mode.
echo ====================================================
