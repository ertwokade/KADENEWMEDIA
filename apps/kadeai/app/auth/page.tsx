'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { User, Lock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPath, appRoutes, withBasePath } from '@/lib/appConfig'
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

  const isLogin = mode === 'login'

  /* Sunum katmanı bilinçli olarak Tailwind yerine anlamlı sınıflara dayanır:
     giriş ekranının görünümü app/kade-skin.css içinde, sitenin /giris
     ekranlarıyla aynı tasarım dilinde tanımlıdır. Kimlik doğrulama akışı
     (state, fetch, OAuth) bu düzenlemeden etkilenmez. */
  return (
    <div className="kade-auth-page">
      <div className="kade-auth-grid" aria-hidden="true" />

      <header className="kade-auth-hud">
        <a className="kade-auth-brand" href="https://kadenewmedia.com">
          <span>Kade</span><span>New Media</span>
        </a>
        <nav className="kade-auth-nav">
          <a href="https://kadenewmedia.com/giris">← <span>Çalışma alanı</span></a>
          <ThemeToggle compact />
        </nav>
      </header>

      <main className="kade-auth-main">
        <div className="kade-auth-card">
          <div className="kade-auth-heading">
            <p className="kade-auth-eyebrow">Content AI çalışma alanı</p>
            <h1>{isLogin ? 'Tekrar hoş geldiniz.' : 'Çalışma alanınızı açın.'}</h1>
            <p>İçerik üretimi, trend radarı ve operasyon araçları tek panelde.</p>
          </div>

          <div className="kade-auth-tabs" role="tablist" aria-label="Hesap işlemi">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={cn('kade-auth-tab', mode === m && 'is-active')}
              >
                {m === 'login' ? 'Giriş yap' : 'Kayıt ol'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="kade-auth-google"
          >
            <GoogleMark />
            {googleLoading ? 'Google’a yönlendiriliyor...' : 'Google ile devam et'}
          </button>

          <div className="kade-auth-divider" aria-hidden="true"><span>veya</span></div>

          <form onSubmit={handleSubmit} className="kade-auth-form">
            {!isLogin && (
              <label className="kade-auth-field" htmlFor="auth-display-name">
                <span>Görünen ad</span>
                <div>
                  <User className="kade-auth-field-icon" aria-hidden="true" />
                  <input
                    id="auth-display-name"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Kade, Studio Kade..."
                    autoComplete="name"
                    className="kade-auth-input"
                  />
                </div>
              </label>
            )}

            <label className="kade-auth-field" htmlFor="auth-identifier">
              <span>{isLogin ? 'Admin kullanıcı adı veya e-posta' : 'E-posta'}</span>
              <div>
                <Mail className="kade-auth-field-icon" aria-hidden="true" />
                <input
                  id="auth-identifier"
                  type={isLogin ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  maxLength={254}
                  placeholder={isLogin ? 'Admin kullanıcı adı veya e-posta' : 'kadir@email.com'}
                  autoComplete={isLogin ? 'username' : 'email'}
                  className="kade-auth-input"
                />
              </div>
              {isLogin && (
                <small className="kade-auth-hint">
                  Admin panelinde kullandığın kullanıcı adı ve şifreyle doğrudan giriş yapabilirsin.
                </small>
              )}
            </label>

            <label className="kade-auth-field" htmlFor="auth-password">
              <span>Şifre</span>
              <div>
                <Lock className="kade-auth-field-icon" aria-hidden="true" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="En az 8 karakter"
                  minLength={8}
                  maxLength={128}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  aria-describedby={isLogin ? undefined : 'auth-password-hint'}
                  className="kade-auth-input"
                />
              </div>
              {!isLogin && (
                <small id="auth-password-hint" className="kade-auth-hint">{SIGNUP_PASSWORD_HINT}</small>
              )}
            </label>

            {error && <p role="alert" aria-live="assertive" className="kade-auth-error">{error}</p>}
            {success && <p role="status" aria-live="polite" className="kade-auth-success">{success}</p>}

            <button type="submit" disabled={loading || googleLoading} className="kade-auth-submit">
              <span>{loading ? 'Yükleniyor...' : isLogin ? 'Çalışma alanına gir' : 'Hesap oluştur'}</span>
              {!loading && <em aria-hidden="true">↗</em>}
            </button>

            {isLogin && (
              <a href={withBasePath('/reset-password')} className="kade-auth-forgot">Şifremi unuttum</a>
            )}
          </form>

          {/* Danışmanlık ayrı bir hesap; yanlış kapıya gelen doğru kapıyı görsün. */}
          <a className="kade-auth-crosslink" href="https://kadenewmedia.com/giris/danismanlik">
            <span>Danışmanlık paneli aramıştınız?</span>
            <strong>Müşteri girişine git <em aria-hidden="true">↗</em></strong>
          </a>
        </div>

        <footer className="kade-auth-meta">
          <span>İstanbul</span>
          <a href="https://kadenewmedia.com">kadenewmedia.com</a>
        </footer>
      </main>
    </div>
  )
}
