@echo off
:: Reset DNS to Automatic (DHCP)
:: Double-click de chay voi quyen Admin

title Reset DNS to Automatic

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
echo   Reset DNS ve Automatic (DHCP)
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

:: Reset DNS to Automatic
echo [3/4] Dang reset DNS ve Automatic...
powershell -Command "Set-DnsClientServerAddress -InterfaceAlias '%ADAPTER_NAME%' -ResetServerAddresses" >nul 2>&1

if %errorLevel% neq 0 (
    echo [ERROR] Khong the reset DNS! Vui long thu lai.
    echo.
    pause
    exit /b 1
)

echo [OK] Da reset DNS ve Automatic thanh cong!
echo.

:: Verify new DNS
echo [4/4] DNS moi:
powershell -Command "$dns = Get-DnsClientServerAddress -InterfaceAlias '%ADAPTER_NAME%' -AddressFamily IPv4; if ($dns.ServerAddresses) { $dns.ServerAddresses | ForEach-Object { Write-Host '  - '$_ -ForegroundColor Green } } else { Write-Host '  - Automatic (DHCP)' -ForegroundColor Green }"
echo.

:: Flush DNS cache
echo Dang xoa DNS cache...
ipconfig /flushdns >nul 2>&1
echo [OK] Da xoa DNS cache!
echo.

:: Renew IP address
echo Dang renew IP address...
ipconfig /renew >nul 2>&1
echo [OK] Da renew IP address!
echo.

echo ============================================
echo   HOAN THANH! DNS da duoc reset ve Auto.
echo ============================================
echo.
echo DNS se tu dong lay tu router/ISP (DHCP)
echo.

pause
