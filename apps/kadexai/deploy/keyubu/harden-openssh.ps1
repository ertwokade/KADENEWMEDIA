$ErrorActionPreference = 'Stop'

$configPath = 'C:\ProgramData\ssh\sshd_config'
$backupPath = 'C:\Kade\sshd_config.before-hardening'
$sshdPath = "$env:WINDIR\System32\OpenSSH\sshd.exe"

Copy-Item -Path $configPath -Destination $backupPath -Force
$content = Get-Content -Path $configPath |
  Where-Object {
    $_ -notmatch '^\s*#?\s*(PasswordAuthentication|PubkeyAuthentication)\s+'
  }
$content += ''
$content += '# KadexAI server hardening'
$content += 'PubkeyAuthentication yes'
$content += 'PasswordAuthentication no'
Set-Content -Path $configPath -Value $content -Encoding ascii

& $sshdPath -t -f $configPath
if ($LASTEXITCODE -ne 0) {
  Copy-Item -Path $backupPath -Destination $configPath -Force
  throw "OpenSSH rejected the new configuration with exit code $LASTEXITCODE."
}

Restart-Service -Name sshd
Get-Service -Name sshd | Select-Object Name, Status, StartType
