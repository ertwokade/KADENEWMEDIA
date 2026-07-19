import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  canAccessFeature,
  isAllowedOwnerEmail,
  isOwnerMode,
  isOwnerOnlyRoute,
  isSettingsOwnerEmail,
  isSettingsOwnerOnlyRoute,
} from '@/lib/featureAccess'
import { stripBasePath } from '@/lib/appConfig'
import { distributedRateLimit, getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = stripBasePath(request.nextUrl.pathname)
  const isApi = pathname.startsWith('/api/')
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/login'
  const isDashboard = pathname.startsWith('/dashboard') || pathname === '/onboarding'
  const isOperationsKit = pathname.startsWith('/operations-kit')
  const isOwnerRoute = isOwnerOnlyRoute(pathname)
  const isSettingsOwnerRoute = isSettingsOwnerOnlyRoute(pathname)
  const isPublicApi = pathname === '/api/health' || pathname === '/api/auth/password' || pathname === '/api/auth/recovery' || pathname === '/api/auth/recovery-session' || pathname === '/api/payments/webhook'
  const protectedApi = isApi && !isPublicApi
  const requiresAuth = isDashboard || isOperationsKit || isOwnerRoute || isSettingsOwnerRoute || protectedApi
  const isAiApi = pathname === '/api/assistant' || pathname === '/api/image' || pathname === '/api/transcribe' || pathname === '/api/youtube/comments' || pathname.startsWith('/api/generate/')

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
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
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
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = ''
      return NextResponse.redirect(url)
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
          supabaseResponse = NextResponse.next({ request })
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
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isSettingsOwnerRoute && !isSettingsOwnerEmail(user?.email)) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isOwnerRoute && isOwnerMode() && !isAllowedOwnerEmail(user?.email)) {
    if (isApi) {
      return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isAiApi && user) {
    const idempotencyKey = request.headers.get('idempotency-key')?.trim().slice(0, 200) || undefined
    const limit = await distributedRateLimit('ai-user', {
      identity: user.id,
      minuteLimit: 30,
      dailyLimit: 500,
      cost: pathname === '/api/image' || pathname === '/api/transcribe' ? 5 : 1,
      idempotencyKey,
    })
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
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return withOperationsSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
