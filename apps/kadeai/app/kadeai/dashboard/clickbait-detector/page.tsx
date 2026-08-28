'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { AIModel } from '@/types'
import { cn, collectSettledResults, copyToClipboard, getModelColor, getModelLabel } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'linkedin'

interface ClickbaitAlternative {
  baslik: string
  clickbait_skoru: number
  aciklama: string
}

interface ClickbaitResult {
  clickbait_skoru: number
  seviye: string
  sorunlar: string[]
  guclu_yonler?: string[]
  alternatifler: ClickbaitAlternative[]
  genel_tavsiye?: string
  platform_normu?: string
}

interface ModelResult {
  model: AIModel
  data: ClickbaitResult
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400'
  const barColor = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <span className={cn('text-4xl font-bold', color)}>{score}</span>
        <p className="text-zinc-500 text-xs mt-0.5">/ 100</p>
      </div>
      <div className="flex-1">
        <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-between text-zinc-600 text-[10px] mt-0.5">
          <span>Temiz</span><span>Orta</span><span>Clickbait</span>
        </div>
      </div>
    </div>
  )
}

function seviyeColor(seviye: string) {
  const lower = seviye?.toLowerCase() || ''
  if (lower.includes('clickbait') || lower.includes('aşırı') || lower.includes('yüksek')) return 'bg-red-500/20 text-red-300 border-red-500/30'
  if (lower.includes('sınırda') || lower.includes('orta') || lower.includes('dikkat')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
}

function ResultCard({
  result,
  copiedIdx,
  onCopy,
}: {
  result: ModelResult
  copiedIdx: string | null
  onCopy: (text: string, key: string) => void
}) {
  const data = result.data
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-bold', getModelColor(result.model))}>{getModelLabel(result.model)}</span>
      </div>

      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Clickbait Skoru</p>
          <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', seviyeColor(data.seviye))}>
            {data.seviye}
          </span>
        </div>
        <ScoreGauge score={data.clickbait_skoru} />
        {data.platform_normu && <p className="text-zinc-500 text-xs mt-3">{data.platform_normu}</p>}
      </div>

      {data.sorunlar?.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-red-400 text-xs font-semibold mb-2">Tespit Edilen Sorunlar</p>
          <ul className="space-y-1">
            {data.sorunlar.map((sorun, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-red-400">x</span>{sorun}</li>
            ))}
          </ul>
        </div>
      )}

      {data.guclu_yonler?.length ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-emerald-400 text-xs font-semibold mb-2">Güçlü Yönler</p>
          <ul className="space-y-1">
            {data.guclu_yonler.map((item, i) => (
              <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-emerald-400">+</span>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.alternatifler?.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-emerald-400 text-xs font-semibold mb-2">Alternatif Başlıklar</p>
          <div className="space-y-2">
            {data.alternatifler.map((alt, i) => {
              const key = `${result.model}-${i}`
              return (
                <div key={key} className="bg-zinc-800/50 rounded-lg px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-sm">{alt.baslik}</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        Skor: {alt.clickbait_skoru}/100{alt.aciklama ? ` · ${alt.aciklama}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCopy(alt.baslik, key)}
                      className="text-zinc-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      {copiedIdx === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.genel_tavsiye && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-violet-400 text-xs font-semibold mb-1">Genel Tavsiye</p>
          <p className="text-zinc-300 text-sm">{data.genel_tavsiye}</p>
        </div>
      )}
    </div>
  )
}

export default function ClickbaitDetectorPage() {
  const { selectedModel, compareModels } = useModel()
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [loading, setLoading] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [results, setResults] = useState<ModelResult[]>([])
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text)
    setCopiedIdx(key)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const analyze = async (model: AIModel): Promise<ModelResult> => {
    const res = await apiFetch('/api/generate/clickbait-detector', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, model }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return { model: data.model || model, data }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    try {
      setResults([await analyze(selectedModel)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleAskAll = async () => {
    if (!title.trim()) return
    setAllLoading(true)
    setError('')
    setResults([])
    try {
      const models: AIModel[] = compareModels
      const settled = await Promise.allSettled(models.map(analyze))
      const { values, failureMessage } = collectSettledResults(settled)
      if (!values.length) throw new Error(failureMessage || 'Modellerden sonuç alınamadı.')
      setResults(values)
      if (failureMessage) setError(failureMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setAllLoading(false)
    }
  }

  const isLoading = loading || allLoading

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Clickbait Dedektörü" description="Başlığının clickbait seviyesini ölç ve düzelt" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Başlık</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Analiz edilecek başlık..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(platformLabels) as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={cn(
                        'py-1.5 px-2 rounded-lg text-xs font-medium transition-colors',
                        platform === p
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                      )}
                    >
                      {platformLabels[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
                </button>
                {compareModels.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAskAll}
                    disabled={isLoading || !title.trim()}
                    className="w-full py-2.5 rounded-lg bg-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                  >
                    {allLoading ? 'Modeller karşılaştırılıyor...' : `${compareModels.length} Modelle Karşılaştır`}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {isLoading && <LoadingState model={selectedModel} />}

            {results.length > 0 && !isLoading && (
              <div className={cn('grid gap-6', results.length > 1 ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1')}>
                {results.map((result) => (
                  <ResultCard key={result.model} result={result} copiedIdx={copiedIdx} onCopy={handleCopy} />
                ))}
              </div>
            )}

            {!isLoading && results.length === 0 && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Başlığı gir ve clickbait analizi yap
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
