'use client'

/*
 * Panel planı: dönem seçici → toplam maliyet/gelir/marj kartları →
 * model kırılımı → paket kırılımı → en çok harcayan kullanıcılar →
 * fiyat tablosu şeffaflığı. Yalnız hesap sahibi görür (proxy + handler).
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Coins, Cpu, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'

interface Bucket {
  key: string
  tokens: number
  costUsd: number
  costKnown: boolean
  requests: number
}

interface UsageReport {
  available: boolean
  reason?: string
  windowDays?: number
  totals?: {
    requests: number
    byokRequests: number
    unpricedRequests: number
    totalTokens: number
    totalCostUsd: number
    costTryMinor: number | null
    revenueTryMinor: number
    paidOrders: number
  }
  margin?: {
    available: boolean
    grossMarginPercent: number | null
    usdTryRate: number | null
    reason: string | null
  }
  byUser?: Bucket[]
  byModel?: Bucket[]
  byTier?: Bucket[]
  revenueByProduct?: Array<{ key: string; amountMinor: number }>
  rates?: Array<{ model: string; in: number; out: number }>
  ratesReviewedAt?: string
}

const WINDOWS = [7, 30, 90] as const

const TIER_LABEL: Record<string, string> = {
  free: 'Paketsiz',
  baslangic: 'Başlangıç',
  pro: 'Pro',
  sinirsiz: 'Sınırsız',
}

function tryFromMinor(minor: number) {
  return (minor / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })
}

function usd(value: number) {
  return `$${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function tokens(value: number) {
  return value.toLocaleString('tr-TR')
}

export default function CostPanel() {
  const [days, setDays] = useState<number>(30)
  const [report, setReport] = useState<UsageReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (windowDays: number) => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch(`/api/admin/usage?days=${windowDays}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Maliyet verileri okunamadı.')
      setReport(data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Maliyet verileri okunamadı.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(days) }, [days, load])

  const totals = report?.totals
  const margin = report?.margin

  return (
    <div className="space-y-5">

          <div className="flex flex-wrap items-center gap-2">
            {WINDOWS.map((value) => (
              <button
                key={value}
                onClick={() => setDays(value)}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${days === value ? 'bg-violet-500 text-white' : 'border border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}
              >
                Son {value} gün
              </button>
            ))}
            <button
              onClick={() => void load(days)}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition hover:text-zinc-100"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Yenile
            </button>
          </div>

          {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          {loading && <p className="text-sm text-zinc-500">Maliyet defteri okunuyor…</p>}

          {!loading && report && !report.available && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">Kullanım defteri henüz etkin değil</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">{report.reason}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && totals && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card icon={<Coins className="h-4 w-4 text-amber-400" />} label="AI maliyeti" value={usd(totals.totalCostUsd)} hint={`${tokens(totals.totalTokens)} token · ${totals.requests} çağrı`} />
                <Card icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} label="Gelir" value={tryFromMinor(totals.revenueTryMinor)} hint={`${totals.paidOrders} ödenmiş sipariş`} />
                <Card
                  icon={<TrendingUp className="h-4 w-4 text-violet-400" />}
                  label="Brüt marj"
                  value={margin?.available && margin.grossMarginPercent !== null ? `%${margin.grossMarginPercent}` : '—'}
                  hint={margin?.available ? `Kur: ${margin.usdTryRate} ₺/$` : margin?.reason || ''}
                />
                <Card icon={<Cpu className="h-4 w-4 text-sky-400" />} label="Kendi anahtarı (BYOK)" value={String(totals.byokRequests)} hint={`${totals.unpricedRequests} çağrının fiyatı bilinmiyor`} />
              </div>

              {totals.unpricedRequests > 0 && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">
                  {totals.unpricedRequests} çağrının modeli fiyat tablosunda yok. Maliyet olduğundan
                  düşük görünüyor; eksik modeller için <code className="font-mono">AI_MODEL_RATES_JSON</code> tanımlanabilir.
                </div>
              )}

              <Table title="Model başına maliyet" icon={<Cpu className="h-4 w-4" />} rows={report.byModel || []} />
              <Table title="Paket başına maliyet" icon={<Coins className="h-4 w-4" />} rows={(report.byTier || []).map((row) => ({ ...row, key: TIER_LABEL[row.key] || row.key }))} />
              <Table title="Kullanıcı başına maliyet" icon={<Users className="h-4 w-4" />} rows={(report.byUser || []).slice(0, 20)} mono />

              <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">Fiyat tablosu</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Elle bakımlı; son gözden geçirme {report.ratesReviewedAt}. Sağlayıcı fiyat sayfalarıyla
                  doğrulanmalıdır — bu değerler yalnızca tahmini maliyet içindir, fatura kaynağı değildir.
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead className="text-zinc-500">
                      <tr><th className="pb-2 font-medium">Model</th><th className="pb-2 font-medium">Girdi $/1M</th><th className="pb-2 font-medium">Çıktı $/1M</th></tr>
                    </thead>
                    <tbody className="text-zinc-300">
                      {(report.rates || []).map((rate) => (
                        <tr key={rate.model} className="border-t border-zinc-800/70">
                          <td className="py-1.5 font-mono">{rate.model}</td>
                          <td className="py-1.5">{rate.in}</td>
                          <td className="py-1.5">{rate.out}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
    </div>
  )
}

function Card({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center gap-2 text-xs text-zinc-500">{icon}{label}</div>
      <p className="mt-2 text-xl font-semibold text-zinc-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function Table({ title, icon, rows, mono }: { title: string; icon: React.ReactNode; rows: Bucket[]; mono?: boolean }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">{icon}{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">Bu aralıkta kayıt yok.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Ad</th>
                <th className="pb-2 font-medium">Çağrı</th>
                <th className="pb-2 font-medium">Token</th>
                <th className="pb-2 font-medium">Maliyet</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-zinc-800/70">
                  <td className={`py-1.5 ${mono ? 'font-mono' : ''}`}>{row.key}</td>
                  <td className="py-1.5">{row.requests}</td>
                  <td className="py-1.5">{tokens(row.tokens)}</td>
                  <td className="py-1.5">
                    {usd(row.costUsd)}
                    {!row.costKnown && <span className="ml-1 text-amber-400" title="Bazı çağrıların fiyatı bilinmiyor">*</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
