'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { Platform, AIModel } from '@/types'
import { collectSettledResults, getPlatformLabel, getModelLabel, getModelColor, cn } from '@/lib/utils'
import { COMPARE_MODELS } from '@/lib/ai/models'

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin', 'pinterest']

interface ViralAnalysis {
  toplam_puan: number
  kriterler: Record<string, { puan: number; yorum: string }>
  guclu_yonler: string[]
  iyilestirme_onerileri: string[]
  revize_edilmis_baslik: string
}

interface ModelResult { model: AIModel; analysis: ViralAnalysis }

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  return <span className={cn('text-2xl font-bold', color)}>{score}</span>
}

function ScoreBar({ score }: { score: number }) {
  const bg = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', bg)} style={{ width: `${score}%` }} />
    </div>
  )
}

const criteriaLabels: Record<string, string> = {
  baslik_guc: 'Başlık Gücü', platform_uyum: 'Platform Uyumu',
  seo_guc: 'SEO Gücü', merak_faktoru: 'Merak Faktörü', cta_guc: 'CTA Gücü',
}

function AnalysisCard({ result }: { result: ModelResult }) {
  const a = result.analysis
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('text-xs font-bold', getModelColor(result.model))}>{getModelLabel(result.model)}</span>
      </div>

      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 flex items-center gap-4">
        <div className="text-center">
          <ScoreBadge score={a.toplam_puan} />
          <p className="text-zinc-500 text-xs mt-1">/ 100</p>
        </div>
        <div className="flex-1">
          <h3 className="text-zinc-200 font-semibold text-sm mb-1">Viral Potansiyel</h3>
          <ScoreBar score={a.toplam_puan} />
        </div>
      </div>

      {a.kriterler && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(a.kriterler).map(([key, val]) => (
            <div key={key} className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-xs">{criteriaLabels[key] || key}</p>
                <span className={cn('text-sm font-bold', val.puan >= 80 ? 'text-emerald-400' : val.puan >= 60 ? 'text-amber-400' : 'text-red-400')}>{val.puan}</span>
              </div>
              <ScoreBar score={val.puan} />
              <p className="text-zinc-500 text-xs">{val.yorum}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {a.guclu_yonler?.length > 0 && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <h4 className="text-emerald-400 text-xs font-semibold mb-1.5">Güçlü Yönler</h4>
            <ul className="space-y-1">
              {a.guclu_yonler.map((item, i) => <li key={i} className="text-zinc-300 text-xs flex gap-1.5"><span className="text-emerald-500">✓</span>{item}</li>)}
            </ul>
          </div>
        )}
        {a.iyilestirme_onerileri?.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <h4 className="text-amber-400 text-xs font-semibold mb-1.5">İyileştirme</h4>
            <ul className="space-y-1">
              {a.iyilestirme_onerileri.map((item, i) => <li key={i} className="text-zinc-300 text-xs flex gap-1.5"><span className="text-amber-500">→</span>{item}</li>)}
            </ul>
          </div>
        )}
      </div>

      {a.revize_edilmis_baslik && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-violet-400 text-xs font-semibold mb-1">Revize Başlık</p>
          <p className="text-zinc-200 text-sm">{a.revize_edilmis_baslik}</p>
        </div>
      )}
    </div>
  )
}

export default function ViralScorePage() {
  const { selectedModel } = useModel()
  const [title, setTitle]           = useState('')
  const [platform, setPlatform]     = useState<Platform>('youtube')
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [results, setResults]       = useState<ModelResult[]>([])
  const [error, setError]           = useState('')

  const analyze = async (model: AIModel): Promise<ModelResult> => {
    const res = await apiFetch('/api/generate/viral-score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, platform, model, description, hashtags }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    return { model: data.model || model, analysis: data.analysis }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError(''); setResults([])
    try {
      setResults([await analyze(selectedModel)])
    } catch (err) { setError(err instanceof Error ? err.message : 'Hata') }
    finally { setLoading(false) }
  }

  const handleAskAll = async () => {
    if (!title.trim()) return
    setAllLoading(true); setError(''); setResults([])
    try {
      const settled = await Promise.allSettled(COMPARE_MODELS.map(analyze))
      const { values, failureMessage } = collectSettledResults(settled)
      if (!values.length) throw new Error(failureMessage || 'Modellerden sonuç alınamadı.')
      setResults(values)
      if (failureMessage) setError(failureMessage)
    } catch (err) { setError(err instanceof Error ? err.message : 'Hata') }
    finally { setAllLoading(false) }
  }

  const isLoading = loading || allLoading

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Viral Skor" description="İçeriğinin viral potansiyelini analiz et" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Video Başlığı</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Analiz edilecek başlık"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {platforms.map(p => (
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
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Açıklama <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Video açıklaması..." rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Hashtagler <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#teknoloji #youtube"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div className="space-y-2">
                <button type="submit" disabled={isLoading || !title.trim()}
                  className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                  {loading ? 'Analiz ediliyor...' : 'Viral Skor Al'}
                </button>
                <button type="button" onClick={handleAskAll} disabled={isLoading || !title.trim()}
                  className="w-full py-2.5 rounded-lg bg-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-600 disabled:opacity-50 transition-colors">
                  {allLoading ? 'Modeller karşılaştırılıyor...' : '3 Modelle Karşılaştır'}
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {isLoading && <LoadingState model={selectedModel} />}

            {results.length > 0 && !isLoading && (
              <div className={cn('grid gap-6', results.length > 1 ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1')}>
                {results.map(r => <AnalysisCard key={r.model} result={r} />)}
              </div>
            )}

            {!isLoading && results.length === 0 && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Başlığı gir ve analiz et</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
