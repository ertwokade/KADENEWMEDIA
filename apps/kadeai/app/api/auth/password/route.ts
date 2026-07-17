import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appRoutes, withBasePath } from '@/lib/appConfig'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function trustedOrigin(request: NextRequest) {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).origin
  } catch {
    return request.nextUrl.origin
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const action = body.action === 'signup' ? 'signup' : 'login'
  const email = String(body.email || '').trim().toLocaleLowerCase('en-US')
  const password = String(body.password || '')
  const displayName = String(body.displayName || '').trim().slice(0, 120)
  const limit = rateLimit(getRateLimitKey(request, `auth-${action}`, email), 5, 10 * 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' }, { status: 429, headers })
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400, headers })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Parola 8–128 karakter arasında olmalıdır.' }, { status: 400, headers })
  }
  if (!configured()) {
    return NextResponse.json({ error: 'Kimlik doğrulama hizmeti kullanılamıyor.' }, { status: 503, headers })
  }

  try {
    const supabase = await createClient()
    if (action === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        return NextResponse.json({ error: 'E-posta veya parola hatalı.' }, { status: 401, headers })
      }
      return NextResponse.json({ ok: true, next: appRoutes.dashboard }, { headers })
    }

    const callback = `${appRoutes.authCallback}?next=${encodeURIComponent(appRoutes.onboarding)}`
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
        emailRedirectTo: new URL(withBasePath(callback), trustedOrigin(request)).toString(),
      },
    })
    if (error) {
      return NextResponse.json({ error: 'Kayıt işlemi tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.' }, { status: 400, headers })
    }

    return NextResponse.json({
      ok: true,
      next: data.session ? appRoutes.onboarding : null,
      message: 'İşlem tamamlandı. Doğrulama gerekiyorsa e-postanızı kontrol edin.',
    }, { status: data.session ? 200 : 202, headers })
  } catch {
    return NextResponse.json({ error: 'Kimlik doğrulama hizmetine ulaşılamıyor.' }, { status: 503, headers })
  }
}
