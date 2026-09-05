'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn, getPlatformLabel } from '@/lib/utils'
import type { Platform } from '@/types'

interface Slide { no: number; tip: string; baslik: string; metin: string; emoji: string; gorsel_oner: string }
interface Carousel { baslik: string; slayts: Slide[]; caption: string; hashtags: string[] }

const tipColors: Record<string, string> = {
  hook: 'border-violet-500/50 bg-violet-500/5',
  bilgi: 'border-blue-500/50 bg-blue-500/5',
  liste: 'border-amber-500/50 bg-amber-500/5',
  ornek: 'border-emerald-500/50 bg-emerald-500/5',
  istatistik: 'border-cyan-500/50 bg-cyan-500/5',
  cta: 'border-red-500/50 bg-red-500/5',
}

export default function CarouselPage() {
  const { selectedModel } = useModel()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [slideCount, setSlideCount] = useState(7)
  const [tone, setTone] = useState('bilgilendirici')
  const [loading, setLoading] = useState(false)
  const [carousel, setCarousel] = useState<Carousel | null>(null)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true); setError(''); setCarousel(null); setActiveSlide(0)
    try {
      const res = await apiFetch('/api/generate/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, slideCount, tone, model: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCarousel(data.carousel)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Carousel İçeriği" description="Instagram ve LinkedIn için slayt bazlı içerik üret" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Konu</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
                  placeholder="Örn: Sabah rutini ile verimliliği 2x artır"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['instagram', 'linkedin'] as Platform[]).map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-2 rounded-lg text-xs font-medium transition-colors border',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700')}>
                      {getPlatformLabel(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Ton</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {['bilgilendirici', 'ilham verici', 'eğlenceli', 'satış odaklı', 'hikaye anlatımı'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Slayt sayısı: {slideCount}</label>
                <input type="range" min={5} max={12} value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
              <button type="submit" disabled={loading || !topic.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Üretiliyor...' : 'Carousel Üret'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {carousel && !loading && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm font-medium">{carousel.baslik}</p>
                {/* Slide navigator */}
                <div className="flex gap-1.5 flex-wrap">
                  {carousel.slayts?.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                        activeSlide === i ? 'bg-[#f2c322] text-zinc-950' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                {/* Active slide preview */}
                {carousel.slayts?.[activeSlide] && (() => {
                  const s = carousel.slayts[activeSlide]
                  return (
                    <div className={cn('rounded-2xl border-2 p-6 min-h-48 flex flex-col justify-between', tipColors[s.tip] || 'border-zinc-700/50 bg-zinc-800/50')}>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-zinc-500 text-xs">{s.no} / {carousel.slayts.length}</span>
                          <span className="text-2xl">{s.emoji}</span>
                        </div>
                        <h3 className="text-zinc-100 font-bold text-lg mb-2">{s.baslik}</h3>
                        <p className="text-zinc-300 text-sm leading-relaxed">{s.metin}</p>
                      </div>
                      <p className="text-zinc-600 text-xs mt-4 italic">{s.gorsel_oner}</p>
                    </div>
                  )
                })()}
                {/* All slides list */}
                <div className="space-y-2">
                  {carousel.slayts?.map((s, i) => (
                    <div key={i} onClick={() => setActiveSlide(i)}
                      className={cn('rounded-lg border p-3 cursor-pointer transition-colors', i === activeSlide ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600')}>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-600 text-xs font-mono">{s.no}.</span>
                        <span className="text-zinc-300 text-xs font-medium flex-1 truncate">{s.emoji} {s.baslik}</span>
                        <span className="text-zinc-600 text-[10px]">{s.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {carousel.caption && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-500 text-xs font-semibold mb-2">Caption</p>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{carousel.caption}</p>
                    {carousel.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">{carousel.hashtags.map((h, i) => <span key={i} className="text-violet-400 text-xs">{h}</span>)}</div>
                    )}
                  </div>
                )}
              </div>
            )}
            {!carousel && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Konu gir ve carousel üret</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
