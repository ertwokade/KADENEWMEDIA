'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'

type Tier = 'baslangic' | 'pro' | 'sinirsiz'
type Period = 'weekly' | 'monthly' | 'yearly'

interface Pkg {
  id: string
  name: string
  tier: Tier
  period: Period
  apiIncluded: boolean
  amountMinor: number
  currency: string
  features: string[]
}

const TIER_LABEL: Record<Tier, string> = { baslangic: 'Başlangıç', pro: 'Pro', sinirsiz: 'Sınırsız' }
const PERIOD_LABEL: Record<Period, string> = { weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' }
const FEATURE_LABEL: Record<string, string> = {
  'content-generation': 'İçerik üretimi',
  'image-basic': 'Temel görsel üretimi',
  'image-advanced': 'Gelişmiş görsel üretimi',
  'video-factory-basic': 'Video Fabrikası (temel)',
  'video-factory': 'Video Fabrikası (tam)',
  'auto-captions': 'Otomatik altyazı',
  'clip-generator': 'Klip üretici',
  'auto-publish': 'Otomatik yayınlama',
  bulk: 'Toplu üretim',
  'priority-queue': 'Öncelikli kuyruk',
}

const TIERS: Tier[] = ['baslangic', 'pro', 'sinirsiz']
const PERIODS: Period[] = ['weekly', 'monthly', 'yearly']

function formatPrice(minor: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(minor / 100)
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [apiIncluded, setApiIncluded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(apiPath('/api/packages'))
      .then((r) => r.json())
      .then((d) => setPackages(d.packages || []))
      .catch(() => setError('Paketler yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(
    () => TIERS.map((tier) => packages.find((p) => p.tier === tier && p.period === period && p.apiIncluded === apiIncluded)).filter(Boolean) as Pkg[],
    [packages, period, apiIncluded],
  )

  async function buy(pkg: Pkg) {
    setBuying(pkg.id)
    setError('')
    try {
      const res = await apiFetch(apiPath('/api/payments/checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: pkg.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ödeme başlatılamadı.')
      // Shopier yönlendirme sayfasına git (15 dk geçerli)
      window.location.href = data.checkoutUrl.startsWith('http') ? data.checkoutUrl : apiPath(data.checkoutUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödeme başlatılamadı.')
    } finally {
      setBuying(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Paketler</h1>
          <p className="mt-1 text-sm text-zinc-400">Sana uygun planı seç. Fiyat, seçimden sonra <span className="text-amber-400">15 dakika</span> geçerlidir.</p>
        </div>

        {/* Periyot + API seçici */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn('rounded-md px-4 py-1.5 text-sm transition', period === p ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-zinc-200')}
              >
                {PERIOD_LABEL[p]}
                {p === 'yearly' && <span className="ml-1 text-xs text-emerald-300">2 ay bedava</span>}
              </button>
            ))}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input type="checkbox" checked={apiIncluded} onChange={(e) => setApiIncluded(e.target.checked)} className="accent-violet-500" />
            API anahtarları dahil
            <span className="text-xs text-zinc-500">(kapatırsan kendi anahtarını kullanırsın, daha ucuz)</span>
          </label>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>}
        {loading ? (
          <p className="text-sm text-zinc-500">Yükleniyor…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {visible.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  'flex flex-col rounded-2xl border p-6',
                  pkg.tier === 'pro' ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50',
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-100">{TIER_LABEL[pkg.tier]}</h3>
                  {pkg.tier === 'pro' && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">En popüler</span>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-zinc-100">{formatPrice(pkg.amountMinor)}</span>
                  <span className="text-sm text-zinc-500"> / {PERIOD_LABEL[pkg.period].toLowerCase()}</span>
                </div>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-zinc-300">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {FEATURE_LABEL[f] ?? f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => buy(pkg)}
                  disabled={buying === pkg.id}
                  className={cn(
                    'rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50',
                    pkg.tier === 'pro' ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-zinc-100 text-zinc-900 hover:bg-white',
                  )}
                >
                  {buying === pkg.id ? 'Yönlendiriliyor…' : 'Satın al'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
