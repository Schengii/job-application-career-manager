# PowerShell Starter für Job Application & Career Manager
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  🚀 Job Application & Career Manager" -ForegroundColor Green
Write-Host "  Fachinformatiker Anwendungsentwicklung" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot

# 1. Node.js Check
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[FEHLER] Node.js wurde nicht gefunden!" -ForegroundColor Red
    Write-Host "Bitte installiere Node.js von https://nodejs.org/"
    Read-Host "Drücke Enter zum Beenden..."
    exit 1
}

# 2. Dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installiere Abhängigkeiten mit npm install..." -ForegroundColor Yellow
    npm install
}

# 3. Database Check
if (-not (Test-Path "dev.db")) {
    Write-Host "[INFO] Initialisiere SQLite Datenbank..." -ForegroundColor Yellow
    npx prisma db push
    npx prisma db seed
}

# 4. Open Browser
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
} | Out-Null

Write-Host "[INFO] Server wird gestartet unter: http://localhost:3000" -ForegroundColor Green
Write-Host "Drücke [Strg + C] zum Beenden." -ForegroundColor DarkGray
Write-Host ""

# 5. Start dev server
npm run dev
