$ErrorActionPreference = 'Stop'

$caddyRoot = 'C:\Caddy'
$activeConfig = Join-Path $caddyRoot 'Caddyfile'
$backupConfig = Join-Path $caddyRoot 'Caddyfile.before-production'

if (-not (Test-Path $backupConfig)) {
  throw "Rollback configuration is missing: $backupConfig"
}

Copy-Item -Path $backupConfig -Destination $activeConfig -Force
Restart-Service -Name caddy

foreach ($port in 80, 443) {
  $ruleName = "KadexAI-Caddy-TCP-$port"
  Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue |
    Remove-NetFirewallRule
}

[pscustomobject]@{
  Service = (Get-Service -Name caddy).Status
  Config = $activeConfig
}
