'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiPath, appRoutes, withBasePath } from '@/lib/appConfig'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoverySession, setRecoverySession] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')

  useEffect(() => {
    const recovery = new URLSearchParams(window.location.search).get('recovery') === '1'
    setRecoveryMode(recovery)
    if (!recovery) return
    setRecoverySession('checking')
    void fetch(apiPath('/api/auth/recovery-session'), { cache: 'no-store' })
      .then((response) => setRecoverySession(response.ok ? 'valid' : 'invalid'))
      .catch(() => setRecoverySession('invalid'))
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (recoveryMode) {
        if (recoverySession !== 'valid') throw new Error('Parola yenileme oturumu geçersiz.')
        const response = await fetch(apiPath('/api/auth/update-password'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const result = await response.json() as { error?: string }
        if (!response.ok) throw new Error(result.error || 'Parola güncellenemedi.')
        setMessage('Şifren güncellendi. Giriş ekranına yönlendiriliyorsun.')
        window.setTimeout(() => { window.location.href = withBasePath(appRoutes.login) }, 1200)
      } else {
        const response = await fetch(apiPath('/api/auth/recovery'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const result = await response.json() as { error?: string; message?: string }
        if (!response.ok) throw new Error(result.error || 'İşlem tamamlanamadı.')
        setMessage(result.message || 'İşlem tamamlandı.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 p-4 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">KadexAI</p>
          <h1 className="mt-2 text-2xl font-black">{recoveryMode ? 'Yeni şifre belirle' : 'Şifreni yenile'}</h1>
        </div>
        {recoveryMode ? (
          <label className="block text-xs text-zinc-400">Yeni şifre
            <input type="password" minLength={8} maxLength={128} autoComplete="new-password" required disabled={recoverySession !== 'valid'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400 disabled:opacity-50" />
          </label>
        ) : (
          <label className="block text-xs text-zinc-400">E-posta
            <input type="email" maxLength={254} autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
          </label>
        )}
        {recoverySession === 'checking' && <p role="status" className="text-xs text-zinc-400">Parola yenileme oturumu doğrulanıyor…</p>}
        {recoverySession === 'invalid' && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">Bağlantı geçersiz veya süresi dolmuş. Yeni bir parola yenileme bağlantısı isteyin.</p>}
        {message && <p role="status" aria-live="polite" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">{message}</p>}
        {error && <p role="alert" aria-live="assertive" className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</p>}
        <button disabled={loading || (recoveryMode && recoverySession !== 'valid')} className="w-full rounded-lg bg-[#f2c322] px-4 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-50">{loading ? 'Gönderiliyor…' : recoveryMode ? 'Şifreyi kaydet' : 'Bağlantı gönder'}</button>
        <Link href={withBasePath(appRoutes.login)} className="block text-center text-xs text-zinc-500 hover:text-zinc-300">Giriş ekranına dön</Link>
      </form>
    </main>
  )
}
