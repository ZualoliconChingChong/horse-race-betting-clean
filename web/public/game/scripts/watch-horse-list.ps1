Param(
  [string]$Dir = 'C:\Users\VMX\CascadeProjects\horse-maze-electron\assets\horses'
)

if (-not (Test-Path -LiteralPath $Dir)) {
  Write-Error "Directory not found: $Dir"
  exit 1
}

$scriptPath = Join-Path (Split-Path -Parent $PSCommandPath) 'update-horse-list.ps1'
if (-not (Test-Path -LiteralPath $scriptPath)) {
  Write-Error "Required script not found: $scriptPath"
  exit 1
}

Write-Host "Watching: $Dir"
Write-Host "Press Ctrl+C to stop."

# Helper: debounce updates to avoid spamming on batch copies
$debounceMs = 500
$timer = New-Object Timers.Timer
$timer.Interval = $debounceMs
$timer.AutoReset = $false

$updateAction = {
  try {
    & $using:scriptPath -Dir $using:Dir | Out-Host
  } catch {
    Write-Warning ("Update failed: {0}" -f $_)
  }
}

$timerEvent = Register-ObjectEvent -InputObject $timer -EventName Elapsed -Action $updateAction

function Queue-Update {
  # Restart debounce timer
  $timer.Stop(); $timer.Start()
}

$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $Dir
$fsw.IncludeSubdirectories = $false
$fsw.Filter = '*.*'
$fsw.EnableRaisingEvents = $true

$events = @()
$events += Register-ObjectEvent $fsw Created -SourceIdentifier horses_created -Action { Queue-Update }
$events += Register-ObjectEvent $fsw Changed -SourceIdentifier horses_changed -Action { Queue-Update }
$events += Register-ObjectEvent $fsw Deleted -SourceIdentifier horses_deleted -Action { Queue-Update }
$events += Register-ObjectEvent $fsw Renamed -SourceIdentifier horses_renamed -Action { Queue-Update }

# Run once at start
& $scriptPath -Dir $Dir | Out-Host

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  # Cleanup
  $events | ForEach-Object { Unregister-Event -SourceIdentifier $_.Name -ErrorAction SilentlyContinue }
  Unregister-Event -SourceIdentifier $timerEvent.Name -ErrorAction SilentlyContinue
  $timer.Dispose()
  $fsw.Dispose()
}
