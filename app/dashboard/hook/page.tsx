'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import { cn, collectSettledResults } from '@/lib/utils'

type HookFormat = 'reels' | 'shorts' | 'tiktok' | 'youtube'

interface HookItem { hook: string; tip: string; neden: string }
interface FormatResult { format: HookFormat; hooks: HookItem[] }

const formats: { id: HookFormat; label: string }[] = [
  { id: 'reels',   label: 'Instagram Reels' },
  { id: 'tiktok',  label: 'TikTok' },
  { id: 'shorts',  label: 'YouTube Shorts' },
  { id: 'youtube', label: 'YouTube Video' },
]

const tipColors: Record<string, string> = {
  merak: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  soru: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  şok: 'bg-red-500/15 text-red-300 border-red-500/25',
  istatistik: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  hikaye: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  genel: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/25',
}

export default function HookPage() {
  const { selectedModel } = useModel()
  const [topic, setTopic]       = useState('')
  const [selectedFormats, setSelectedFormats] = useState<HookFormat[]>(['reels'])
  const [niche, setNiche]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<FormatResult[]>([])
  const [error, setError]       = useState('')

  const toggleFormat = (f: HookFormat) =>
    setSelectedFormats(prev => prev.includes(f) ? (prev.length > 1 ? prev.filter(x => x !== f) : prev) : [...prev, f])

  const generateFor = async (format: HookFormat): Promise<FormatResult> => {
    const res = await apiFetch('/api/generate/hook', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, format, niche, model: selectedModel }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return { format, hooks: data.hooks }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !niche.trim()) return
    setLoading(true); setError(''); setResults([])
    try {
      const settled = await Promise.allSettled(selectedFormats.map(generateFor))
      const { values, failureMessage } = collectSettledResults(settled)
      if (!values.length) throw new Error(failureMessage || 'Hook üretilemedi.')
      setResults(values)
      if (failureMessage) setError(failureMessage)
    } catch (err) { setError(err instanceof Error ? err.message : 'Hata oluştu') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Hook Jeneratörü" description="İlk 3 saniyede izleyiciyi tutan açılış cümleleri" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Video Konusu</label>
                <textarea value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Örn: Sabah rutini ile hayatım değişti" rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  Format <span className="text-zinc-600">(çoklu seçim)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {formats.map(f => (
                    <button key={f.id} type="button" onClick={() => toggleFormat(f.id)}
                      className={cn('py-2 px-3 rounded-lg text-xs font-medium transition-colors text-left',
                        selectedFormats.includes(f.id)
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche</label>
                <input value={niche} onChange={e => setNiche(e.target.value)}
                  placeholder="Örn: teknoloji, fitness, yemek"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>

              <div className="space-y-2">
                <button type="submit" disabled={loading || !topic.trim() || !niche.trim()}
                  className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                  {loading ? 'Üretiliyor...' : `${selectedFormats.length} Format İçin Hook Üret`}
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}

            {results.length > 0 && !loading && (
              <div className={cn('grid gap-6', results.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
                {results.map(r => (
                  <div key={r.format}>
                    <p className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-3">
                      {formats.find(f => f.id === r.format)?.label}
                    </p>
                    <div className="space-y-3">
                      {r.hooks.map((item, i) => (
                        <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-zinc-100 text-sm leading-relaxed font-medium flex-1">{item.hook}</p>
                            <span className={cn('flex-shrink-0 text-xs px-2 py-0.5 rounded-md border capitalize', tipColors[item.tip] || tipColors.genel)}>
                              {item.tip}
                            </span>
                          </div>
                          <p className="text-zinc-500 text-xs">{item.neden}</p>
                          <CopyButton text={item.hook} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Konuyu gir, format seç, hook üret
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
