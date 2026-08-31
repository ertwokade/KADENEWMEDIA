import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withBasePath } from '@/lib/appConfig'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

const GENERIC_MESSAGE = 'Hesap uygunsa parola yenileme bağlantısı e-posta adresine gönderildi.'

export async function POST(request: NextRequest) {
  let email = ''
  try {
    const body = await request.json()
    email = String(body.email || '').trim().toLocaleLowerCase('en-US')
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const limit = rateLimit(getRateLimitKey(request, 'auth-recovery', email), 3, 15 * 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' }, { status: 429, headers })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400, headers })
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Kimlik doğrulama hizmeti kullanılamıyor.' }, { status: 503, headers })
  }

  try {
    const supabase = await createClient()
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const callback = `/auth/callback?next=${encodeURIComponent('/reset-password?recovery=1')}`
    const redirectTo = new URL(withBasePath(callback), configuredUrl).toString()
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { headers })
  } catch {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { headers })
  }
}
