import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'auth-update-password'), 3, 15 * 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla deneme yapıldı.' }, { status: 429, headers })

  let password = ''
  try {
    const body = await request.json()
    password = String(body.password || '')
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400, headers })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Parola 8–128 karakter arasında olmalıdır.' }, { status: 400, headers })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Parola yenileme oturumu geçersiz veya süresi dolmuş.' }, { status: 401, headers })
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: 'Parola güncellenemedi.' }, { status: 400, headers })
    await supabase.auth.signOut({ scope: 'local' })
    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Parola güncellenemedi.' }, { status: 503, headers })
  }
}
