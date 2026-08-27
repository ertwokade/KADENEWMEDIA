import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  canAccessFeature,
  isAllowedOwnerUser,
  isOwnerMode,
  isAdminOnlyRoute,
  isOwnerOnlyRoute,
  isSettingsOwnerUser,
  isSettingsOwnerOnlyRoute,
} from '@/lib/featureAccess'
import { stripBasePath, withBasePath } from '@/lib/appConfig'
import {
  countedDistributedRateLimit,
  distributedRateLimit,
  getRateLimitKey,
  rateLimit,
  rateLimitHeaders,
  type DistributedRateLimitResult,
} from '@/lib/rateLimit'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

function nextResponseFor(request: NextRequest) {
  // Vercel'in kısa ömürlü OIDC başlığı dahil olmak üzere gelen sunucu
  // başlıklarını Route Handler'a açıkça aktar. NextResponse'e doğrudan
  // NextRequest vermek, özel başlıkların ara katmanda kaybolmasına yol açar.
  const requestHeaders = new Headers(request.headers)
  return NextResponse.next({ request: { headers: requestHeaders } })
}

function allowedMutationOrigins(request: NextRequest) {
  const allowed = new Set<string>([request.nextUrl.origin])

  try {
    allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL || '').origin)
  } catch {}

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')?.trim()
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
    || request.nextUrl.protocol.replace(':', '')
  if (forwardedHost && (forwardedProto === 'http' || forwardedProto === 'https')) {
    try {
      const forwardedOrigin = new URL(`${forwardedProto}://${forwardedHost}`)
      const loopback = ['127.0.0.1', 'localhost', '::1'].includes(forwardedOrigin.hostname)
      const configuredVercelHost = process.env.VERCEL_URL?.toLocaleLowerCase('en-US')
      const knownPreview = Boolean(configuredVercelHost && forwardedOrigin.hostname.toLocaleLowerCase('en-US') === configuredVercelHost)
      if (loopback || knownPreview || allowed.has(forwardedOrigin.origin)) {
        allowed.add(forwardedOrigin.origin)
      }
    } catch {}
  }

  return allowed
}

