@echo off
echo ====================================
echo       CSV Analyzer Web Interface
echo ====================================
echo.
echo Starting CSV Analyzer Web Interface...
echo Server start op http://localhost:8000
echo Browser opent automatisch...
echo.
echo Druk op Ctrl+C om de server te stoppen
echo.

REM Start browser na korte vertraging
timeout /t 2 /nobreak >nul
start http://localhost:8000

REM Start Node.js server
node server.js

echo.
echo Druk op een toets om af te sluiten...
pause >nul