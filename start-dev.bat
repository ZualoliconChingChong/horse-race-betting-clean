@echo off
title Horse Race Betting - Development Mode
color 0E

echo.
echo  =====================================
echo    🐎 HORSE RACE BETTING - DEV MODE 🐎
echo  =====================================
echo.

:: Check dependencies
if not exist "server\node_modules" (
    echo [!] Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "web\node_modules" (
    echo [!] Installing web dependencies...
    cd web
    call npm install
    cd ..
)

echo.
echo [*] Starting Backend server on port 4000...
echo [*] Starting Frontend dev server on port 5173...
echo.
echo    Backend:  http://localhost:4000/api
echo    Frontend: http://localhost:5173
echo.
echo =====================================
echo.

:: Start backend in new window
start "Backend Server" cmd /k "cd server && npm run dev"

:: Wait a bit for backend to start
timeout /t 2 /nobreak > nul

:: Start frontend dev server
cd web
start "" http://localhost:5173
npm run dev
