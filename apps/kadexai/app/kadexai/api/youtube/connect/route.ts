import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { requireApiUser } from '@/lib/auth/server'
import { buildAuthUrl, OAUTH_STATE_COOKIE, youtubeOAuthConfigured, youtubeOAuthStatus } from '@/lib/youtube/oauth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireApiUser()
  if (guard) return guard

  if (!youtubeOAuthConfigured()) {
    const status = youtubeOAuthStatus()
    return NextResponse.json(
      {
        error: !status.clientConfigured
          ? 'YouTube hesabı bağlamak için yönetici ayarı gerekli: Google bağlantısı kurulmamış.'
          : 'YouTube hesabı bağlamak için yönetici ayarı gerekli: güvenli belirteç saklama kapalı.',
      },
      { status: 503 }
    )
  }

  // CSRF: state degeri httpOnly cerezde tutulur, geri donuste karsilastirilir.
  const state = randomBytes(24).toString('hex')
  const store = await cookies()
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })

  return NextResponse.json({ url: buildAuthUrl(state) })
}
