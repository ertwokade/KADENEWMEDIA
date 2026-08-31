import 'server-only'

/**
 * YouTube OAuth 2.0 baglantisi.
 *
 * Altyaziyi videoya yuklemek (captions.insert) API anahtariyla yapilamaz;
 * kanal sahibinin izni gerekir. Bu yuzden Google OAuth akisi kullanilir ve
 * yenileme belirteci `integrations` tablosunda SIFRELI saklanir
 * (encrypted_secret, AES-256-GCM). Erisim belirteci hic saklanmaz; her
 * istekte yenileme belirtecinden uretilir.
 */
import { createClient } from '@/lib/supabase/server'
import { decryptSecret, encryptSecret, hasTokenEncryptionKey } from '@/lib/security/tokenCrypto'
import { resolveWorkspaceId } from '@/lib/workspace'
import { PUBLIC_APP_URL } from '@/lib/appConfig'

// force-ssl: altyazi okuma + yazma + kanal videolarini listeleme icin yeterli.
export const YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
export const OAUTH_STATE_COOKIE = 'kade_yt_oauth_state'

const PROVIDER = 'youtube'

export interface YouTubeChannel {
  id: string
  title: string
  thumbnail: string | null
}

export function youtubeClientId() {
  return process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() || ''
}

function youtubeClientSecret() {
  return process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() || ''
}

export function youtubeRedirectUri() {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (explicit) return explicit
  return `${PUBLIC_APP_URL.replace(/\/$/, '')}/api/youtube/callback`
}

export function youtubeOAuthStatus() {
  return {
    clientConfigured: Boolean(youtubeClientId() && youtubeClientSecret()),
    encryptionConfigured: hasTokenEncryptionKey(),
    redirectUri: youtubeRedirectUri(),
  }
}

export function youtubeOAuthConfigured() {
  const status = youtubeOAuthStatus()
  return status.clientConfigured && status.encryptionConfigured
}

export function buildAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: youtubeClientId(),
    redirect_uri: youtubeRedirectUri(),
    response_type: 'code',
    scope: YOUTUBE_SCOPES.join(' '),
    access_type: 'offline',
    // Yenileme belirteci yalnizca ilk onayda doner; "consent" her seferinde almayi garanti eder.
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const json = (await res.json()) as TokenResponse
  if (!res.ok || json.error) {
    throw new Error(json.error_description || json.error || 'Google belirteç isteği başarısız.')
  }
  return json
}

export async function exchangeCode(code: string) {
  return tokenRequest({
    code,
    client_id: youtubeClientId(),
    client_secret: youtubeClientSecret(),
    redirect_uri: youtubeRedirectUri(),
    grant_type: 'authorization_code',
  })
}

export async function refreshAccessToken(refreshToken: string) {
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: youtubeClientId(),
    client_secret: youtubeClientSecret(),
    grant_type: 'refresh_token',
  })
}

/** Baglanan kanalin kimlik bilgileri (kullaniciya "hangi kanal bagli" demek icin). */
export async function fetchChannel(accessToken: string): Promise<YouTubeChannel | null> {
  const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) return null
  const json = (await res.json()) as {
    items?: Array<{ id: string; snippet?: { title?: string; thumbnails?: { default?: { url?: string } } } }>
  }
  const item = json.items?.[0]
  if (!item) return null
  return {
    id: item.id,
    title: item.snippet?.title ?? 'YouTube kanalı',
    thumbnail: item.snippet?.thumbnails?.default?.url ?? null,
  }
}

export async function saveConnection(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  refreshToken: string,
  channel: YouTubeChannel | null
) {
  const supabase = await createClient()
  const workspaceId = await resolveWorkspaceId(supabase, user)
  const encrypted = encryptSecret(refreshToken)

  const { error } = await supabase.from('integrations').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      provider: PROVIDER,
      status: 'connected',
      external_id: channel?.id ?? '',
      account_url: channel?.id ? `https://www.youtube.com/channel/${channel.id}` : '',
      metadata: {
        channelTitle: channel?.title ?? null,
        channelThumbnail: channel?.thumbnail ?? null,
        connectedAt: new Date().toISOString(),
        scopes: YOUTUBE_SCOPES,
      },
      // Supabase JS, bytea kolonuna hex string yazar (\x oneki ile).
      encrypted_secret: `\\x${Buffer.from(encrypted).toString('hex')}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,workspace_id,provider' }
  )
  if (error) throw new Error(error.message)
}

export interface YouTubeConnection {
  connected: boolean
  channel: YouTubeChannel | null
  accessToken?: string
}

/**
 * Kayitli baglantiyi okur ve taze bir erisim belirteci uretir.
 * Yenileme basarisizsa baglanti "error" durumuna cekilir; kullanici tekrar baglanmali.
 */
export async function getConnection(userId: string, opts: { withToken?: boolean } = {}): Promise<YouTubeConnection> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('integrations')
    .select('external_id, status, metadata, encrypted_secret')
    .eq('user_id', userId)
    .eq('provider', PROVIDER)
    .maybeSingle()

  if (!data || data.status !== 'connected' || !data.encrypted_secret) {
    return { connected: false, channel: null }
  }

  const metadata = (data.metadata ?? {}) as { channelTitle?: string; channelThumbnail?: string }
  const channel: YouTubeChannel = {
    id: data.external_id ?? '',
    title: metadata.channelTitle ?? 'YouTube kanalı',
    thumbnail: metadata.channelThumbnail ?? null,
  }

  if (!opts.withToken) return { connected: true, channel }

  try {
    const refreshToken = decryptSecret(data.encrypted_secret as unknown as string)
    const tokens = await refreshAccessToken(refreshToken)
    if (!tokens.access_token) throw new Error('Erişim belirteci alınamadı.')
    return { connected: true, channel, accessToken: tokens.access_token }
  } catch (e) {
    await supabase
      .from('integrations')
      .update({ status: 'error', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', PROVIDER)
    throw new Error(
      `YouTube bağlantısı yenilenemedi, hesabı yeniden bağlaman gerekiyor. (${e instanceof Error ? e.message : 'bilinmeyen hata'})`
    )
  }
}

export async function disconnect(userId: string) {
  const supabase = await createClient()
  await supabase
    .from('integrations')
    .update({ status: 'disconnected', encrypted_secret: null, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', PROVIDER)
}
