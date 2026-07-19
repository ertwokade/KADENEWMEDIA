'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { User, Lock, Mail, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiPath, withBasePath } from '@/lib/appConfig'
import KadeLogo from '@/components/brand/KadeLogo'
import { captureAnalytics } from '@/lib/analytics/client'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')      // sadece kayıtta
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
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

    try {
      const response = await fetch(apiPath('/api/auth/password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, email, password, displayName: nickname }),
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 p-4 text-zinc-100">
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

            {/* E-posta */}
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-zinc-400">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required maxLength={254} placeholder="kadir@email.com" autoComplete="email"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400" />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-zinc-400">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="En az 8 karakter" minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400" />
              </div>
            </div>

            {error   && <p role="alert" aria-live="assertive" className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
            {success && <p role="status" aria-live="polite" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{success}</p>}

            <button type="submit" disabled={loading}
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
