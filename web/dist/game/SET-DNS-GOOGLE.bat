@echo off
:: Set DNS Google - All-in-One Script
:: Double-click de chay voi quyen Admin

title Set DNS Google

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ============================================
    echo   Dang xin quyen Administrator...
    echo ============================================
    echo.
    
    :: Re-run with admin rights
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Running with Admin rights
cls
echo ============================================
echo   Set DNS Google (8.8.8.8 ^& 8.8.4.4)
echo ============================================
echo.

:: Get network adapter name
echo [1/4] Dang tim network adapter...
for /f "tokens=1,2 delims=," %%a in ('powershell -Command "Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | Select-Object -First 1 -ExpandProperty Name"') do set ADAPTER_NAME=%%a

if "%ADAPTER_NAME%"=="" (
    echo [ERROR] Khong tim thay network adapter nao dang hoat dong!
    echo.
    pause
    exit /b 1
)

echo [OK] Tim thay adapter: %ADAPTER_NAME%
echo.

:: Show current DNS
echo [2/4] DNS hien tai:
powershell -Command "$dns = Get-DnsClientServerAddress -InterfaceAlias '%ADAPTER_NAME%' -AddressFamily IPv4; if ($dns.ServerAddresses) { $dns.ServerAddresses | ForEach-Object { Write-Host '  - '$_ } } else { Write-Host '  - Automatic (DHCP)' }"
echo.

:: Set DNS Google
echo [3/4] Dang set DNS Google...
powershell -Command "Set-DnsClientServerAddress -InterfaceAlias '%ADAPTER_NAME%' -ServerAddresses ('8.8.8.8','8.8.4.4')" >nul 2>&1

if %errorLevel% neq 0 (
    echo [ERROR] Khong the set DNS! Vui long thu lai.
    echo.
    pause
    exit /b 1
)

echo [OK] Da set DNS Google thanh cong!
echo.

:: Verify new DNS
echo [4/4] DNS moi:
powershell -Command "Get-DnsClientServerAddress -InterfaceAlias '%ADAPTER_NAME%' -AddressFamily IPv4 | Select-Object -ExpandProperty ServerAddresses | ForEach-Object { Write-Host '  - '$_ -ForegroundColor Green }"
echo.

:: Flush DNS cache
echo Dang xoa DNS cache...
ipconfig /flushdns >nul 2>&1
echo [OK] Da xoa DNS cache!
echo.

echo ============================================
echo   HOAN THANH! DNS Google da duoc cai dat.
echo ============================================
echo.
echo Test DNS:
echo   nslookup google.com
echo.
echo Primary DNS:   8.8.8.8
echo Secondary DNS: 8.8.4.4
echo.

pause
