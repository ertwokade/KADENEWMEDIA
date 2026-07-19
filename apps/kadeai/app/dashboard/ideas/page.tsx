'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'
import { withBasePath } from '@/lib/appConfig'

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin']
const styles = ['karışık', 'eğitici', 'eğlenceli', 'motivasyonel', 'hikaye anlatımı', 'liste', 'challenge']
const counts = [10, 20, 30]

interface Idea {
  baslik: string
  aciklama: string
  tip: 'trend' | 'evergreen' | 'mevsimsel'
  viral_neden: string
  zorluk: 'kolay' | 'orta' | 'zor'
}

const tipColors = {
  trend:     'bg-red-500/15 text-red-300 border-red-500/25',
  evergreen: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  mevsimsel: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
}

const zorlukColors = {
  kolay: 'text-emerald-400',
  orta:  'text-amber-400',
  zor:   'text-red-400',
}

export default function IdeasPage() {
  const { selectedModel } = useModel()
  const [niche, setNiche]           = useState('')
  const [platform, setPlatform]     = useState<Platform>('youtube')
  const [style, setStyle]           = useState('karışık')
  const [count, setCount]           = useState(20)
  const [loading, setLoading]       = useState(false)
  const [ideas, setIdeas]           = useState<Idea[]>([])
  const [error, setError]           = useState('')
  const [filter, setFilter]         = useState<string>('tümü')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!niche.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, platform, model: selectedModel, count, style }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIdeas(data.ideas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const sendToTitle = (idea: Idea) => {
    localStorage.setItem('contentai_idea_topic', idea.baslik)
    window.location.href = withBasePath('/dashboard/title')
  }

  const filtered = filter === 'tümü' ? ideas : ideas.filter((i) => i.tip === filter || i.zorluk === filter)

  const allText = ideas.map((i, n) => `${n + 1}. ${i.baslik}\n   ${i.aciklama}`).join('\n\n')

  return (
    <div className="flex flex-col h-full">
      <TopBar title="İçerik Fikirleri" description="Niche ve platforma göre viral içerik fikirleri üret" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          {/* Form */}
          <div className="w-72 flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche / Konu Alanı</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Örn: kişisel finans, fitness, yazılım, yemek"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-2">Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {platforms.map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-1.5 px-2 rounded-lg text-xs font-medium transition-colors',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {getPlatformLabel(p)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-2">İçerik Stili</label>
                <div className="flex flex-wrap gap-1.5">
                  {styles.map((s) => (
                    <button key={s} type="button" onClick={() => setStyle(s)}
                      className={cn('py-1 px-2.5 rounded-full text-xs font-medium transition-colors',
                        style === s ? 'bg-violet-500/20 text-violet-300'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-2">Fikir Sayısı</label>
                <div className="flex gap-2">
                  {counts.map((c) => (
                    <button key={c} type="button" onClick={() => setCount(c)}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                        count === c ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || !niche.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Fikirler üretiliyor...' : `${count} Fikir Üret`}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-3">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}

            {ideas.length > 0 && !loading && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-1.5">
                    {['tümü', 'trend', 'evergreen', 'mevsimsel', 'kolay', 'orta', 'zor'].map((f) => (
                      <button key={f} onClick={() => setFilter(f)}
                        className={cn('px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                          filter === f ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-500 hover:text-zinc-300')}>
                        {f}
                      </button>
                    ))}
                  </div>
                  <CopyButton text={allText} />
                </div>

                <div className="grid gap-2">
                  {filtered.map((idea, i) => (
                    <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2 group">
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-600 text-xs mt-0.5 w-5 flex-shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-100 text-sm font-medium leading-snug">{idea.baslik}</p>
                          <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{idea.aciklama}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full border capitalize', tipColors[idea.tip] || tipColors.evergreen)}>
                            {idea.tip}
                          </span>
                          <span className={cn('text-xs font-medium capitalize', zorlukColors[idea.zorluk] || 'text-zinc-400')}>
                            {idea.zorluk}
                          </span>
                        </div>
                      </div>
                      <p className="text-zinc-600 text-xs italic pl-7">{idea.viral_neden}</p>
                      <div className="flex gap-2 pl-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => sendToTitle(idea)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors">
                          Başlık Üret →
                        </button>
                        <CopyButton text={idea.baslik} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loading && ideas.length === 0 && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Niche'ini gir ve fikirler üret butonuna tıkla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
