'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { User, Lock, Mail, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPath, appRoutes, withBasePath } from '@/lib/appConfig'
import KadeLogo from '@/components/brand/KadeLogo'
import ThemeToggle from '@/components/theme/ThemeToggle'
import { captureAnalytics } from '@/lib/analytics/client'
import { mapGoogleOAuthError } from '@/lib/auth/oauth'
import { getSignupPasswordError, SIGNUP_PASSWORD_HINT } from '@/lib/auth/passwordPolicy'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.83-1.77-5.62-4.14H3.03v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.38 13.92A6 6 0 0 1 6.06 12c0-.67.12-1.32.32-1.92V7.46H3.03A10 10 0 0 0 2 12c0 1.63.39 3.17 1.03 4.54l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.97 5.46l3.35 2.62C7.17 7.71 9.39 5.94 12 5.94Z" />
    </svg>
  )
}

export default function AuthPage() {
  const [mode, setMode]         = useState<Mode>('login')
  const [identifier, setIdentifier] = useState('')
  const [nickname, setNickname] = useState('')      // sadece kayıtta
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('auth_error')
    if (authError) setError(authError)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    if (!isConfigured) {
      setError('Supabase bağlantısı yok. Vercel env var\'larını kontrol et.')
      setLoading(false)
      return
    }
    if (mode === 'signup') {
      const passwordError = getSignupPasswordError(password)
      if (passwordError) {
        setError(passwordError)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(apiPath('/api/auth/password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          identifier,
          email: mode === 'signup' ? identifier : undefined,
          password,
          displayName: nickname,
        }),
      })
      const result = await response.json() as { error?: string; message?: string; next?: string | null }
      if (!response.ok) {
        captureAnalytics('login_failed', { status: response.status })
        setError(result.error || 'İşlem tamamlanamadı.')
        return
      }
      if (result.next) {
        captureAnalytics('login_succeeded')
        window.location.href = withBasePath(result.next)
        return
      }
      setSuccess(result.message || 'İşlem tamamlandı.')
    } catch {
      setError('Kimlik doğrulama hizmetine ulaşılamıyor.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    setSuccess('')

    if (!isConfigured) {
      setError('Supabase bağlantısı yok. Vercel env var\'larını kontrol et.')
      setGoogleLoading(false)
      return
    }

    try {
      const callbackPath = `${appRoutes.authCallback}?next=${encodeURIComponent(appRoutes.dashboard)}`
      const redirectTo = new URL(withBasePath(callbackPath), window.location.origin).toString()
      const { error: oauthError } = await createSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (oauthError) {
        captureAnalytics('login_failed', { provider: 'google', status: oauthError.status || 0 })
        setError(mapGoogleOAuthError(oauthError))
      }
    } catch {
      captureAnalytics('login_failed', { provider: 'google', status: 0 })
      setError(mapGoogleOAuthError({}))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="kade-auth-page relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 text-zinc-100">
      <ThemeToggle compact className="fixed right-4 top-4 z-20" />
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <KadeLogo className="w-[220px] max-w-[72vw] drop-shadow-[0_12px_30px_rgba(242,195,34,0.12)]" priority />
          </div>
          <p className="text-sm text-zinc-500">İçerik ve operasyon çalışma alanı</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-1">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={cn('flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors',
                  mode === m ? 'bg-[#f2c322] text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-200')}>
                {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark />
            {googleLoading ? 'Google’a yönlendiriliyor...' : 'Google ile devam et'}
          </button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-zinc-800" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">veya</span>
            <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kayıtta görünen ad */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-display-name" className="mb-1.5 block text-xs font-medium text-zinc-400">Görünen Ad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input id="auth-display-name" value={nickname} onChange={(e) => setNickname(e.target.value)}
                    placeholder="Kade, Studio Kade..." autoComplete="name"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400" />
                </div>
              </div>
            )}

            {/* Admin kullanıcı adı veya KadeAI e-postası */}
            <div>
              <label htmlFor="auth-identifier" className="mb-1.5 block text-xs font-semibold text-zinc-400">
                {mode === 'login' ? 'Admin kullanıcı adı veya e-posta' : 'E-posta'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="auth-identifier" type={mode === 'login' ? 'text' : 'email'} value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  required maxLength={254} placeholder={mode === 'login' ? 'Admin kullanıcı adı veya e-posta' : 'kadir@email.com'}
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400" />
              </div>
              {mode === 'login' && (
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  Admin panelinde kullandığın kullanıcı adı ve şifreyle doğrudan giriş yapabilirsin.
                </p>
              )}
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-zinc-400">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="En az 8 karakter" minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  aria-describedby={mode === 'signup' ? 'auth-password-hint' : undefined}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400" />
              </div>
              {mode === 'signup' && (
                <p id="auth-password-hint" className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  {SIGNUP_PASSWORD_HINT}
                </p>
              )}
            </div>

            {error   && <p role="alert" aria-live="assertive" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
            {success && <p role="status" aria-live="polite" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{success}</p>}

            <button type="submit" disabled={loading || googleLoading}
              className="w-full rounded-xl bg-[#f2c322] py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#ffda3f] disabled:opacity-50">
              {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
            </button>
            {mode === 'login' && (
              <a href={withBasePath('/reset-password')} className="block text-center text-xs font-medium text-amber-400 hover:text-amber-300">
                Şifremi unuttum
              </a>
            )}
          </form>

        </div>
        <a
          href="https://kadenewmedia.com"
          className="mx-auto flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 text-sm font-semibold text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-amber-300"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Anasayfaya Dön
        </a>
      </div>
    </div>
  )
}
