'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface Trend { konu: string; neden_trend: string; aciliyet: string; icerik_fikri: string; zorluk: string }
interface Rising { konu: string; potansiyel: string; tahmini_pik: string; icerik_fikri: string }
interface FormatTrend { format: string; aciklama: string; ornek: string }
interface TrendsData { sicak_trendler: Trend[]; yukselenler: Rising[]; format_trendleri: FormatTrend[]; evergreen_firsatlar: string[]; strateji_ozeti: string }

const aciliyetColors: Record<string, string> = { hemen: 'bg-red-500/20 text-red-300', bu_hafta: 'bg-amber-500/20 text-amber-300', bu_ay: 'bg-blue-500/20 text-blue-300' }
const zorColors: Record<string, string> = { kolay: 'text-emerald-400', orta: 'text-amber-400', zor: 'text-red-400' }

export default function TrendsPage() {
  const { selectedModel } = useModel()
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [region, setRegion] = useState('Türkiye / Türkçe')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TrendsData | null>(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'sicak' | 'yukselenler' | 'format' | 'evergreen'>('sicak')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/trends', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platform, region, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.trends)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Trend Bulucu" description="Niche'ine göre güncel trend ve içerik fırsatları" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Teknoloji, finans, sağlık..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
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
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Bölge / Dil</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {['Türkiye / Türkçe', 'Global / İngilizce', 'Almanya / Almanca', 'MENA / Arapça'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading || !niche.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Analiz ediliyor...' : 'Trendleri Bul'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                {data.strateji_ozeti && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-violet-400 text-xs font-semibold mb-1">Bu Ayki Strateji</p>
                    <p className="text-zinc-300 text-sm">{data.strateji_ozeti}</p>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {([['sicak', 'Sıcak Trendler'], ['yukselenler', 'Yükselenler'], ['format', 'Format Trendleri'], ['evergreen', 'Evergreen']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        tab === k ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      {l}
                    </button>
                  ))}
                </div>
                {tab === 'sicak' && (
                  <div className="space-y-3">
                    {data.sicak_trendler?.map((t, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-zinc-100 font-semibold text-sm">{t.konu}</h3>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded', aciliyetColors[t.aciliyet] || 'bg-zinc-700 text-zinc-400')}>{t.aciliyet?.replace('_', ' ')}</span>
                            <span className={cn('text-[10px] font-medium', zorColors[t.zorluk] || 'text-zinc-400')}>{t.zorluk}</span>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-xs mb-2">{t.neden_trend}</p>
                        <p className="text-violet-300 text-xs">→ {t.icerik_fikri}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'yukselenler' && (
                  <div className="space-y-3">
                    {data.yukselenler?.map((t, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-zinc-100 text-sm font-semibold">{t.konu}</h3>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded', t.potansiyel === 'yüksek' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>{t.potansiyel}</span>
                        </div>
                        <p className="text-zinc-600 text-xs mb-2">Pik: {t.tahmini_pik}</p>
                        <p className="text-violet-300 text-xs">→ {t.icerik_fikri}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'format' && (
                  <div className="space-y-3">
                    {data.format_trendleri?.map((f, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <h3 className="text-zinc-100 text-sm font-semibold mb-1">{f.format}</h3>
                        <p className="text-zinc-400 text-xs mb-2">{f.aciklama}</p>
                        <p className="text-zinc-600 text-xs italic">Örnek: {f.ornek}</p>
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'evergreen' && (
                  <div className="space-y-2">
                    {data.evergreen_firsatlar?.map((f, i) => (
                      <div key={i} className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-4 py-3 flex gap-3">
                        <span className="text-emerald-500">♾</span>
                        <span className="text-zinc-300 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Niche gir ve trendleri keşfet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
