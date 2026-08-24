'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface Opportunity { firsat: string; nasil_kullan: string; oncelik: string }
interface Analysis { rakip_profili: Record<string, unknown>; icerik_stratejisi: Record<string, unknown>; guclu_yonler: string[]; zayif_yonler: string[]; fırsatlar: Opportunity[]; farklilasma_stratejisi: string; hemen_uygulanabilir: string[] }

export default function CompetitorPage() {
  const { selectedModel } = useModel()
  const [competitorInfo, setCompetitorInfo] = useState('')
  const [myNiche, setMyNiche] = useState('')
  const [myPlatform, setMyPlatform] = useState('youtube')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Analysis | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/competitor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitorInfo, myNiche, myPlatform, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.analysis)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Rakip Analizi" description="Rakip strateji analizi ve fırsat tespiti" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Benim Niche'm</label>
                <input value={myNiche} onChange={(e) => setMyNiche(e.target.value)} placeholder="Teknoloji, finans..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['youtube', 'instagram', 'tiktok', 'linkedin'].map((p) => (
                    <button key={p} type="button" onClick={() => setMyPlatform(p)}
                      className={cn('py-1.5 rounded-lg text-xs capitalize border transition-colors',
                        myPlatform === p ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Rakip Bilgisi</label>
                <textarea value={competitorInfo} onChange={(e) => setCompetitorInfo(e.target.value)} rows={6}
                  placeholder="Rakip kanal adı, URL, içerik tipi, abone sayısı, ne hakkında içerik yapıyor gibi bilgileri gir..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button type="submit" disabled={loading || !competitorInfo.trim() || !myNiche.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Analiz ediliyor...' : 'Rakibi Analiz Et'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">Güçlü Yönleri</p>
                    <ul className="space-y-1">{data.guclu_yonler?.map((g, i) => <li key={i} className="text-zinc-300 text-xs flex gap-1.5"><span className="text-emerald-500">✓</span>{g}</li>)}</ul>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-red-400 text-xs font-semibold mb-2">Zayıf Yönleri</p>
                    <ul className="space-y-1">{data.zayif_yonler?.map((z, i) => <li key={i} className="text-zinc-300 text-xs flex gap-1.5"><span className="text-red-500">✗</span>{z}</li>)}</ul>
                  </div>
                </div>
                {data.farklilasma_stratejisi && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                    <p className="text-violet-400 text-xs font-semibold mb-2">Farklılaşma Stratejisi</p>
                    <p className="text-zinc-300 text-sm">{data.farklilasma_stratejisi}</p>
                  </div>
                )}
                {data.fırsatlar?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-xs font-semibold">Fırsatlar</p>
                    {data.fırsatlar.map((f, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-zinc-200 text-sm font-medium">{f.firsat}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ml-2', f.oncelik === 'yüksek' ? 'bg-emerald-500/20 text-emerald-300' : f.oncelik === 'orta' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-700 text-zinc-400')}>{f.oncelik}</span>
                        </div>
                        <p className="text-zinc-500 text-xs">{f.nasil_kullan}</p>
                      </div>
                    ))}
                  </div>
                )}
                {data.hemen_uygulanabilir?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Hemen Uygula</p>
                    <ol className="space-y-1">{data.hemen_uygulanabilir.map((a, i) => <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-amber-500 font-bold">{i + 1}.</span>{a}</li>)}</ol>
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Rakip bilgisi gir ve analiz et</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
