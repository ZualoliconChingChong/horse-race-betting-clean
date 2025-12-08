# Rebuild Electron app (install deps + build) with minimal friction
# Usage: Right-click -> Run with PowerShell OR run from PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\rebuild.ps1

$ErrorActionPreference = 'Stop'

Write-Host "[1/4] Temporarily bypass execution policy for this process..." -ForegroundColor Cyan
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Resolve project root (script directory)
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $PSScriptRoot

# Resolve npm path explicitly to avoid ps1 policy issues
$npm = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path $npm)) {
  Write-Error "npm not found at '$npm'. Please install Node.js LTS from https://nodejs.org/ and re-run."
}

Write-Host "[2/4] Installing dependencies (npm install)..." -ForegroundColor Cyan
& $npm install

Write-Host "[3/4] Building Windows app (npm run build)..." -ForegroundColor Cyan
& $npm run build

$exe = Join-Path $PSScriptRoot "dist/win-unpacked/Horse Maze Race.exe"
if (Test-Path $exe) {
  Write-Host "[4/4] Build finished. Start the app with:" -ForegroundColor Green
  Write-Host "       $exe" -ForegroundColor Yellow
} else {
  Write-Warning "Build completed but EXE not found at $exe. Check build logs for errors."
}
