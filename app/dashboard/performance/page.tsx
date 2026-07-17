'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import RawModelOutput from '@/components/ui/RawModelOutput'

interface PerformanceResult {
  genel_skor: number
  tahminler: Record<string, string>
  a_b_alternatifleri: Array<{ A: string; B: string; aciklama: string }>
  optimizasyon_onerileri: string[]
  raw?: string
}

export default function PerformancePage() {
  const { selectedModel } = useModel()
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('youtube')
  const [niche, setNiche] = useState('')
  const [thumbnailDesc, setThumbnailDesc] = useState('')
  const [contentDesc, setContentDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PerformanceResult | null>(null)
  const [error, setError] = useState('')
  const [copiedAlt, setCopiedAlt] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, platform, niche, thumbnailDesc, contentDesc, model: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
  const ringColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Performans Tahmini" description="İçeriğinin tahmini performansını analiz et" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Başlık</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Video veya içerik başlığı..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['youtube', 'instagram', 'tiktok', 'linkedin'].map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-1.5 px-2 rounded-lg text-xs font-medium transition-colors capitalize',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niş</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Kanal veya içerik niş alanı..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Thumbnail Açıklaması <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={thumbnailDesc} onChange={(e) => setThumbnailDesc(e.target.value)}
                  placeholder="Thumbnail tasarımını açıkla..." rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik Açıklaması <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={contentDesc} onChange={(e) => setContentDesc(e.target.value)}
                  placeholder="İçerik hakkında kısa bilgi..." rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button type="submit" disabled={loading || !title.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Analiz ediliyor...' : 'Performans Analiz Et'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {result && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={result.raw} />
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6 flex items-center gap-6">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={ringColor(result.genel_skor)} strokeWidth="3"
                        strokeDasharray={`${result.genel_skor} ${100 - result.genel_skor}`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn('text-lg font-bold', scoreColor(result.genel_skor))}>{result.genel_skor}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-zinc-200 font-semibold">Genel Performans Skoru</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">100 puan üzerinden tahminî değerlendirme</p>
                  </div>
                </div>
                {result.tahminler && (
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(result.tahminler).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3 text-center">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="text-zinc-100 text-sm font-bold">{val}</p>
                      </div>
                    ))}
                  </div>
                )}
                {result.a_b_alternatifleri?.length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-3">A/B Test Alternatifleri</p>
                    <div className="space-y-3">
                      {result.a_b_alternatifleri.map((ab, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <div className="bg-zinc-900/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-400 text-[10px] font-bold">A</span>
                              <button onClick={async () => { await copyToClipboard(ab.A); setCopiedAlt(`A-${i}`); setTimeout(() => setCopiedAlt(null), 2000) }}
                                className="text-zinc-600 hover:text-violet-400 transition-colors">
                                {copiedAlt === `A-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="text-zinc-200 text-xs">{ab.A}</p>
                          </div>
                          <div className="bg-zinc-900/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-emerald-400 text-[10px] font-bold">B</span>
                              <button onClick={async () => { await copyToClipboard(ab.B); setCopiedAlt(`B-${i}`); setTimeout(() => setCopiedAlt(null), 2000) }}
                                className="text-zinc-600 hover:text-violet-400 transition-colors">
                                {copiedAlt === `B-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <p className="text-zinc-200 text-xs">{ab.B}</p>
                          </div>
                          {ab.aciklama && <p className="col-span-2 text-zinc-500 text-[10px] italic">{ab.aciklama}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.optimizasyon_onerileri?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Optimizasyon Önerileri</p>
                    <ul className="space-y-1.5">
                      {result.optimizasyon_onerileri.map((tip, i) => (
                        <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-amber-400">→</span>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!loading && !result && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Başlık gir ve performans analizi yap
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
