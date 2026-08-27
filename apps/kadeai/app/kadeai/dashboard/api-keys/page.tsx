'use client'

/*
 * Sayfa planı: paket uygunluk özeti → sağlayıcı kartları → maskeli durum,
 * değiştirme/silme eylemleri → güvenlik açıklaması. DashboardShell ve TopBar
 * mevcut KadeAI navigasyonunu ve responsive kabuğunu sağlar.
 */

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CheckCircle, Eye, EyeOff, KeyRound, Save, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'
import { cn } from '@/lib/utils'

type Provider = 'openai' | 'anthropic' | 'google'
type KeyStatus = { provider: Provider; configured: boolean; hint: string | null; updatedAt: string | null }

const PROVIDERS: Array<{ id: Provider; label: string; help: string; placeholder: string }> = [
  { id: 'openai', label: 'OpenAI', help: 'GPT modelleri için', placeholder: 'sk-...' },
  { id: 'anthropic', label: 'Anthropic', help: 'Claude modelleri için', placeholder: 'sk-ant-...' },
  { id: 'google', label: 'Google Gemini', help: 'Gemini modelleri için', placeholder: 'AIza...' },
]

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyStatus[]>([])
  const [values, setValues] = useState<Partial<Record<Provider, string>>>({})
  const [visible, setVisible] = useState<Partial<Record<Provider, boolean>>>({})
  const [busy, setBusy] = useState<Provider | null>(null)
  const [byokPlan, setByokPlan] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await apiFetch('/api/provider-keys', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Anahtar durumu okunamadı.')
      setKeys(data.keys || [])
      setByokPlan(data.byokPlan === true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Anahtar durumu okunamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function save(event: FormEvent, provider: Provider) {
    event.preventDefault()
    const key = values[provider]?.trim() || ''
    if (!key) return
    setBusy(provider)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch('/api/provider-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Anahtar kaydedilemedi.')
      setValues((current) => ({ ...current, [provider]: '' }))
      setVisible((current) => ({ ...current, [provider]: false }))
      setMessage('Anahtar şifrelenerek kaydedildi.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Anahtar kaydedilemedi.')
    } finally {
      setBusy(null)
    }
  }

  async function remove(provider: Provider) {
    setBusy(provider)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch(`/api/provider-keys?provider=${provider}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Anahtar silinemedi.')
      setMessage('Anahtar kalıcı olarak silindi.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Anahtar silinemedi.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Kendi API Anahtarların" description="BYOK sağlayıcılarını güvenli biçimde yönet" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <section className={cn(
            'rounded-xl border p-4',
            byokPlan ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-amber-500/25 bg-amber-500/10',
          )}>
            <div className="flex items-start gap-3">
              {byokPlan ? <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" /> : <KeyRound className="mt-0.5 h-5 w-5 text-amber-400" />}
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">{byokPlan ? 'Kendi Anahtarın paketi etkin' : 'BYOK paketi gerekli'}</h2>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  {byokPlan
                    ? 'Anahtarlar AES-256-GCM ile şifrelenir; kaydedilen değer tarayıcıya bir daha gönderilmez.'
                    : 'Anahtar ekleme, API hariç “Kendi Anahtarın” paketi etkin olduğunda açılır.'}
                </p>
              </div>
            </div>
          </section>

          {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          {message && <div role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

          {loading ? <p className="text-sm text-zinc-500">Sağlayıcılar yükleniyor…</p> : (
            <div className="space-y-3">
              {PROVIDERS.map((provider) => {
                const status = keys.find((item) => item.provider === provider.id)
                const configured = status?.configured === true
                return (
                  <form key={provider.id} onSubmit={(event) => save(event, provider.id)} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">{provider.label}</h3>
                        <p className="mt-0.5 text-xs text-zinc-500">{provider.help}</p>
                      </div>
                      {configured ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-3.5 w-3.5" /> {status?.hint}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-zinc-500"><XCircle className="h-3.5 w-3.5" /> Ayarlı değil</span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <input
                          type={visible[provider.id] ? 'text' : 'password'}
                          autoComplete="off"
                          value={values[provider.id] || ''}
                          onChange={(event) => setValues((current) => ({ ...current, [provider.id]: event.target.value }))}
                          disabled={!byokPlan || busy === provider.id}
                          placeholder={configured ? 'Değiştirmek için yeni anahtar gir' : provider.placeholder}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-3 pr-10 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <button type="button" aria-label="Anahtarı göster veya gizle" onClick={() => setVisible((current) => ({ ...current, [provider.id]: !current[provider.id] }))} className="absolute right-2 top-2 rounded p-1 text-zinc-500 hover:text-zinc-200">
                          {visible[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button disabled={!byokPlan || busy === provider.id || !values[provider.id]?.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
                        <Save className="h-4 w-4" /> {configured ? 'Değiştir' : 'Kaydet'}
                      </button>
                      {configured && (
                        <button type="button" onClick={() => void remove(provider.id)} disabled={busy === provider.id} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/25 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
                          <Trash2 className="h-4 w-4" /> Sil
                        </button>
                      )}
                    </div>
                  </form>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
