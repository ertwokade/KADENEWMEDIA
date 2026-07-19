'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, CloudOff, Plus, Trash2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

type SaleStatus = 'potansiyel' | 'teklif' | 'odendi'

type Sale = {
  id: string
  customer: string
  item: string
  amount: number
  status: SaleStatus
  note: string
  createdAt: string
}

const STORAGE_KEY = 'kade-owner-sales-v1'

const statusLabels: Record<SaleStatus, string> = {
  potansiyel: 'Potansiyel',
  teklif: 'Teklif gönderildi',
  odendi: 'Ödendi',
}

const money = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 0,
})

export default function OwnerSalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loaded, setLoaded] = useState(false)
  const [customer, setCustomer] = useState('')
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<SaleStatus>('potansiyel')
  const [note, setNote] = useState('')

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(parsed)) setSales(parsed)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoaded(true)
    }

  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
  }, [loaded, sales])

  const totals = useMemo(() => ({
    pipeline: sales.filter((sale) => sale.status !== 'odendi').reduce((sum, sale) => sum + sale.amount, 0),
    paid: sales.filter((sale) => sale.status === 'odendi').reduce((sum, sale) => sum + sale.amount, 0),
    open: sales.filter((sale) => sale.status !== 'odendi').length,
  }), [sales])

  const addSale = (event: FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount.replace(',', '.'))
    if (!customer.trim() || !item.trim() || !Number.isFinite(numericAmount) || numericAmount < 0) return

    setSales((current) => [{
      id: crypto.randomUUID(),
      customer: customer.trim(),
      item: item.trim(),
      amount: numericAmount,
      status,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }, ...current])
    setCustomer('')
    setItem('')
    setAmount('')
    setStatus('potansiyel')
    setNote('')
  }

  const updateStatus = (id: string, nextStatus: SaleStatus) => {
    setSales((current) => current.map((sale) => sale.id === id ? { ...sale, status: nextStatus } : sale))
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <TopBar title="Satış Merkezi" description="Yalnızca hesap sahibine açık teklif ve satış takibi" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <CloudOff className="mt-0.5 h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold">Shopier ödeme entegrasyonu bu sürümde etkin değil</p>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Aşağıdaki kayıtlar yalnızca bu tarayıcıda yerel tutulur. Ekran ödeme oluşturmaz, ödeme doğrulamaz ve sipariş senkronizasyonu yapmaz.
              </p>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Açık fırsat', value: totals.open.toString() },
              { label: 'Teklif havuzu', value: money.format(totals.pipeline) },
              { label: 'Tahsil edilen', value: money.format(totals.paid) },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs font-medium text-zinc-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <form onSubmit={addSale} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold">Yeni satış kaydı</h2>
              </div>
              <label className="block text-xs text-zinc-400">Müşteri
                <input required value={customer} onChange={(event) => setCustomer(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400" />
              </label>
              <label className="block text-xs text-zinc-400">Hizmet / ürün
                <input required value={item} onChange={(event) => setItem(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs text-zinc-400">Tutar (TL)
                  <input required min="0" step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400" />
                </label>
                <label className="block text-xs text-zinc-400">Durum
                  <select value={status} onChange={(event) => setStatus(event.target.value as SaleStatus)} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400">
                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-xs text-zinc-400">Not
                <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="mt-1.5 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-400" />
              </label>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300">
                <CircleDollarSign className="h-4 w-4" /> Kaydı ekle
              </button>
            </form>

            <section className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="border-b border-zinc-800 px-5 py-4">
                <h2 className="text-sm font-semibold">Satış kayıtları</h2>
                <p className="mt-1 text-xs text-zinc-500">Durumu listeden değiştirebilir, yanlış kaydı silebilirsin.</p>
              </div>
              {!sales.length ? (
                <div className="grid min-h-60 place-items-center p-8 text-center">
                  <div><CircleDollarSign className="mx-auto h-8 w-8 text-zinc-700" /><p className="mt-3 text-sm text-zinc-400">Henüz satış kaydı yok.</p></div>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {sales.map((sale) => (
                    <div key={sale.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="truncate text-sm font-semibold">{sale.customer}</p>
                          <span className="text-sm font-bold text-amber-300">{money.format(sale.amount)}</span>
                        </div>
                        <p className="mt-1 truncate text-xs text-zinc-400">{sale.item}</p>
                        {sale.note && <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{sale.note}</p>}
                      </div>
                      <select value={sale.status} onChange={(event) => updateStatus(sale.id, event.target.value as SaleStatus)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-amber-400">
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button type="button" aria-label="Kaydı sil" onClick={() => setSales((current) => current.filter((item) => item.id !== sale.id))} className="rounded-lg border border-zinc-800 p-2 text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
