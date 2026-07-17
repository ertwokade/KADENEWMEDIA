'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import CopyButton from '@/components/ui/CopyButton'
import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin']

interface ScoreResult {
  title: string
  score: number
  guclu: string[]
  zayif: string[]
  kazanan: boolean
}

export default function ABTestPage() {
  const { selectedModel } = useModel()
  const [titleA, setTitleA]     = useState('')
  const [titleB, setTitleB]     = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState<ScoreResult[]>([])
  const [error, setError]       = useState('')

  const scoreTitle = async (title: string): Promise<ScoreResult> => {
    const res = await apiFetch('/api/generate/viral-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, model: selectedModel }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    const a = data.analysis
    const score = a.toplam_puan ?? 0
    const guclu = a.guclu_yonler ?? []
    const zayif = a.iyilestirme_onerileri ?? []
    return { title, score, guclu, zayif, kazanan: false }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleA.trim() || !titleB.trim()) return
    setLoading(true)
    setError('')
    try {
      const [rA, rB] = await Promise.all([scoreTitle(titleA), scoreTitle(titleB)])
      const winner = rA.score >= rB.score ? 'A' : 'B'
      rA.kazanan = winner === 'A'
      rB.kazanan = winner === 'B'
      setResults([rA, rB])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const diff = results.length === 2 ? Math.abs(results[0].score - results[1].score) : 0

  return (
    <div className="flex flex-col h-full">
      <TopBar title="A/B Başlık Testi" description="İki başlığı karşılaştır, hangisi daha viral?" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  <span className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded text-xs mr-2">A</span>
                  Başlık A
                </label>
                <input value={titleA} onChange={(e) => setTitleA(e.target.value)}
                  placeholder="Birinci başlık..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-xs mr-2">B</span>
                  Başlık B
                </label>
                <input value={titleB} onChange={(e) => setTitleB(e.target.value)}
                  placeholder="İkinci başlık..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {platforms.map((p) => (
                  <button key={p} type="button" onClick={() => setPlatform(p)}
                    className={cn('py-1.5 px-3 rounded-lg text-xs font-medium transition-colors',
                      platform === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                    {getPlatformLabel(p)}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button type="submit" disabled={loading || !titleA.trim() || !titleB.trim()}
                className="px-6 py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                {loading ? 'Karşılaştırılıyor...' : 'Test Et'}
              </button>
            </div>
          </form>

          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
          {loading && (
            <div className="space-y-2">
              <LoadingState model={selectedModel} />
              <p className="text-zinc-600 text-xs text-center">İki başlık için viral skor analizi yapılıyor...</p>
            </div>
          )}

          {results.length === 2 && !loading && (
            <>
              {/* Winner banner */}
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 text-center">
                <p className="text-zinc-400 text-xs mb-1">Kazanan Başlık</p>
                <p className="text-violet-300 font-semibold text-base">{results.find((r) => r.kazanan)?.title}</p>
                <p className="text-zinc-500 text-xs mt-1">{diff} puan fark ile öne çıkıyor</p>
              </div>

              {/* Side by side */}
              <div className="grid grid-cols-2 gap-4">
                {results.map((r, i) => (
                  <div key={i} className={cn('rounded-xl border p-5 space-y-4',
                    r.kazanan ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700/50 bg-zinc-800/50')}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded',
                          i === 0 ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300')}>
                          {i === 0 ? 'A' : 'B'}
                        </span>
                        {r.kazanan && <span className="ml-2 text-xs text-emerald-400 font-medium">✓ Kazanan</span>}
                      </div>
                      <CopyButton text={r.title} />
                    </div>

                    <p className="text-zinc-200 text-sm font-medium leading-snug">{r.title}</p>

                    {/* Score */}
                    <div className="flex items-center gap-3">
                      <span className={cn('text-3xl font-bold',
                        r.score >= 80 ? 'text-emerald-400' : r.score >= 60 ? 'text-amber-400' : 'text-red-400')}>
                        {r.score}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full',
                            r.score >= 80 ? 'bg-emerald-500' : r.score >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                            style={{ width: `${r.score}%` }} />
                        </div>
                        <p className="text-zinc-600 text-xs mt-0.5">/ 100</p>
                      </div>
                    </div>

                    {r.guclu.length > 0 && (
                      <div>
                        <p className="text-emerald-400 text-xs font-medium mb-1">Güçlü</p>
                        <ul className="space-y-0.5">
                          {r.guclu.slice(0, 2).map((g, gi) => (
                            <li key={gi} className="text-zinc-400 text-xs flex gap-1.5">
                              <span className="text-emerald-500 flex-shrink-0">+</span>{g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.zayif.length > 0 && (
                      <div>
                        <p className="text-amber-400 text-xs font-medium mb-1">Geliştirilecek</p>
                        <ul className="space-y-0.5">
                          {r.zayif.slice(0, 2).map((z, zi) => (
                            <li key={zi} className="text-zinc-400 text-xs flex gap-1.5">
                              <span className="text-amber-500 flex-shrink-0">→</span>{z}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="flex items-center justify-center h-48 text-zinc-600 text-sm">
              İki başlık gir ve test et butonuna tıkla
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
