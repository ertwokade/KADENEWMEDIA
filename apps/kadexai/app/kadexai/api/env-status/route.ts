import { getAuthenticatedUser } from '@/lib/auth/server'
import { isSettingsOwnerUser } from '@/lib/featureAccess'
import { getVercelGatewayToken, VERCEL_GATEWAY_STATUS_KEY } from '@/lib/ai/gatewayAuth'
import { whatsappConfiguration } from '@/lib/notifications/whatsappConfig'

const COMMON_ENV_KEYS = [
  'AI_GATEWAY_API_KEY',
  'GROQ_API_KEY',
  'CEREBRAS_API_KEY',
  'OPENROUTER_API_KEY',
  'MISTRAL_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'YOUTUBE_API_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'TOKEN_ENCRYPTION_KEY',
  'TIKTOK_COOKIE',
  'INSTAGRAM_SESSION_ID',
  'KADE_FASTAPI_BASE_URL',
  'KADE_BACKEND_TOKEN',
] as const

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 })
  if (!isSettingsOwnerUser(user)) {
    return Response.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
  }

  const status = Object.fromEntries(
    COMMON_ENV_KEYS.map((key) => [key, Boolean(process.env[key]?.trim())])
  )
  status[VERCEL_GATEWAY_STATUS_KEY] = Boolean(await getVercelGatewayToken(request))
  // Değer DEĞİL, yalnızca yapılandırılmış olup olmadığı. Bildirim gitmediğinde
  // sebebini dışarıdan görebilmek için.
  status.WHATSAPP = whatsappConfiguration().configured

  return Response.json(status, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
