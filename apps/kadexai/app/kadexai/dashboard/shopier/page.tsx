'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'

type Order = { id: string; product_id: string; amount_minor: number; status: string; checkout_url: string | null; created_at: string }
type Package = { id: string; name: string; amountMinor: number }
type DashboardData = {
  metrics: Record<string, number | null>
  orders: Order[]
  packages: Package[]
  auditEvents: Array<{ id: string; action: string; outcome: string; created_at: string }>
}

const money = (minor: number | null | undefined) => new Intl.NumberFormat('tr-TR', {
  style: 'currency', currency: 'TRY', maximumFractionDigits: 0,
}).format((minor || 0) / 100)

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ödeme bekliyor', paid: 'Ödendi', failed: 'Başarısız', cancelled: 'İptal', expired: 'Süresi doldu',
}

export default function OwnerSalesPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [productId, setProductId] = useState('')
  const [amount, setAmount] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/payments/owner', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Satış verileri yüklenemedi.')
      setData(payload)
      setProductId((current) => current || payload.packages?.[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Satış verileri yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function createOffer(event: FormEvent) {
    event.preventDefault()
    const amountMinor = Math.round(Number(amount.replace(',', '.')) * 100)
    if (!email.trim() || !productId || !Number.isFinite(amountMinor) || amountMinor <= 0) return
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await apiFetch('/api/payments/owner', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-offer', customerEmail: email, productId, amountMinor }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Teklif oluşturulamadı.')
      setMessage(`15 dakikalık teklif oluşturuldu: ${payload.offer.checkoutUrl}`)
      setEmail(''); setAmount('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Teklif oluşturulamadı.')
    } finally { setBusy(false) }
  }

  const cards = useMemo(() => data ? [
    ['Toplam kullanıcı', data.metrics.users?.toLocaleString('tr-TR') ?? '—'],
    ['Aktif abonelik', data.metrics.activeSubscriptions?.toLocaleString('tr-TR') ?? '0'],
    ['MRR', money(data.metrics.mrrMinor)], ['ARR', money(data.metrics.arrMinor)],
    ['Son 7 gün satış', money(data.metrics.weeklySalesMinor)], ['Son 30 gün satış', money(data.metrics.monthlySalesMinor)],
    ['Ödeme bekleyen', data.metrics.pendingPayments?.toLocaleString('tr-TR') ?? '0'],
    ['Süresi dolan', data.metrics.expiredOffers?.toLocaleString('tr-TR') ?? '0'],
  ] : [], [data])

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <TopBar title="Satış Merkezi" description="Canlı Shopier siparişleri, paketler ve kişiye özel teklifler" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" /><div><p className="text-sm font-semibold">Shopier ödeme altyapısı bağlı</p><p className="mt-1 text-xs text-zinc-400">Sipariş tutarı sunucuda kilitlenir; imzalı callback sonrası yetki otomatik açılır.</p></div></div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> Yenile</button>
        </div>
        {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
        {message && <div role="status" className="break-all rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}</section>
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createOffer} className="h-fit space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-amber-400" /><h2 className="text-sm font-semibold">Kişiye özel teklif</h2></div>
            <p className="text-xs leading-5 text-zinc-500">Kullanıcının KadexAI hesabı olmalı. Oluşturulan fiyat ve ödeme bağlantısı 15 dakika sonra sona erer.</p>
            <label className="block text-xs text-zinc-400">Kullanıcı e-postası<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400" /></label>
            <label className="block text-xs text-zinc-400">Yetki verilecek paket<select required value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400">{data?.packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="block text-xs text-zinc-400">Anlaşılan tutar (TL)<input required min="1" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-400" /></label>
            <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-300 disabled:opacity-50"><Send className="h-4 w-4" /> {busy ? 'Oluşturuluyor…' : '15 dakikalık ödeme oluştur'}</button>
          </form>
          <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4"><h2 className="text-sm font-semibold">Son siparişler</h2><p className="mt-1 text-xs text-zinc-500">Sunucudaki gerçek payment ledger kayıtları.</p></div>
            {loading ? <p className="p-5 text-sm text-zinc-500">Yükleniyor…</p> : !data?.orders.length ? <p className="p-5 text-sm text-zinc-500">Henüz sipariş yok.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-zinc-950/60 text-zinc-500"><tr><th className="px-4 py-3">Paket</th><th className="px-4 py-3">Tutar</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Tarih</th></tr></thead><tbody className="divide-y divide-zinc-800">{data.orders.map((order) => <tr key={order.id}><td className="max-w-[220px] truncate px-4 py-3 text-zinc-300">{order.product_id}</td><td className="px-4 py-3 font-semibold">{money(order.amount_minor)}</td><td className="px-4 py-3"><span className="rounded-full bg-zinc-800 px-2 py-1">{STATUS_LABEL[order.status] || order.status}</span></td><td className="px-4 py-3 text-zinc-500">{new Date(order.created_at).toLocaleString('tr-TR')}</td></tr>)}</tbody></table></div>}
          </section>
        </div>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"><h2 className="text-sm font-semibold">Son güvenli işlemler</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data?.auditEvents.length ? data.auditEvents.map((event) => <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-medium text-zinc-300">{event.action}</p><p className="mt-1 text-[11px] text-zinc-600">{event.outcome} · {new Date(event.created_at).toLocaleString('tr-TR')}</p></div>) : <p className="text-xs text-zinc-500">Henüz audit kaydı yok.</p>}</div></section>
      </div></div>
    </div>
  )
}
