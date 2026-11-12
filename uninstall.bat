@echo off
setlocal

title AssetSync Uninstaller

echo ========================================================
echo               AssetSync Uninstaller
echo ========================================================
echo.

set "DEST=%APPDATA%\Adobe\CEP\extensions\com.assetsync"

if exist "%DEST%" (
    echo Removing AssetSync from:
    echo %DEST%
    rmdir /s /q "%DEST%" 2>nul
    echo.
    echo AssetSync has been removed.
) else (
    echo AssetSync was not found in:
    echo %DEST%
)

echo.
echo Restart Premiere Pro or After Effects to apply changes.
echo ========================================================
echo.

pause

