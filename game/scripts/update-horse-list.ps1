Param(
  [string]$Dir = 'C:\Users\VMX\CascadeProjects\horse-maze-electron\assets\horses'
)

if (-not (Test-Path -LiteralPath $Dir)) {
  Write-Error "Directory not found: $Dir"
  exit 1
}

$files = Get-ChildItem -LiteralPath $Dir -File -Include *.png,*.jpg,*.jpeg,*.webp | Sort-Object Name
$lines = @()
$lines += 'window.horseSpriteList = ['
if ($files.Count -gt 0) {
  $lines += ($files | ForEach-Object { '  "' + ($_.Name -replace '"','\\"') + '",' })
  # remove trailing comma on last item
  $lines[$lines.Count-1] = $lines[$lines.Count-1].TrimEnd(',')
}
$lines += '];'
$dest = Join-Path $Dir 'list.js'
Set-Content -LiteralPath $dest -Value ($lines -join [Environment]::NewLine) -Encoding UTF8
Write-Host ("Regenerated {0} items to {1}" -f $files.Count, $dest)
