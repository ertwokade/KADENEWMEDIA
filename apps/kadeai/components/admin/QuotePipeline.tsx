'use client'

/*
 * Panel planı: durum filtresi → talep kartları → durum değiştirme,
 * admin notu ve "Ödeme Oluştur" (§16). Ödeme oluşturulduğunda talep
 * otomatik olarak "Ödeme Bekliyor"a geçer ve sipariş kimliği bağlanır.
 */

import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Inbox, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'

const STATUSES = [
  'new', 'reviewing', 'offer_prepared', 'sent',
  'accepted', 'rejected', 'payment_pending', 'completed',
] as const

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
  first_name: string
  last_name: string
  company: string | null
  email: string
  phone: string | null
  use_case: string
  team_size: string | null
  requested_features: string[]
  api_needed: boolean
  estimated_usage: string | null
  notes: string | null
  status: string
  payment_order_id: string | null
  admin_note: string | null
  created_at: string
}

export default function QuotePipeline() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filter, setFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState<Record<string, { productId: string; amount: string }>>({})

  const load = useCallback(async (status: string) => {
    setLoading(true)
    setError('')
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : ''
      const response = await apiFetch(`/api/admin/quotes${query}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Teklif talepleri okunamadı.')
      setQuotes(data.quotes || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Teklif talepleri okunamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(filter) }, [filter, load])

  async function patch(body: Record<string, unknown>, id: string, successText: string) {
    setBusy(id)
    setError('')
    setMessage('')
    try {
      const response = await apiFetch('/api/admin/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...body }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı.')
      setMessage(successText)
      await load(filter)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İşlem tamamlanamadı.')
    } finally {
      setBusy(null)
    }
  }

  const inputClass = 'rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={inputClass}>
          <option value="">Tüm durumlar</option>
          {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
        </select>
        <button onClick={() => void load(filter)} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-100">
          <RefreshCw className="h-3.5 w-3.5" /> Yenile
        </button>
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      {message && <div role="status" className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

      {loading && <p className="text-sm text-zinc-500">Talepler okunuyor…</p>}

      {!loading && quotes.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-500">
          <Inbox className="h-4 w-4" /> Bu filtrede teklif talebi yok.
        </div>
      )}

      {quotes.map((quote) => {
        const draft = drafts[quote.id] || { productId: 'pro-monthly-api', amount: '' }
        return (
          <article key={quote.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  {quote.first_name} {quote.last_name}
                  {quote.company && <span className="ml-2 text-xs font-normal text-zinc-500">{quote.company}</span>}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {quote.email}{quote.phone ? ` · ${quote.phone}` : ''}
                  {quote.team_size ? ` · ${quote.team_size} kişi` : ''}
                  {quote.api_needed ? ' · API istiyor' : ''}
                </p>
              </div>
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{STATUS_LABEL[quote.status] || quote.status}</span>
            </header>

            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{quote.use_case}</p>
            {quote.estimated_usage && <p className="mt-1 text-xs text-zinc-500">Tahmini kullanım: {quote.estimated_usage}</p>}
            {quote.requested_features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quote.requested_features.map((feature) => (
                  <span key={feature} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">{feature}</span>
                ))}
              </div>
            )}
            {quote.notes && <p className="mt-2 rounded bg-zinc-950 p-2 text-xs text-zinc-400">{quote.notes}</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
              <select
                value={quote.status}
                disabled={busy === quote.id}
                onChange={(event) => void patch({ status: event.target.value }, quote.id, 'Durum güncellendi.')}
                className={inputClass}
              >
                {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
              </select>

              <input
                defaultValue={quote.admin_note || ''}
                placeholder="Müşteriye görünen not"
                maxLength={2000}
                onBlur={(event) => {
                  if (event.target.value !== (quote.admin_note || '')) {
                    void patch({ adminNote: event.target.value }, quote.id, 'Not kaydedildi.')
                  }
                }}
                className={`${inputClass} min-w-[200px] flex-1`}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                value={draft.productId}
                onChange={(event) => setDrafts((current) => ({ ...current, [quote.id]: { ...draft, productId: event.target.value } }))}
                placeholder="Katalog ürünü (ör. pro-monthly-api)"
                className={`${inputClass} min-w-[200px]`}
              />
              <input
                value={draft.amount}
                inputMode="numeric"
                onChange={(event) => setDrafts((current) => ({ ...current, [quote.id]: { ...draft, amount: event.target.value } }))}
                placeholder="Tutar (TL)"
                className={`${inputClass} w-32`}
              />
              <button
                disabled={busy === quote.id || !draft.amount.trim()}
                onClick={() => void patch({
                  action: 'create-payment',
                  productId: draft.productId,
                  customerEmail: quote.email,
                  // Kullanıcı TL girer; sunucu kuruş bekler.
                  amountMinor: Math.round(Number(draft.amount) * 100),
                }, quote.id, 'Özel ödeme bağlantısı oluşturuldu (15 dakika geçerli).')}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-400 disabled:opacity-50"
              >
                <CreditCard className="h-3.5 w-3.5" /> Ödeme Oluştur
              </button>
              {quote.payment_order_id && (
                <span className="font-mono text-[11px] text-zinc-500">Sipariş: {quote.payment_order_id.slice(0, 8)}…</span>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
