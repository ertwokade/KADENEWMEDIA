'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/client/api'
import { apiPath, withBasePath } from '@/lib/appConfig'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'
import { captureAnalytics } from '@/lib/analytics/client'

type Tier = 'baslangic' | 'pro' | 'sinirsiz'
type Period = 'weekly' | 'monthly' | 'yearly'

interface Pkg {
  id: string
  name: string
  tier: Tier
  period: Period
  apiIncluded: boolean
  tierLabel?: string
  amountMinor: number
  currency: string
  features: string[]
}

interface CustomOffer {
  id: string
  product_id: string
  productName: string
  amount_minor: number
  currency: string
  checkout_url: string
  expires_at: string
}

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

type Plan = {
  tier: string
  label?: string
  period: string | null
  apiIncluded: boolean
  features: string[]
  expiresAt: string | null
}

/** Sahip olunan paket, karttaki paketle aynı mı? Dönem ve API dahil olma
 *  durumu da eşleşmeli: aynı kademenin aylık ve yıllık hâli ayrı ürün. */
function sendeVar(plan: Plan | null, pkg: Pkg): boolean {
  if (!plan || plan.tier === 'free') return false
  return plan.tier === pkg.tier && plan.period === pkg.period && plan.apiIncluded === pkg.apiIncluded
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [apiIncluded, setApiIncluded] = useState(true)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [offers, setOffers] = useState<CustomOffer[]>([])
  // Ödeme öncesi onay gereken yasal metinler. Hukuk danışmanı metinleri
  // yayınlayana kadar bu liste boştur ve satın alma akışı değişmez.
  const [legalDocuments, setLegalDocuments] = useState<Array<{ slug: string; title: string }>>([])
  const [acceptedLegal, setAcceptedLegal] = useState<string[]>([])
  // Sayfa yalnızca satış listesiydi: hangi paketin senin olduğunu, neyin
  // zaten açık olduğunu göstermiyordu. Etkin yetki buradan okunuyor.
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    Promise.all([
      apiFetch(apiPath('/api/packages')).then((r) => r.json()),
      apiFetch(apiPath('/api/payments/offers')).then((r) => r.ok ? r.json() : { offers: [] }),
      apiFetch(apiPath('/api/legal')).then((r) => r.ok ? r.json() : { checkoutDocuments: [] }),
      apiFetch(apiPath('/api/usage')).then((r) => r.ok ? r.json() : null),
    ])
      .then(([packageData, offerData, legalData, usageData]) => {
        setPackages(packageData.packages || [])
        setOffers(offerData.offers || [])
        setLegalDocuments(legalData.checkoutDocuments || [])
        setPlan(usageData?.plan ?? null)
        captureAnalytics('package_viewed')
        if (offerData.offers?.length) captureAnalytics('custom_offer_viewed', { count: offerData.offers.length })
      })
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
        body: JSON.stringify({ productId: pkg.id, acceptedDocuments: acceptedLegal }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ödeme başlatılamadı.')
      captureAnalytics('checkout_started', { productId: pkg.id, amountMinor: pkg.amountMinor })
      // Shopier yönlendirme sayfasına git (15 dk geçerli)
      window.location.href = data.checkoutUrl.startsWith('http') ? data.checkoutUrl : apiPath(data.checkoutUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödeme başlatılamadı.')
    } finally {
      setBuying(null)
    }
  }

  const legalReady = legalDocuments.every((document) => acceptedLegal.includes(document.slug))

  return (
    <div className="min-h-screen bg-zinc-950">
      <TopBar title="Paketler" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {legalDocuments.length > 0 && (
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="text-sm font-semibold text-zinc-100">Ödeme öncesi onay</h2>
            <ul className="mt-3 space-y-2">
              {legalDocuments.map((document) => (
                <li key={document.slug}>
                  <label className="flex items-start gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={acceptedLegal.includes(document.slug)}
                      onChange={(event) => setAcceptedLegal((current) => event.target.checked
                        ? [...current, document.slug]
                        : current.filter((slug) => slug !== document.slug))}
                      className="mt-0.5 h-4 w-4 accent-violet-500"
                    />
                    <span>
                      <a href={apiPath(`/legal/${document.slug}`)} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-100">
                        {document.title}
                      </a>
                      &apos;ni okudum ve onaylıyorum.
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-100">Paketler</h2>
          <p className="mt-1 text-sm text-zinc-400">Sana uygun planı seç. Fiyat, seçimden sonra <span className="text-amber-400">15 dakika</span> geçerlidir.</p>
        </div>

        {offers.length > 0 && (
          <section className="mb-8 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Size Özel Teklif</p>
            <div className="mt-3 space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="flex flex-col gap-3 rounded-xl border border-amber-300/20 bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{offer.productName}</h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatPrice(offer.amount_minor)} · {new Date(offer.expires_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} saatine kadar geçerli
                    </p>
                  </div>
                  <button
                    onClick={() => { captureAnalytics('checkout_started', { customOffer: true }); window.location.href = apiPath(offer.checkout_url) }}
                    className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-300"
                  >Özel teklifi öde</button>
                </div>
              ))}
            </div>
          </section>
        )}

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
            {visible.map((pkg) => {
              const senin = sendeVar(plan, pkg)
              const sahipOlunanOzellikler = new Set(plan?.features ?? [])
              return (
              <div
                key={pkg.id}
                className={cn(
                  'flex flex-col rounded-2xl border p-6',
                  senin
                    ? 'border-[color:var(--kade-accent)] bg-[color:var(--kade-a-50)]'
                    : pkg.tier === 'pro' ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-800 bg-zinc-900/50',
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-zinc-100">{pkg.tierLabel || pkg.name}</h3>
                  {senin
                    ? <span className="rounded-full bg-[color:var(--kade-accent)] px-2 py-0.5 text-xs font-semibold text-[color:var(--kade-on-accent)]">Senin paketin</span>
                    : pkg.tier === 'pro' && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">En popüler</span>}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-zinc-100">{formatPrice(pkg.amountMinor)}</span>
                  <span className="text-sm text-zinc-500"> / {PERIOD_LABEL[pkg.period].toLowerCase()}</span>
                </div>
                <ul className="mb-6 flex-1 space-y-2 text-sm text-zinc-300">
                  {pkg.features.map((f) => {
                    // Zaten açık olan özellik: hangi paketi alırsan neyi
                    // kaybetmeyeceğini görmek satın alma kararını kolaylaştırıyor.
                    const acik = sahipOlunanOzellikler.has(f)
                    return (
                      <li key={f} className="flex items-center gap-2">
                        <span className={acik ? 'text-[color:var(--kade-accent)]' : 'text-emerald-400'}>✓</span>
                        <span>{FEATURE_LABEL[f] ?? f}</span>
                        {acik && !senin && (
                          <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--kade-accent-text)]">açık</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {senin ? (
                  <div className="rounded-lg border border-[color:var(--kade-accent)]/40 px-4 py-2.5 text-center text-sm font-medium text-[color:var(--kade-accent-text)]">
                    Kullanımda
                    {plan?.expiresAt && (
                      <span className="ml-1 font-normal text-zinc-500">
                        · {new Date(plan.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}&apos;e kadar
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => buy(pkg)}
                    disabled={buying === pkg.id || !legalReady}
                    className={cn(
                      'rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50',
                      pkg.tier === 'pro' ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-zinc-100 text-zinc-900 hover:bg-white',
                    )}
                  >
                    {buying === pkg.id ? 'Yönlendiriliyor…' : 'Satın al'}
                  </button>
                )}
              </div>
              )
            })}
          </div>
        )}

        {/* Teklif Al artık sol menüde değil: bir fiyatlandırma eylemi olduğu
            için ait olduğu yer burası. */}
        <section className="mt-10 rounded-2xl border border-[color:var(--kade-line)] bg-[color:var(--kade-surface-soft)]/50 p-6">
          <p className="kade-eyebrow">Sana özel</p>
          <h2 className="mt-3 text-xl font-light tracking-tight text-zinc-100">
            Paketlerden hiçbiri tam oturmuyorsa
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Ekip büyüklüğünü, kullanım ihtiyacını ve istediğin özellikleri anlat;
            sana özel bir paket ve fiyat hazırlayalım.
          </p>
          <Link
            href={withBasePath('/dashboard/quote')}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f2c322] px-5 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Teklif al
          </Link>
        </section>
      </div>
    </div>
  )
}
