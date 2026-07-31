import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appRoutes, withBasePath } from '@/lib/appConfig'
import { signInWithAdminCredentials } from '@/lib/auth/adminBridge'
import { isLoginIdentifier } from '@/lib/auth/adminIdentity'
import { getSignupPasswordError, mapSignupProviderError } from '@/lib/auth/passwordPolicy'
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
  const identifier = String(body.identifier || body.email || '').trim()
  const email = identifier.toLocaleLowerCase('en-US')
  const password = String(body.password || '')
  const displayName = String(body.displayName || '').trim().slice(0, 120)
  const limit = rateLimit(getRateLimitKey(request, `auth-${action}`, identifier.toLocaleLowerCase('en-US')), 5, 10 * 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }

  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' }, { status: 429, headers })
  }
  if (action === 'signup' && (!EMAIL_PATTERN.test(email) || email.length > 254)) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400, headers })
  }
  if (action === 'login' && !isLoginIdentifier(identifier)) {
    return NextResponse.json({ error: 'Geçerli bir admin kullanıcı adı veya e-posta girin.' }, { status: 400, headers })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Parola 8–128 karakter arasında olmalıdır.' }, { status: 400, headers })
  }
  if (action === 'signup') {
    const passwordError = getSignupPasswordError(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400, headers })
    }
  }
  if (!configured()) {
    return NextResponse.json({ error: 'Kimlik doğrulama hizmeti kullanılamıyor.' }, { status: 503, headers })
  }

  try {
    const supabase = await createClient()
    if (action === 'login') {
      const adminResult = await signInWithAdminCredentials(identifier, password)
      if (adminResult.ok) {
        return NextResponse.json({
          ok: true,
          next: appRoutes.dashboard,
          accountType: 'admin',
        }, { headers })
      }

      if (!EMAIL_PATTERN.test(email)) {
        return NextResponse.json({
          error: adminResult.reason === 'not_admin'
            ? 'Bu yönetim hesabında admin yetkisi yok.'
            : 'Kullanıcı adı veya parola hatalı.',
        }, { status: 401, headers })
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Gerçek red sebebini sunucu loguna yaz — Vercel loglarından
        // (veya Supabase Dashboard → Authentication → Logs) teşhis için.
        // Yanıtta hassas ayrımı (hesap var/yok) ASLA sızdırma: Supabase
        // `invalid_credentials`'ı yanlış-şifre ile hesap-yok için kasten
        // aynı döndürür (account enumeration önlemi) — bunu koruyoruz.
        console.error('[kadeai/login] signIn reddedildi:', {
          code: (error as { code?: string }).code,
          status: error.status,
          message: error.message,
        })
        // `email_not_confirmed` güvenli şekilde ayırt edilebilir ve en sık
        // "doğru şifre ama yine giremiyorum" nedenidir — kullanıcıya yardımcı ol.
        const code = (error as { code?: string }).code
        if (code === 'email_not_confirmed' || /email not confirmed/i.test(error.message)) {
          return NextResponse.json({
            error: 'E-posta adresiniz henüz doğrulanmamış. Kayıt sırasında gönderilen doğrulama bağlantısına tıklayın veya kayıt ekranından tekrar deneyin.',
          }, { status: 401, headers })
        }
        return NextResponse.json({
          error: 'Kullanıcı adı/e-posta veya parola hatalı. Admin panelindeki hesabını ya da mevcut KadeAI hesabını kullanabilirsin.',
        }, { status: 401, headers })
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
      console.error('[kadeai/signup] kayıt reddedildi:', {
        code: (error as { code?: string }).code,
        status: error.status,
        message: error.message,
      })
      const mapped = mapSignupProviderError(error)
      return NextResponse.json({ error: mapped.message }, { status: mapped.status, headers })
    }
    if (!data.user) {
      return NextResponse.json({
        error: 'Hesap oluşturma işlemi doğrulanamadı. Lütfen kısa süre sonra tekrar deneyin.',
      }, { status: 503, headers })
    }

    return NextResponse.json({
      ok: true,
      next: data.session ? appRoutes.onboarding : null,
      message: data.session
        ? 'Hesabın oluşturuldu.'
        : 'Kayıt talebini aldık. Doğrulama bağlantısı için e-postanı kontrol et; mevcut hesabın varsa Giriş Yap sekmesini kullan.',
    }, { status: data.session ? 200 : 202, headers })
  } catch {
    return NextResponse.json({ error: 'Kimlik doğrulama hizmetine ulaşılamıyor.' }, { status: 503, headers })
  }
}
