@echo off
chcp 65001 >nul
title Bewerbungs-Dashboard Starter
color 0B

echo ===================================================
echo   🚀 Job Application ^& Career Manager
echo   Fachinformatiker Anwendungsentwicklung
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Prüfe ob Node.js installiert ist
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [FEHLER] Node.js wurde nicht gefunden!
    echo Bitte installiere Node.js von https://nodejs.org/ (Version 20 oder neuer).
    echo.
    pause
    exit /b 1
)

:: 2. Prüfe ob node_modules existieren
if not exist "node_modules\" (
    echo [INFO] Erstinstallation: Installiere Pakete mit npm install ...
    call npm install
    if %errorlevel% neq 0 (
        echo [FEHLER] npm install ist fehlgeschlagen!
        pause
        exit /b 1
    )
)

:: 3. Prüfe ob die SQLite-Datenbank existiert
if not exist "dev.db" (
    echo [INFO] Initialisiere Datenbank dev.db mit Prisma ...
    call npx prisma db push
    echo [INFO] Lade Beispieldaten ...
    call npx prisma db seed
)

:: 4. Browser nach kurzer Verzögerung automatisch im Hintergrund öffnen
echo [INFO] Öffne Browser unter http://localhost:3000 ...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 5. Next.js Server starten
echo [INFO] Starte Next.js Entwicklungsserver (Turbopack) ...
echo.
echo ===================================================
echo   App läuft unter: http://localhost:3000
echo   Drücke [Strg + C] im Fenster, um zu beenden.
echo ===================================================
echo.

call npm run dev

pause
