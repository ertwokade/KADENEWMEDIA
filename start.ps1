# KADE AI Platform — Tek komutla başlatma scripti (Windows PowerShell)
# Kullanım: .\start.ps1

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          KADE AI PLATFORM  v1.0                      ║" -ForegroundColor Cyan
Write-Host "║  İçerik Stüdyosu · Video Editör · Büyüme Analitiği  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$rootDir  = $PSScriptRoot
$backendDir  = Join-Path $rootDir "backend"
$frontendDir = $rootDir

# ─── 1. Python backend ────────────────────────────────────────────────────────
Write-Host "[1/2] Python backend başlatılıyor (port 8472)..." -ForegroundColor Yellow

$backendReady = $false

# Sanal ortam kontrolü
$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "      → Sanal ortam oluşturuluyor..." -ForegroundColor Gray
    Set-Location $backendDir
    python -m venv .venv
    & "$venvPython" -m pip install -r requirements.txt --quiet
    Set-Location $rootDir
}

# Backend'i arka planda başlat
$backendJob = Start-Job -ScriptBlock {
    param($dir, $python)
    Set-Location $dir
    & $python -m uvicorn main:app --host 0.0.0.0 --port 8472 --reload
} -ArgumentList $backendDir, $venvPython

Write-Host "      ✓ Backend job başlatıldı (PID: $($backendJob.Id))" -ForegroundColor Green
Write-Host "        URL: http://localhost:8472" -ForegroundColor Gray
Write-Host "        Docs: http://localhost:8472/docs" -ForegroundColor Gray

Start-Sleep -Seconds 3

# ─── 2. Next.js frontend ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/2] Next.js frontend başlatılıyor (port 3000)..." -ForegroundColor Yellow

# node_modules kontrolü
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "      → Bağımlılıklar yükleniyor (npm install)..." -ForegroundColor Gray
    Set-Location $frontendDir
    npm install --legacy-peer-deps
}

Write-Host "      ✓ Frontend başlatılıyor..." -ForegroundColor Green
Write-Host "        URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host " Durdurmak için: Ctrl+C" -ForegroundColor DarkGray
Write-Host "─────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

Set-Location $frontendDir
try {
    npm run dev
} finally {
    Write-Host "`nBackend durduruluyor..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "Platform tamamen kapatıldı." -ForegroundColor Green
}