function loginRedirectFor(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = withBasePath('/login')
  url.search = ''
  const selectedTrend = ['/dashboard/trend-radar', '/dashboard/kade-search'].includes(pathname)
    ? request.nextUrl.searchParams.get('trend')?.trim().slice(0, 200)
    : null
  if (selectedTrend) {
    url.searchParams.set('next', `${pathname}?trend=${encodeURIComponent(selectedTrend)}`)
  }
  return url
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = nextResponseFor(request)
  const pathname = stripBasePath(request.nextUrl.pathname)
  const isApi = pathname.startsWith('/api/')
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/onboarding'
  const isOperationsKit = pathname.startsWith('/operations-kit')
  // Operasyon uygulamasının HTML kabuğu ve API'leri oturumla korunur. Kabuğun
  // çalışması için gereken aynı-origin statik dosyalar ise script/style isteği
  // sırasında oturum yenilemesine bağımlı olmamalı; aksi halde JS yerine giriş
  // HTML'i dönüyor ve iframe yalnızca statik iskelette kalıyor.
  const isOperationsKitAsset = isOperationsKit && /\.(?:css|js|png|svg|webp|woff2?)$/i.test(pathname)
  const isOwnerRoute = isOwnerOnlyRoute(pathname)
  const isSettingsOwnerRoute = isSettingsOwnerOnlyRoute(pathname)
  const isAdminRoute = isAdminOnlyRoute(pathname)
  const isPublicApi = pathname === '/api/health' || pathname === '/api/auth/password' || pathname === '/api/auth/recovery' || pathname === '/api/auth/recovery-session' || pathname === '/api/payments/webhook' || pathname === '/api/legal'
  const protectedApi = isApi && !isPublicApi
  const requiresAuth = isDashboard || (isOperationsKit && !isOperationsKitAsset) || isOwnerRoute || isSettingsOwnerRoute || isAdminRoute || protectedApi
  const isAiApi = pathname === '/api/assistant' || pathname === '/api/image' || pathname === '/api/transcribe' || pathname === '/api/youtube/comments' || pathname.startsWith('/api/generate/')
  const isCronApi = [
    '/api/materials/sync',
    '/api/kade-search/collect',
    '/api/kade-search/daily-digest',
    '/api/kade-search/weekly-digest',
    '/api/reports/weekly-site',
    '/api/operations-report',
  ].includes(pathname)
  const cronSecret = process.env.CRON_SECRET?.trim()
  const hasCronAccess = Boolean(
    isCronApi
    && cronSecret
    && (
      request.headers.get('x-cron-secret')?.trim() === cronSecret
      || request.headers.get('authorization')?.trim() === `Bearer ${cronSecret}`
    )
  )

  if (isApi && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && !allowedMutationOrigins(request).has(origin)) {
      return NextResponse.json({ error: 'Geçersiz istek kaynağı.' }, { status: 403 })
    }

    const contentLength = Number(request.headers.get('content-length') || 0)
    const maxBytes = pathname === '/api/transcribe'
      ? 26 * 1024 * 1024
      : isAiApi
        ? 64 * 1024
        : 2 * 1024 * 1024
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return NextResponse.json({ error: 'İstek gövdesi izin verilen sınırı aşıyor.' }, { status: 413 })
    }
  }
  const withOperationsSecurityHeaders = (response: NextResponse) => {
    if (!isOperationsKit) return response

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'same-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self'; font-src 'self'"
    )
    return response
  }

  if (!canAccessFeature(pathname, isOwnerMode())) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu özellik bu sürümde kullanılamıyor.' }, { status: 404 })
    }

    const url = request.nextUrl.clone()
    url.pathname = withBasePath('/dashboard')
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Vercel Cron isteklerinin Supabase oturumu yoktur. Zamanlanmış KadeAI uçları,
  // doğru CRON_SECRET taşıdığında proxy'den geçebilir; handler'lar
  // aynı anahtarı yeniden doğrulayarak ikinci savunma hattını korur.
  if (hasCronAccess) {
    return withOperationsSecurityHeaders(supabaseResponse)
  }

  if (process.env.NODE_ENV !== 'production' && process.env.KADE_DISABLE_AUTH === '1' && requiresAuth) {
    if (isAiApi) {
      const limit = rateLimit(getRateLimitKey(request, 'ai-dev'), 20, 60_000)
      if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek. Lütfen kısa süre sonra tekrar deneyin.' }, { status: 429, headers: rateLimitHeaders(limit) })
    }
    return withOperationsSecurityHeaders(supabaseResponse)
  }

  // Protected routes fail closed when the auth provider is missing.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (requiresAuth) {
      if (isApi) {
        return NextResponse.json({ error: 'Kimlik doğrulama yapılandırılmamış.' }, { status: 503 })
      }
      return NextResponse.redirect(loginRedirectFor(request, pathname))
    }
    return withOperationsSecurityHeaders(supabaseResponse)
  }

  // These handlers validate their own input and enforce their own limits. They
  // must stay usable before a session exists and do not need an auth round-trip.
  if (isPublicApi) {
    return withOperationsSecurityHeaders(supabaseResponse)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = nextResponseFor(request)
          toSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null

  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  if (requiresAuth && !user && !isAuthPage) {
    if (isApi) {
      return NextResponse.json({ error: 'Oturum açman gerekiyor.' }, { status: 401 })
    }
    return NextResponse.redirect(loginRedirectFor(request, pathname))
  }

  // Platform yönetimi uçları: handler ile aynı kural (owner e-postası veya
  // kade_admin). İkinci savunma hattı; handler kendi kontrolünü de yapar.
  if (isAdminRoute && !isAllowedOwnerUser(user) && !isSettingsOwnerUser(user)) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = withBasePath('/dashboard')
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isSettingsOwnerRoute && !isSettingsOwnerUser(user)) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = withBasePath('/dashboard')
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isOwnerRoute && isOwnerMode() && !isAllowedOwnerUser(user)) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = withBasePath('/dashboard')
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isAiApi && user) {
    const idempotencyKey = request.headers.get('idempotency-key')?.trim().slice(0, 200) || undefined
    const quotaOptions = {
      identity: user.id,
      minuteLimit: 30,
      dailyLimit: 500,
      cost: pathname === '/api/image' || pathname === '/api/transcribe' ? 5 : 1,
      idempotencyKey,
    }
    let limit = await distributedRateLimit('ai-user', quotaOptions)

    // Upstash bağlı değilse mevcut Supabase geçmişi dağıtık ve kullanıcıya özel
    // bir sayaç olarak kullanılır. Böylece üretim tamamen kapanmaz; RLS her
    // kullanıcının yalnızca kendi isteklerini saydırmasına izin verir.
    if (!limit.allowed && limit.reason === 'backend_unavailable') {
      const now = Date.now()
      const minuteSince = new Date(now - 60_000).toISOString()
      const daySince = new Date(now - 86_400_000).toISOString()
      let historyLimit: DistributedRateLimitResult | null = null

      for (const table of ['tool_runs', 'content_history'] as const) {
        const [minuteResult, dailyResult] = await Promise.all([
          supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', minuteSince),
          supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', daySince),
        ])
        if (!minuteResult.error && !dailyResult.error) {
          historyLimit = countedDistributedRateLimit(
            quotaOptions,
            minuteResult.count ?? 0,
            dailyResult.count ?? 0
          )
          break
        }
      }

      if (historyLimit) limit = historyLimit
    }

    if (!limit.allowed) {
      const message = limit.reason === 'duplicate'
        ? 'Bu istek daha önce işlendi.'
        : limit.reason === 'backend_unavailable'
          ? 'Kota servisi geçici olarak kullanılamıyor.'
          : 'Kullanıcı kotası aşıldı. Lütfen kısa süre sonra tekrar deneyin.'
      return NextResponse.json(
        { error: message },
        { status: limit.status, headers: rateLimitHeaders(limit) }
      )
    }
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = withBasePath('/dashboard')
    return NextResponse.redirect(url)
  }

  return withOperationsSecurityHeaders(supabaseResponse)
}

export const config = {
  /* Ana sitenin Pages Router backend'i `/api/*` altında kendi JWT + CSRF
     güvenliğini uygular. KadeAI proxy'si bu rotalara girerse onları Supabase
     oturumu isteyen KadeAI endpoint'leri sanıp daha handler'a ulaşmadan 401
     döndürür. Yalnız kök API önekini dışarıda bırak; `/kadeai/api/*` bu negatif
     eşleşmeye takılmaz ve KadeAI korumalarından geçmeye devam eder. */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
