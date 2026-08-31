param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z]{20}$')]
  [string]$ProjectRef,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^https://')]
  [string]$SiteUrl,

  [Parameter(Mandatory = $true)]
  [string[]]$RedirectUrls
)

$ErrorActionPreference = 'Stop'

if (-not ('KadeSupabaseCredentialReader' -as [type])) {
  Add-Type @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;
public static class KadeSupabaseCredentialReader {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct CREDENTIAL {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob; public uint Persist;
    public uint AttributeCount; public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
  private static extern bool CredRead(string target, uint type, int reserved, out IntPtr credentialPtr);
  [DllImport("advapi32.dll", SetLastError = true)]
  private static extern void CredFree(IntPtr buffer);
  public static string ReadGeneric(string target) {
    IntPtr ptr;
    if (!CredRead(target, 1, 0, out ptr)) throw new Win32Exception(Marshal.GetLastWin32Error());
    try {
      var credential = Marshal.PtrToStructure<CREDENTIAL>(ptr);
      var bytes = new byte[credential.CredentialBlobSize];
      Marshal.Copy(credential.CredentialBlob, bytes, 0, bytes.Length);
      var unicode = Encoding.Unicode.GetString(bytes).TrimEnd('\0');
      return unicode.StartsWith("sbp_") ? unicode : Encoding.UTF8.GetString(bytes).TrimEnd('\0');
    } finally { CredFree(ptr); }
  }
}
'@
}

$accessToken = if ($env:SUPABASE_ACCESS_TOKEN) {
  $env:SUPABASE_ACCESS_TOKEN
} else {
  [KadeSupabaseCredentialReader]::ReadGeneric('Supabase CLI:supabase')
}
if (-not $accessToken.StartsWith('sbp_')) { throw 'Supabase Management API token could not be loaded.' }

$endpoint = "https://api.supabase.com/v1/projects/$ProjectRef/config/auth"
$headers = @{ Authorization = "Bearer $accessToken" }
$before = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$allowList = ($RedirectUrls | ForEach-Object { ([uri]$_).AbsoluteUri.TrimEnd('/') } | Sort-Object -Unique) -join ','
$body = @{ site_url = $SiteUrl.TrimEnd('/'); uri_allow_list = $allowList } | ConvertTo-Json -Compress

Invoke-RestMethod -Method Patch -Uri $endpoint -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
$after = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $headers
$accessToken = $null
$headers = $null

[pscustomobject]@{
  PreviousSiteUrl = $before.site_url
  CurrentSiteUrl = $after.site_url
  CurrentRedirectAllowList = $after.uri_allow_list
  SiteUrlMatches = ($after.site_url -eq $SiteUrl.TrimEnd('/'))
  RedirectAllowListMatches = ($after.uri_allow_list -eq $allowList)
}
