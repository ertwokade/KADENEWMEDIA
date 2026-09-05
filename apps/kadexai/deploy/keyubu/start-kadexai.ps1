$ErrorActionPreference = 'Continue'

$logDirectory = 'C:\Kade\logs'
$logFile = Join-Path $logDirectory 'kadexai-wsl.log'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$wslArguments = @(
  '-d', 'Ubuntu-24.04',
  '-u', 'root',
  '--',
  'bash', '-lc',
  'systemctl start docker && cd /srv/kade/current/apps/kadexai/deploy/keyubu && docker compose --env-file /srv/kade/secrets/kadexai.env up -d && exec sleep infinity'
)

while ($true) {
  "$(Get-Date -Format o) Starting KadexAI WSL services" | Add-Content -Path $logFile
  & "$env:WINDIR\System32\wsl.exe" @wslArguments *>> $logFile
  "$(Get-Date -Format o) WSL process exited; retrying in 10 seconds" | Add-Content -Path $logFile
  Start-Sleep -Seconds 10
}
