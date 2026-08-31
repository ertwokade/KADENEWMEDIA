'use client'

/*
 * Sayfa planı: açıklama → iletişim bilgileri → ihtiyaç ve ölçek →
 * istenen özellikler + API → not → gönder. Altta kullanıcının kendi
 * taleplerinin durumu (§15 pipeline'ının kullanıcıya görünen yüzü).
 */

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CheckCircle2, FileText, Send } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'
import { captureAnalytics } from '@/lib/analytics/client'

const TEAM_SIZES = ['1', '2-5', '6-20', '21-50', '50+'] as const

const FEATURES = [
  'İçerik üretimi',
  'Sosyal medya analizi',
  'Video fabrikası',
  'Otomatik altyazı',
  'Klip üretici',
  'Trend radarı',
  'Toplu üretim',
  'Öncelikli kuyruk',
  'API erişimi',
]

const STATUS_LABEL: Record<string, string> = {
  new: 'Yeni',
  reviewing: 'İnceleniyor',
  offer_prepared: 'Teklif Hazırlandı',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  payment_pending: 'Ödeme Bekliyor',
  completed: 'Tamamlandı',
}

interface Quote {
  id: string
  status: string
  use_case: string
  created_at: string
  admin_note: string | null
}

export default function QuoteRequestPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [apiNeeded, setApiNeeded] = useState(false)
  const [teamSize, setTeamSize] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const load = useCallback(async () => {
    try {
      const response = await apiFetch('/api/quotes', { cache: 'no-store' })
      const data = await response.json()
      if (response.ok) setQuotes(data.quotes || [])
    } catch {
      // Talep listesi okunamazsa form yine de kullanılabilir kalır.
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await apiFetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
          company: form.get('company'),
          email: form.get('email'),
          phone: form.get('phone'),
          useCase: form.get('useCase'),
          estimatedUsage: form.get('estimatedUsage'),
          notes: form.get('notes'),
          teamSize: teamSize || undefined,
          requestedFeatures: features,
          apiNeeded,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Teklif talebi gönderilemedi.')
      captureAnalytics('quote_requested', { apiNeeded, teamSize: teamSize || 'belirtilmedi' })
      setSent(true)
      event.currentTarget.reset()
      setFeatures([])
      setApiNeeded(false)
      setTeamSize('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Teklif talebi gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400'

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Teklif Al" description="İhtiyacına özel paket ve fiyat" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-5">

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><FileText className="h-4 w-4" /> Nasıl işliyor?</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Talebini gönder, ihtiyacını inceleyelim. Anlaştığımızda hesabına 15 dakika geçerli
              özel bir ödeme bağlantısı tanımlanır ve Paketler sayfasında “Size Özel Teklif”
              olarak görünür.
            </p>
          </section>

          {sent && (
            <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Teklif talebin alındı. Durumunu aşağıdan takip edebilirsin.
            </div>
          )}
          {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ad *"><input name="firstName" required maxLength={80} className={inputClass} /></Field>
              <Field label="Soyad *"><input name="lastName" required maxLength={80} className={inputClass} /></Field>
              <Field label="Şirket"><input name="company" maxLength={160} className={inputClass} /></Field>
              <Field label="E-posta *"><input name="email" type="email" required maxLength={254} className={inputClass} /></Field>
              <Field label="Telefon"><input name="phone" type="tel" maxLength={32} className={inputClass} /></Field>
              <Field label="Ekip büyüklüğü">
                <select value={teamSize} onChange={(event) => setTeamSize(event.target.value)} className={inputClass}>
                  <option value="">Seç</option>
                  {TEAM_SIZES.map((size) => <option key={size} value={size}>{size} kişi</option>)}
                </select>
              </Field>
            </div>

            <Field label="Kullanım ihtiyacın *">
              <textarea name="useCase" required minLength={10} maxLength={2000} rows={4} placeholder="Hangi işi çözmek istiyorsun?" className={inputClass} />
            </Field>

            <Field label="İstediğin özellikler">
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((feature) => {
                  const active = features.includes(feature)
                  return (
                    <button
                      type="button"
                      key={feature}
                      onClick={() => setFeatures((current) => active ? current.filter((item) => item !== feature) : [...current, feature])}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${active ? 'bg-violet-500 text-white' : 'border border-zinc-700 text-zinc-400 hover:text-zinc-100'}`}
                    >
                      {feature}
                    </button>
                  )
                })}
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={apiNeeded} onChange={(event) => setApiNeeded(event.target.checked)} className="h-4 w-4 accent-violet-500" />
              API erişimine ihtiyacım var
            </label>

            <Field label="Tahmini kullanım">
              <input name="estimatedUsage" maxLength={400} placeholder="Örn. ayda 300 içerik, 40 video" className={inputClass} />
            </Field>

            <Field label="Not">
              <textarea name="notes" maxLength={2000} rows={3} className={inputClass} />
            </Field>

            <button disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50">
              <Send className="h-4 w-4" /> {sending ? 'Gönderiliyor…' : 'Teklif talebi gönder'}
            </button>
          </form>

          {quotes.length > 0 && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">Taleplerin</h3>
              <ul className="mt-3 space-y-2">
                {quotes.map((quote) => (
                  <li key={quote.id} className="rounded-lg border border-zinc-800 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{STATUS_LABEL[quote.status] || quote.status}</span>
                      <time className="text-xs text-zinc-500">{new Date(quote.created_at).toLocaleDateString('tr-TR')}</time>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{quote.use_case}</p>
                    {quote.admin_note && <p className="mt-2 rounded bg-zinc-950 p-2 text-xs text-zinc-300">{quote.admin_note}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  )
}
