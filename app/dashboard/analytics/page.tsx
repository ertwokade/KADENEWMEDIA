'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import RawModelOutput from '@/components/ui/RawModelOutput'

interface MetricInput { label: string; key: string; placeholder: string; suffix: string }
const metrics: MetricInput[] = [
  { label: 'Takipçi / Abone', key: 'followers', placeholder: '10000', suffix: '' },
  { label: 'Ortalama Görüntüleme', key: 'avg_views', placeholder: '1500', suffix: '' },
  { label: 'Etkileşim Oranı', key: 'engagement_rate', placeholder: '3.5', suffix: '%' },
  { label: 'Aylık Büyüme', key: 'monthly_growth', placeholder: '2.1', suffix: '%' },
  { label: 'Tıklama Oranı (CTR)', key: 'ctr', placeholder: '4.2', suffix: '%' },
  { label: 'Ortalama İzlenme Süresi', key: 'avg_watch_time', placeholder: '65', suffix: '%' },
  { label: 'Toplam İçerik Sayısı', key: 'total_content', placeholder: '48', suffix: '' },
  { label: 'Paylaşım / Kaydetme', key: 'shares', placeholder: '120', suffix: '' },
]

interface InsightData { genel_durum: string; guclu_metrikler: Array<{ metrik: string; yorum: string }>; iyilestirme_alanlari: Array<{ metrik: string; sorun: string; oneri: string }>; oncelikli_aksiyonlar: string[]; hedef_metrikler: Record<string, string>; buyume_stratejisi: string; icerik_stratejisi: string; raw?: string }

export default function AnalyticsPage() {
  const { selectedModel } = useModel()
  const [platform, setPlatform] = useState('youtube')
  const [niche, setNiche] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<InsightData | null>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    if (!niche.trim()) return
    setLoading(true); setError(''); setData(null)

    try {
      const res = await apiFetch('/api/generate/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          niche,
          metrics: values,
          model: selectedModel,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.analysis)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const getMetricStatus = (key: string): 'good' | 'warn' | 'bad' | 'neutral' => {
    const v = parseFloat(values[key] || '0')
    if (key === 'engagement_rate') return v >= 4 ? 'good' : v >= 2 ? 'warn' : 'bad'
    if (key === 'ctr') return v >= 5 ? 'good' : v >= 3 ? 'warn' : 'bad'
    if (key === 'avg_watch_time') return v >= 50 ? 'good' : v >= 30 ? 'warn' : 'bad'
    if (key === 'monthly_growth') return v >= 3 ? 'good' : v >= 1 ? 'warn' : 'bad'
    return 'neutral'
  }

  const statusIcon = { good: <TrendingUp className="w-3 h-3 text-emerald-400" />, warn: <Minus className="w-3 h-3 text-amber-400" />, bad: <TrendingDown className="w-3 h-3 text-red-400" />, neutral: null }
  const statusColor = { good: 'border-emerald-500/30', warn: 'border-amber-500/30', bad: 'border-red-500/30', neutral: 'border-zinc-700/50' }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Analitik Dashboard" description="Metriklerini gir, AI performans önerileri üret" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['youtube', 'instagram', 'tiktok', 'linkedin', 'x', 'pinterest'].map((p) => (
                  <button key={p} type="button" onClick={() => setPlatform(p)}
                    className={cn('py-1.5 rounded-lg text-xs capitalize border transition-colors',
                      platform === p ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche</label>
              <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Teknoloji, finans..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
            </div>
            {/* Metrik girişleri */}
            <div className="space-y-2">
              {metrics.map((m) => {
                const status = values[m.key] ? getMetricStatus(m.key) : 'neutral'
                return (
                  <div key={m.key} className={cn('rounded-lg border bg-zinc-800/50 px-3 py-2', statusColor[status])}>
                    <label className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                      {m.label}
                      {statusIcon[status]}
                    </label>
                    <div className="flex items-center gap-1">
                      <input value={values[m.key] || ''} onChange={(e) => setValues(v => ({ ...v, [m.key]: e.target.value }))}
                        placeholder={m.placeholder} type="number" step="any"
                        className="flex-1 bg-transparent text-zinc-200 text-sm focus:outline-none placeholder:text-zinc-700 w-full" />
                      {m.suffix && <span className="text-zinc-500 text-xs">{m.suffix}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={handleAnalyze} disabled={loading || !niche.trim()}
              className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
              {loading ? 'Analiz ediliyor...' : 'Metrikleri Analiz Et'}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={data.raw} />
                {data.genel_durum && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-violet-400 text-xs font-semibold mb-1">Genel Durum</p>
                    <p className="text-zinc-300 text-sm">{data.genel_durum}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {data.guclu_metrikler?.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-emerald-400 text-xs font-semibold mb-2">Güçlü Metrikler</p>
                      {data.guclu_metrikler.map((g, i) => (
                        <div key={i} className="mb-2">
                          <p className="text-zinc-300 text-xs font-medium">{g.metrik}</p>
                          <p className="text-zinc-500 text-xs">{g.yorum}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.hedef_metrikler && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <p className="text-amber-400 text-xs font-semibold mb-2">Hedef Metrikler</p>
                      {Object.entries(data.hedef_metrikler).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-500">{k}</span>
                          <span className="text-zinc-200 font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {data.oncelikli_aksiyonlar?.length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-2">Öncelikli Aksiyonlar</p>
                    <ol className="space-y-1">{data.oncelikli_aksiyonlar.map((a, i) => <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-violet-400 font-bold">{i + 1}.</span>{a}</li>)}</ol>
                  </div>
                )}
                {data.iyilestirme_alanlari?.length > 0 && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <p className="text-rose-400 text-xs font-semibold mb-2">İyileştirme Alanları</p>
                    <div className="space-y-3">
                      {data.iyilestirme_alanlari.map((item, index) => (
                        <div key={`${item.metrik}-${index}`}>
                          <p className="text-zinc-200 text-xs font-medium">{item.metrik}</p>
                          <p className="text-zinc-500 text-xs">{item.sorun}</p>
                          <p className="text-zinc-300 text-xs mt-1">→ {item.oneri}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.buyume_stratejisi && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-1">30 Günlük İyileştirme Planı</p>
                    <p className="text-zinc-300 text-sm">{data.buyume_stratejisi}</p>
                  </div>
                )}
                {data.icerik_stratejisi && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-1">İçerik Önerisi</p>
                    <p className="text-zinc-300 text-sm">{data.icerik_stratejisi}</p>
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Metriklerini gir ve AI analizi al</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
