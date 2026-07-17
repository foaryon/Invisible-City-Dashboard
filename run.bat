@echo off
REM The Invisible City - one-click launcher (Windows). Double-click to run.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo The Invisible City needs Node.js 22+  -  install it from https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies ^(first run only^)...
  call npm ci || call npm install
)
if not exist "apps\web\dist\index.html" (
  echo Building the app ^(first run only^)...
  call npm run build --workspace apps/web
)

set OPEN_BROWSER=1
if "%PORT%"=="" set PORT=3001
REM Bind all interfaces so your Android phone (same Wi-Fi) can open it too.
if "%HOST%"=="" set HOST=0.0.0.0
echo.
echo   Starting The Invisible City ...  (close this window to stop)
echo   The exact address for your phone is printed below.
echo.
call npm run start --workspace apps/api
pause
