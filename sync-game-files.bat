@echo off
echo.
echo ========================================
echo   SYNC GAME FILES
echo ========================================
echo.

set "SOURCE=e:\CascadeProjects\horse-maze-electron"
set "PUBLIC=e:\CascadeProjects\horse-race-betting-clean\web\public\horse-maze-game"
set "DIST=e:\CascadeProjects\horse-race-betting-clean\web\dist\horse-maze-game"

echo Syncing race-save-injector.js...
echo.

REM Copy to public
if exist "%SOURCE%\race-save-injector.js" (
    copy /Y "%SOURCE%\race-save-injector.js" "%PUBLIC%\" >nul
    echo [OK] Copied to public/horse-maze-game/
) else (
    echo [ERROR] Source file not found!
)

REM Copy to dist
if exist "%SOURCE%\race-save-injector.js" (
    if exist "%DIST%" (
        copy /Y "%SOURCE%\race-save-injector.js" "%DIST%\" >nul
        echo [OK] Copied to dist/horse-maze-game/
    ) else (
        echo [SKIP] Dist folder not found (run npm run build first)
    )
)

echo.
echo ========================================
echo   SYNC COMPLETE!
echo ========================================
echo.
echo Tip: Hard refresh browser (Ctrl+Shift+R)
echo.
pause
