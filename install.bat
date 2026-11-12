@echo off
setlocal enabledelayedexpansion

title AssetSync Installer

echo ========================================================
echo               AssetSync Installation
echo    Premiere Pro ^& After Effects Auto-Import Extension
echo ========================================================
echo.

set "SRC=%~dp0"
:: Strip trailing backslash from SRC
if "%SRC:~-1%"=="\" set "SRC=%SRC:~0,-1%"

set "CEP_DIR=%APPDATA%\Adobe\CEP\extensions"
set "DEST=%CEP_DIR%\com.assetsync"

echo [1/3] Enabling unsigned extensions in Adobe CEP (PlayerDebugMode)...
for %%v in (9 10 11 12 13 14 15 16 17 18) do (
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo       PlayerDebugMode enabled for CSXS 9 through 18.

echo.
echo [2/3] Preparing extension destination...
if not exist "%CEP_DIR%" (
    mkdir "%CEP_DIR%" 2>nul
)

if "%1"=="/dev" goto do_symlink
if "%1"=="--dev" goto do_symlink
if "%1"=="/symlink" goto do_symlink
if "%1"=="--symlink" goto do_symlink
goto do_copy

:do_symlink
echo       Mode: Developer (Directory Junction)
if exist "%DEST%" (
    echo       Removing existing installation...
    rmdir /s /q "%DEST%" 2>nul
)
mklink /J "%DEST%" "%SRC%" >nul
if errorlevel 1 (
    echo [ERROR] Failed to create junction. Falling back to copy install...
    goto do_copy
)
echo       Created junction: "%DEST%" -^> "%SRC%"
goto finish

:do_copy
echo       Mode: Standard copy install
if exist "%DEST%" (
    echo       Removing previous version...
    rmdir /s /q "%DEST%" 2>nul
)
mkdir "%DEST%" 2>nul

echo [3/3] Copying extension files...
xcopy "%SRC%\CSXS" "%DEST%\CSXS\" /E /I /Q /Y >nul
xcopy "%SRC%\css" "%DEST%\css\" /E /I /Q /Y >nul
xcopy "%SRC%\js" "%DEST%\js\" /E /I /Q /Y >nul
xcopy "%SRC%\jsx" "%DEST%\jsx\" /E /I /Q /Y >nul
if exist "%SRC%\index.html" copy /Y "%SRC%\index.html" "%DEST%\" >nul
if exist "%SRC%\.debug" copy /Y "%SRC%\.debug" "%DEST%\" >nul 2>nul

:finish
echo.
echo ========================================================
echo   AssetSync installed successfully!
echo.
echo   Installed to:
echo   %DEST%
echo.
echo   Next steps:
echo   1. If Premiere Pro or After Effects is open, restart it.
echo   2. In Premiere or After Effects, go to:
echo      Window -^> Extensions -^> AssetSync
echo   3. Click "+ Watch folder" and select your download folder!
echo ========================================================
echo.

pause

