import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  canAccessFeature,
  isAllowedOwnerEmail,
  isAllowedOwnerUser,
  isOwnerMode,
  isAdminOnlyRoute,
  isSettingsOwnerUser,
  isSettingsOwnerOnlyRoute,
} from '@/lib/featureAccess'
import { APP_BASE_PATH, stripBasePath, withBasePath } from '@/lib/appConfig'
import { splitWorkspacePath, workspaceSlugForUser } from '@/lib/workspace/slug'
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
  // Panel her kullanıcı için kendi adresinde açılır: /kadexai/<slug>/dashboard
  // Alan bölümü buradan ayrılır ve geri kalan mantık eskisi gibi çalışır.
  // Bu bir ADRES çözümüdür; yetki kararı aşağıda oturumdan verilir.
  //
  // Ayrıştırma YALNIZCA /kadexai altında yapılır. Ana site aynı origin'in
  // kökünde duruyor (/hizmetler, /paketler, /iletisim …) ve bu yolların ilk
  // parçası da geçerli bir slug biçiminde; kökte ayrıştırınca ana sitenin
  // bütün rotaları çalışma alanı adresi sanılıp panele yeniden yazılıyordu.
  const hamYol = request.nextUrl.pathname
  const kadexaiAltinda =
    !APP_BASE_PATH || hamYol === APP_BASE_PATH || hamYol.startsWith(`${APP_BASE_PATH}/`)
  const { slug: urlSlug, kalan: pathname } = kadexaiAltinda
    ? splitWorkspacePath(stripBasePath(hamYol))
    : { slug: null as string | null, kalan: stripBasePath(hamYol) }
  const isApi = pathname.startsWith('/api/')
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/onboarding'
  const isOperationsKit = pathname.startsWith('/operations-kit')
  // Operasyon uygulamasının HTML kabuğu ve API'leri oturumla korunur. Kabuğun
  // çalışması için gereken aynı-origin statik dosyalar ise script/style isteği
  // sırasında oturum yenilemesine bağımlı olmamalı; aksi halde JS yerine giriş
  // HTML'i dönüyor ve iframe yalnızca statik iskelette kalıyor.
  const isOperationsKitAsset = isOperationsKit && /\.(?:css|js|png|svg|webp|woff2?)$/i.test(pathname)
  const isSettingsOwnerRoute = isSettingsOwnerOnlyRoute(pathname)
  const isAdminRoute = isAdminOnlyRoute(pathname)
  const isPublicApi = pathname === '/api/health' || pathname === '/api/auth/password' || pathname === '/api/auth/recovery' || pathname === '/api/auth/recovery-session' || pathname === '/api/payments/webhook' || pathname === '/api/legal'
  const protectedApi = isApi && !isPublicApi
  const requiresAuth = isDashboard || (isOperationsKit && !isOperationsKitAsset) || isSettingsOwnerRoute || isAdminRoute || protectedApi
  const isAiApi = pathname === '/api/assistant' || pathname === '/api/image' || pathname === '/api/transcribe' || pathname === '/api/youtube/comments' || pathname.startsWith('/api/generate/')
  const isCronApi = [
    '/api/materials/sync',
    '/api/kade-search/collect',
    '/api/kade-search/daily-digest',
    '/api/kade-search/weekly-digest',
    '/api/reports/weekly-site',
    '/api/operations-report',
    '/api/subscriptions/sweep',
    '/api/notifications/daily-summary',
    '/api/notifications/morning-briefing',
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
  /**
   * Yanıtı sonlandırır: adres slug'lı geldiyse Next'in gerçek rotasına iç
   * yönlendirme yapar, ardından operasyon kabuğunun güvenlik başlıklarını
   * ekler. Tek noktada toplanmasının nedeni, aşağıdaki erken çıkışların da
   * (cron, genel API, dev modu) yeniden yazmayı atlamaması.
   *
   * Yalnızca geçiş yanıtı (supabaseResponse) yeniden yazılır; yönlendirme ve
   * JSON hataları olduğu gibi döner.
   */
  const withOperationsSecurityHeaders = (response: NextResponse) => {
    let out = response
    if (urlSlug && response === supabaseResponse) {
      const hedef = request.nextUrl.clone()
      hedef.pathname = withBasePath(pathname)
      out = NextResponse.rewrite(hedef, { request: { headers: new Headers(request.headers) } })
      // Supabase oturumu tazelediyse çerezler yeni yanıta taşınmalı, aksi
      // halde her istekte oturum düşer.
      response.cookies.getAll().forEach((cookie) => out.cookies.set(cookie))
    }

    if (!isOperationsKit) return out
    const response2 = out

    response2.headers.set('X-Content-Type-Options', 'nosniff')
    response2.headers.set('Referrer-Policy', 'same-origin')
    response2.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response2.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self'; font-src 'self'"
    )
    return response2
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

  // Vercel Cron isteklerinin Supabase oturumu yoktur. Zamanlanmış KadexAI uçları,
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

  // Adres doğrulaması. Slug hiçbir zaman yetki vermez: yalnızca kullanıcının
  // KENDİ adresinde olup olmadığına bakılır. Başkasının adresini yazan
  // kullanıcı erişim kazanmaz, kendi alanına gönderilir.
  const kendiSlug = user ? workspaceSlugForUser(user, isAllowedOwnerEmail(user.email)) : null

  if (urlSlug && kendiSlug && urlSlug !== kendiSlug) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu çalışma alanına erişimin yok.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = withBasePath(`/${kendiSlug}${pathname}`)
    return NextResponse.redirect(url)
  }

  // Adressiz gelen panel isteği kullanıcının kendi adresine taşınır; böylece
  // herkesin gezindiği tek bir kanonik adres olur.
  if (!urlSlug && kendiSlug && (isDashboard || isOperationsKit)) {
    const url = request.nextUrl.clone()
    url.pathname = withBasePath(`/${kendiSlug}${pathname}`)
    return NextResponse.redirect(url)
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
     güvenliğini uygular. KadexAI proxy'si bu rotalara girerse onları Supabase
     oturumu isteyen KadexAI endpoint'leri sanıp daha handler'a ulaşmadan 401
     döndürür. Yalnız kök API önekini dışarıda bırak; `/kadexai/api/*` bu negatif
     eşleşmeye takılmaz ve KadexAI korumalarından geçmeye devam eder. */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
