param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z]{20}$')]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$baseUrl = "https://$ProjectRef.supabase.co"
$createdUserIds = [System.Collections.Generic.List[string]]::new()
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-JsonRequest {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][hashtable]$Headers,
    [object]$Body
  )

  $parameters = @{
    Method = $Method
    Uri = $Uri
    Headers = $Headers
    UseBasicParsing = $true
  }
  if ($null -ne $Body) {
    $parameters.ContentType = 'application/json'
    $parameters.Body = $Body | ConvertTo-Json -Depth 10 -Compress
  }

  try {
    $response = Invoke-WebRequest @parameters
    $json = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $json; Content = $response.Content }
  }
  catch {
    if (-not $_.Exception.Response) { throw }
    $response = $_.Exception.Response
    $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
    try { $content = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $json = try { $content | ConvertFrom-Json } catch { $null }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $json; Content = $content }
  }
}

function Add-Result {
  param([string]$Name, [bool]$Passed, [int]$Status, [string]$Detail)
  $results.Add([pscustomobject]@{ Test = $Name; Passed = $Passed; Status = $Status; Detail = $Detail })
}

$keyDocument = (& npx.cmd --yes supabase@latest projects api-keys --project-ref $ProjectRef) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Supabase API keys could not be obtained.' }
$anonKey = ($keyDocument.keys | Where-Object name -eq 'anon' | Select-Object -First 1).api_key
$serviceKey = ($keyDocument.keys | Where-Object name -eq 'service_role' | Select-Object -First 1).api_key
if (-not $anonKey -or -not $serviceKey) { throw 'Required staging API key types are unavailable.' }

$adminHeaders = @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$password = "Kade!$([guid]::NewGuid().ToString('N'))aA1"
$emailA = "kade-e2e-a-$stamp@example.test"
$emailB = "kade-e2e-b-$stamp@example.test"

