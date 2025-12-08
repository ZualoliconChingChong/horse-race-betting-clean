# Sync game files from horse-maze-electron to web project
# Run this after making changes to race-save-injector.js or other game files

Write-Host "🔄 Syncing game files..." -ForegroundColor Cyan

$source = "e:\CascadeProjects\horse-maze-electron"
$publicDest = "e:\CascadeProjects\horse-race-betting-clean\web\public\horse-maze-game"
$distDest = "e:\CascadeProjects\horse-race-betting-clean\web\dist\horse-maze-game"

# Files to sync
$files = @(
    "race-save-injector.js"
)

foreach ($file in $files) {
    $sourcePath = Join-Path $source $file
    
    if (Test-Path $sourcePath) {
        # Copy to public (for development)
        $publicPath = Join-Path $publicDest $file
        Copy-Item $sourcePath $publicPath -Force
        Write-Host "✅ Copied $file to public/" -ForegroundColor Green
        
        # Copy to dist (for production)
        if (Test-Path $distDest) {
            $distPath = Join-Path $distDest $file
            Copy-Item $sourcePath $distPath -Force
            Write-Host "✅ Copied $file to dist/" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  Source file not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Sync complete!" -ForegroundColor Green
Write-Host "💡 Tip: Run this script after editing race-save-injector.js" -ForegroundColor Cyan
