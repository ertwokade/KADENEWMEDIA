$ErrorActionPreference = 'Stop'

$caddyRoot = 'C:\Caddy'
$caddyExe = Join-Path $caddyRoot 'caddy.exe'
$activeConfig = Join-Path $caddyRoot 'Caddyfile'
$stagedConfig = 'C:\Kade\Caddyfile.production'
$backupConfig = Join-Path $caddyRoot 'Caddyfile.before-production'

if (-not (Test-Path $stagedConfig)) {
  throw "Production Caddyfile is missing: $stagedConfig"
}

Copy-Item -Path $activeConfig -Destination $backupConfig -Force
Copy-Item -Path $stagedConfig -Destination $activeConfig -Force

& $caddyExe validate --config $activeConfig --adapter caddyfile
if ($LASTEXITCODE -ne 0) {
  Copy-Item -Path $backupConfig -Destination $activeConfig -Force
  throw 'Production Caddy configuration is invalid.'
}

foreach ($port in 80, 443) {
  $ruleName = "KadexAI-Caddy-TCP-$port"
  if (-not (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule `
      -Name $ruleName `
      -DisplayName "KadexAI Caddy TCP $port" `
      -Enabled True `
      -Direction Inbound `
      -Protocol TCP `
      -Action Allow `
      -LocalPort $port | Out-Null
  }
}

Restart-Service -Name caddy
Start-Sleep -Seconds 2

[pscustomobject]@{
  Service = (Get-Service -Name caddy).Status
  Http80 = [bool](Get-NetTCPConnection -State Listen -LocalPort 80 -ErrorAction SilentlyContinue)
  Https443 = [bool](Get-NetTCPConnection -State Listen -LocalPort 443 -ErrorAction SilentlyContinue)
  RollbackConfig = $backupConfig
}
