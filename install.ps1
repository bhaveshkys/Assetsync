# AssetSync PowerShell Installer for Windows
param (
    [switch]$Dev
)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "              AssetSync Installation" -ForegroundColor Cyan
Write-Host "   Premiere Pro & After Effects Auto-Import Extension" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$src = $PSScriptRoot
$cepDir = Join-Path $env:APPDATA "Adobe\CEP\extensions"
$dest = Join-Path $cepDir "com.assetsync"

Write-Host "[1/3] Enabling unsigned extensions in Adobe CEP (PlayerDebugMode)..." -ForegroundColor Yellow
9..18 | ForEach-Object {
    $regPath = "HKCU:\Software\Adobe\CSXS.$_"
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    Set-ItemProperty -Path $regPath -Name "PlayerDebugMode" -Value "1" -Force | Out-Null
}
Write-Host "      PlayerDebugMode enabled for CSXS 9 through 18." -ForegroundColor Green

Write-Host "`n[2/3] Preparing extension directory..." -ForegroundColor Yellow
if (-not (Test-Path $cepDir)) {
    New-Item -ItemType Directory -Path $cepDir -Force | Out-Null
}

if ($Dev) {
    Write-Host "      Mode: Developer (Junction)" -ForegroundColor Yellow
    if (Test-Path $dest) {
        Remove-Item -Path $dest -Recurse -Force | Out-Null
    }
    cmd /c "mklink /J `"$dest`" `"$src`"" | Out-Null
    Write-Host "      Created junction: $dest -> $src" -ForegroundColor Green
} else {
    Write-Host "      Mode: Standard copy install" -ForegroundColor Yellow
    if (Test-Path $dest) {
        Remove-Item -Path $dest -Recurse -Force | Out-Null
    }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null

    Write-Host "`n[3/3] Copying extension files..." -ForegroundColor Yellow
    @("CSXS", "css", "js", "jsx") | ForEach-Object {
        $sourcePath = Join-Path $src $_
        if (Test-Path $sourcePath) {
            Copy-Item -Path $sourcePath -Destination $dest -Recurse -Force
        }
    }
    @("index.html", ".debug") | ForEach-Object {
        $sourceFile = Join-Path $src $_
        if (Test-Path $sourceFile) {
            Copy-Item -Path $sourceFile -Destination $dest -Force
        }
    }
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  AssetSync installed successfully!" -ForegroundColor Green
Write-Host "`n  Installed to: $dest" -ForegroundColor White
Write-Host "`n  Next steps:" -ForegroundColor White
Write-Host "  1. Restart Premiere Pro or After Effects if open." -ForegroundColor White
Write-Host "  2. Go to: Window -> Extensions -> AssetSync" -ForegroundColor White
Write-Host "  3. Click '+ Watch folder' and pick your download directory!" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green

