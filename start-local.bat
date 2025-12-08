@echo off
title Horse Race Betting - Local Server
color 0A

echo.
echo  ===================================
echo    🐎 HORSE RACE BETTING SERVER 🐎
echo  ===================================
echo.

:: Check if node_modules exists in server folder
if not exist "server\node_modules" (
    echo [!] Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
)

:: Check if web/dist exists (production build)
if not exist "web\dist\index.html" (
    echo [!] Building frontend...
    cd web
    call npm install
    call npm run build
    cd ..
    echo.
)

echo [*] Starting server on port 4000...
echo [*] Open browser: http://localhost:4000
echo.
echo Press Ctrl+C to stop the server
echo ===================================
echo.

:: Start server
cd server
start "" http://localhost:4000
node index.js

pause
