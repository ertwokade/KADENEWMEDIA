$ErrorActionPreference = 'Stop'

$version = '2.11.4'
$rootDirectory = 'C:\Caddy'
$downloadDirectory = Join-Path $rootDirectory 'download'
$archiveName = "caddy_${version}_windows_amd64.zip"
$archivePath = Join-Path $downloadDirectory $archiveName
$checksumsPath = Join-Path $downloadDirectory "caddy_${version}_checksums.txt"
$releaseBaseUrl = "https://github.com/caddyserver/caddy/releases/download/v$version"

if (Get-Service -Name 'caddy' -ErrorAction SilentlyContinue) {
  throw 'A caddy Windows service already exists. Refusing to overwrite it.'
}

New-Item -ItemType Directory -Path $downloadDirectory -Force | Out-Null
if (-not (Test-Path $archivePath)) {
  Invoke-WebRequest -UseBasicParsing -Uri "$releaseBaseUrl/$archiveName" -OutFile $archivePath
}
if (-not (Test-Path $checksumsPath)) {
  Invoke-WebRequest -UseBasicParsing -Uri "$releaseBaseUrl/caddy_${version}_checksums.txt" -OutFile $checksumsPath
}

$checksumLine = Get-Content $checksumsPath |
  Where-Object { $_ -match "\s+$([regex]::Escape($archiveName))$" } |
  Select-Object -First 1
if (-not $checksumLine) {
  throw "Checksum entry was not found for $archiveName."
}

$expectedHash = ($checksumLine -split '\s+')[0].ToLowerInvariant()
$actualHash = (Get-FileHash -Algorithm SHA512 -Path $archivePath).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) {
  throw 'Caddy archive checksum verification failed.'
}

$extractDirectory = Join-Path $downloadDirectory 'extracted'
if (Test-Path $extractDirectory) {
  Remove-Item -Path $extractDirectory -Recurse -Force
}
Expand-Archive -Path $archivePath -DestinationPath $extractDirectory
Copy-Item -Path (Join-Path $extractDirectory 'caddy.exe') -Destination (Join-Path $rootDirectory 'caddy.exe')
Copy-Item -Path 'C:\Kade\Caddyfile.local' -Destination (Join-Path $rootDirectory 'Caddyfile')

& (Join-Path $rootDirectory 'caddy.exe') validate `
  --config (Join-Path $rootDirectory 'Caddyfile') `
  --adapter caddyfile

$binaryPath = '"C:\Caddy\caddy.exe" run --config "C:\Caddy\Caddyfile" --adapter caddyfile'
& sc.exe create caddy start= auto binPath= $binaryPath | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Creating the caddy service failed with exit code $LASTEXITCODE."
}

Start-Service -Name 'caddy'
Start-Sleep -Seconds 3

$healthCode = & curl.exe -sS -o NUL -w '%{http_code}' `
  http://127.0.0.1:8080/kadexai/api/health
[pscustomobject]@{
  Version = (& (Join-Path $rootDirectory 'caddy.exe') version)
  Service = (Get-Service -Name 'caddy').Status
  LocalProxyHealth = $healthCode
}
