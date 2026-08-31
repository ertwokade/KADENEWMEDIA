import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { appRoutes, withBasePath } from '@/lib/appConfig'
import { mapGoogleOAuthError } from '@/lib/auth/oauth'
import { supabaseCookieOptions } from '@/lib/supabase/cookieOptions'

function safeNext(value: string | null) {
  if (!value) return appRoutes.dashboard
  if (value === appRoutes.onboarding || value === appRoutes.dashboard || value.startsWith(`${appRoutes.dashboard}/`)) return value
  if (value === '/reset-password?recovery=1') return value
  return appRoutes.dashboard
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = (() => {
    if (process.env.NODE_ENV !== 'production') return request.nextUrl.origin
    try { return new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com/kadexai').origin } catch { return request.nextUrl.origin }
  })()
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))
  const providerErrorCode = searchParams.get('error_code') || searchParams.get('error')

  if (providerErrorCode) {
    const loginUrl = new URL(`${origin}${withBasePath(appRoutes.login)}`)
    loginUrl.searchParams.set('auth_error', mapGoogleOAuthError({
      code: providerErrorCode,
      message: searchParams.get('error_description'),
    }))
    return NextResponse.redirect(loginUrl)
  }

  if (
    code
    && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    const loginUrl = new URL(`${origin}${withBasePath(appRoutes.login)}`)
    loginUrl.searchParams.set('auth_error', 'Kimlik doğrulama bağlantısı yapılandırılmamış.')
    return NextResponse.redirect(loginUrl)
  }

  if (code && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: supabaseCookieOptions,
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const loginUrl = new URL(`${origin}${withBasePath(appRoutes.login)}`)
      loginUrl.searchParams.set('auth_error', 'Oturum bağlantısı geçersiz veya süresi dolmuş.')
      return NextResponse.redirect(loginUrl)
    }
  } else if (!code) {
    const loginUrl = new URL(`${origin}${withBasePath(appRoutes.login)}`)
    loginUrl.searchParams.set('auth_error', 'Giriş doğrulama kodu bulunamadı.')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(`${origin}${withBasePath(next)}`)
}