try {
  $createA = Invoke-JsonRequest POST "$baseUrl/auth/v1/admin/users" $adminHeaders @{
    email = $emailA; password = $password; email_confirm = $true; user_metadata = @{ name = 'KADE E2E A' }
  }
  $createB = Invoke-JsonRequest POST "$baseUrl/auth/v1/admin/users" $adminHeaders @{
    email = $emailB; password = $password; email_confirm = $true; user_metadata = @{ name = 'KADE E2E B' }
  }
  Add-Result 'Create user A' ($createA.Status -eq 200) $createA.Status 'admin user creation'
  Add-Result 'Create user B' ($createB.Status -eq 200) $createB.Status 'admin user creation'
  if ($createA.Json.id) { $createdUserIds.Add([string]$createA.Json.id) }
  if ($createB.Json.id) { $createdUserIds.Add([string]$createB.Json.id) }
  if ($createdUserIds.Count -ne 2) { throw 'Both staging users were not created.' }

  $authHeaders = @{ apikey = $anonKey }
  $loginA = Invoke-JsonRequest POST "$baseUrl/auth/v1/token?grant_type=password" $authHeaders @{ email = $emailA; password = $password }
  $loginB = Invoke-JsonRequest POST "$baseUrl/auth/v1/token?grant_type=password" $authHeaders @{ email = $emailB; password = $password }
  Add-Result 'Password login A' ($loginA.Status -eq 200 -and [bool]$loginA.Json.access_token) $loginA.Status 'real Supabase password grant'
  Add-Result 'Password login B' ($loginB.Status -eq 200 -and [bool]$loginB.Json.access_token) $loginB.Status 'real Supabase password grant'
  if (-not $loginA.Json.access_token -or -not $loginB.Json.access_token) { throw 'Password login failed.' }

  $userA = [string]$loginA.Json.user.id
  $userB = [string]$loginB.Json.user.id
  $headersA = @{ apikey = $anonKey; Authorization = "Bearer $($loginA.Json.access_token)"; Prefer = 'return=representation' }
  $headersB = @{ apikey = $anonKey; Authorization = "Bearer $($loginB.Json.access_token)"; Prefer = 'return=representation' }

  $profileA = Invoke-JsonRequest GET "$baseUrl/rest/v1/profiles?user_id=eq.$userA&select=user_id,display_name" $headersA $null
  Add-Result 'A selects own profile' ($profileA.Status -eq 200 -and @($profileA.Json).Count -eq 1) $profileA.Status 'one row visible'

  $profileLeak = Invoke-JsonRequest GET "$baseUrl/rest/v1/profiles?user_id=eq.$userA&select=user_id" $headersB $null
  Add-Result 'B cannot select A profile' ($profileLeak.Status -eq 200 -and @($profileLeak.Json).Count -eq 0) $profileLeak.Status 'zero rows visible'

  $profileUpdateA = Invoke-JsonRequest PATCH "$baseUrl/rest/v1/profiles?user_id=eq.$userA" $headersA @{ display_name = 'KADE RLS A Updated' }
  Add-Result 'A updates own profile' ($profileUpdateA.Status -eq 200 -and @($profileUpdateA.Json).Count -eq 1) $profileUpdateA.Status 'one row updated'

  $profileUpdateB = Invoke-JsonRequest PATCH "$baseUrl/rest/v1/profiles?user_id=eq.$userA" $headersB @{ display_name = 'ILLEGAL B UPDATE' }
  Add-Result 'B cannot update A profile' ($profileUpdateB.Status -eq 200 -and @($profileUpdateB.Json).Count -eq 0) $profileUpdateB.Status 'zero rows updated'

  $historyInsertA = Invoke-JsonRequest POST "$baseUrl/rest/v1/content_history" $headersA @{
    user_id = $userA; tool = 'rls-e2e'; model = 'test'; input_data = @{ source = 'staging' }; output = 'owned-by-a'
  }
  $historyRows = @($historyInsertA.Json)
  $historyId = if ($historyRows.Count -gt 0) { [string]$historyRows[0].id } else { '' }
  Add-Result 'A inserts own content row' ($historyInsertA.Status -eq 201 -and [bool]$historyId) $historyInsertA.Status 'one row inserted'

  $historyLeak = Invoke-JsonRequest GET "$baseUrl/rest/v1/content_history?id=eq.$historyId&select=id,user_id,output" $headersB $null
  Add-Result 'B cannot select A content row' ($historyLeak.Status -eq 200 -and @($historyLeak.Json).Count -eq 0) $historyLeak.Status 'zero rows visible'

  $illegalInsert = Invoke-JsonRequest POST "$baseUrl/rest/v1/content_history" $headersB @{
    user_id = $userA; tool = 'rls-e2e'; model = 'test'; output = 'illegal-b-insert'
  }
  Add-Result 'B cannot insert for A' ($illegalInsert.Status -eq 403) $illegalInsert.Status 'RLS rejected cross-user insert'

  $illegalDelete = Invoke-JsonRequest DELETE "$baseUrl/rest/v1/content_history?id=eq.$historyId" $headersB $null
  Add-Result 'B cannot delete A content row' ($illegalDelete.Status -eq 200 -and @($illegalDelete.Json).Count -eq 0) $illegalDelete.Status 'zero rows deleted'

  $historyStillThere = Invoke-JsonRequest GET "$baseUrl/rest/v1/content_history?id=eq.$historyId&select=id,output" $headersA $null
  Add-Result 'A row survives B attempts' ($historyStillThere.Status -eq 200 -and @($historyStillThere.Json).Count -eq 1 -and $historyStillThere.Json[0].output -eq 'owned-by-a') $historyStillThere.Status 'owned row unchanged'

  $historyDeleteA = Invoke-JsonRequest DELETE "$baseUrl/rest/v1/content_history?id=eq.$historyId" $headersA $null
  Add-Result 'A deletes own content row' ($historyDeleteA.Status -eq 200 -and @($historyDeleteA.Json).Count -eq 1) $historyDeleteA.Status 'one row deleted'

  $stateInsertA = Invoke-JsonRequest POST "$baseUrl/rest/v1/operations_state" $headersA @{ user_id = $userA; state = @{ step = 'created' } }
  Add-Result 'A inserts own state' ($stateInsertA.Status -eq 201 -and @($stateInsertA.Json).Count -eq 1) $stateInsertA.Status 'one state row inserted'

  $stateUpdateA = Invoke-JsonRequest PATCH "$baseUrl/rest/v1/operations_state?user_id=eq.$userA" $headersA @{ state = @{ step = 'updated' } }
  Add-Result 'A updates own state' ($stateUpdateA.Status -eq 200 -and @($stateUpdateA.Json).Count -eq 1) $stateUpdateA.Status 'one state row updated'

  $stateLeak = Invoke-JsonRequest GET "$baseUrl/rest/v1/operations_state?user_id=eq.$userA&select=user_id,state" $headersB $null
  Add-Result 'B cannot select A state' ($stateLeak.Status -eq 200 -and @($stateLeak.Json).Count -eq 0) $stateLeak.Status 'zero rows visible'

  $logoutA = Invoke-JsonRequest POST "$baseUrl/auth/v1/logout" $headersA $null
  Add-Result 'Supabase logout A' ($logoutA.Status -eq 204) $logoutA.Status 'refresh session revoked'
}
finally {
  foreach ($userId in $createdUserIds) {
    $cleanup = Invoke-JsonRequest DELETE "$baseUrl/auth/v1/admin/users/$userId" $adminHeaders $null
    Add-Result 'Cleanup temporary user' ($cleanup.Status -eq 200) $cleanup.Status 'temporary staging user deleted'
  }
}

$results | Format-Table -AutoSize
$failed = @($results | Where-Object Passed -eq $false)
if ($failed.Count -gt 0) {
  throw "$($failed.Count) Supabase staging checks failed."
}

Write-Output "Supabase staging checks passed: $($results.Count)/$($results.Count)."
