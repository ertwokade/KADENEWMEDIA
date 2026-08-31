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
          ? 'GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET tanımlı değil.'
          : 'KADE_TOKEN_ENCRYPTION_KEY tanımlı değil; belirteç şifrelenemeden bağlantı kurulmaz.',
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
