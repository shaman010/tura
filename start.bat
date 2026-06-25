@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo   Swipd - marketplace MVP
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js ne nayden. Ustanovite Node.js LTS s https://nodejs.org
  echo     i zapustite etot fayl snova.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo [*] Pervyy zapusk: ustanavlivayu zavisimosti...
  call npm install
)
echo.
echo [*] Zapuskayu server. Otkroyte v brauzere:  http://localhost:5173
echo     Chtoby ostanovit - zakroyte eto okno ili nazhmite Ctrl+C
echo.
call npm run dev
pause
