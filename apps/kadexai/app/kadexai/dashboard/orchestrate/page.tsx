'use client'

/*
 * Sayfa planı: akış seçimi → girdi formu → çalıştır → adım adım sonuç.
 * Adım sırası sunucuda sabittir; bu ekran yalnızca girdi toplar ve sonucu
 * gösterir (least-privilege, bkz. lib/orchestration/registry.ts).
 */

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Clock, Play, SkipForward, XCircle } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'
import ModelOutput from '@/components/ui/ModelOutput'

interface Pipeline {
  id: string
  label: string
  description: string
  steps: Array<{ id: string; label: string }>
}

interface StepResult {
  id: string
  label: string
  status: 'ok' | 'skipped' | 'timeout' | 'failed'
  output?: string
  reason?: string
  model?: string
  tokensUsed?: number
  durationMs: number
}

const PLATFORMS = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'x', label: 'X' },
  { id: 'linkedin', label: 'LinkedIn' },
]

const STATUS_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  timeout: <Clock className="h-4 w-4 text-amber-400" />,
  skipped: <SkipForward className="h-4 w-4 text-zinc-500" />,
  failed: <XCircle className="h-4 w-4 text-red-400" />,
}

const input = 'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-violet-400'

export default function OrchestratePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selected, setSelected] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<StepResult[]>([])
  const [stoppedEarly, setStoppedEarly] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const response = await apiFetch('/api/orchestrate', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Akışlar okunamadı.')
      setPipelines(data.pipelines || [])
      setSelected(data.pipelines?.[0]?.id || '')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Akışlar okunamadı.')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRunning(true)
    setError('')
    setSteps([])
    setStoppedEarly(false)
    const form = new FormData(event.currentTarget)
    try {
      const response = await apiFetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId: selected,
          platform,
          niche: form.get('niche'),
          goal: form.get('goal'),
          competitor: form.get('competitor'),
          frequency: form.get('frequency'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Akış çalıştırılamadı.')
      setSteps(data.steps || [])
      setStoppedEarly(data.stoppedEarly === true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Akış çalıştırılamadı.')
    } finally {
      setRunning(false)
    }
  }

  const active = pipelines.find((pipeline) => pipeline.id === selected)

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Akışlar" description="Araçları zincirleyerek uçtan uca çalıştır" showModelSelector={false} />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-3xl space-y-5">

          {error && <div role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <form onSubmit={run} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">Akış</span>
              <select value={selected} onChange={(event) => setSelected(event.target.value)} className={input}>
                {pipelines.map((pipeline) => <option key={pipeline.id} value={pipeline.id}>{pipeline.label}</option>)}
              </select>
            </label>

            {active && (
              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="text-xs text-zinc-400">{active.description}</p>
                <ol className="mt-2 flex flex-wrap gap-1.5">
                  {active.steps.map((step, index) => (
                    <li key={step.id} className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] text-zinc-300">{index + 1}. {step.label}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">Niş *</span>
                <input name="niche" required maxLength={200} placeholder="Örn. yazılım eğitimi" className={input} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">Platform</span>
                <select value={platform} onChange={(event) => setPlatform(event.target.value)} className={input}>
                  {PLATFORMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">Hedef</span>
                <input name="goal" maxLength={200} placeholder="takipçi ve etkileşim artışı" className={input} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-zinc-400">Yayın sıklığı</span>
                <input name="frequency" maxLength={60} placeholder="haftada 3 içerik" className={input} />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">Rakip bilgisi</span>
              <textarea name="competitor" maxLength={400} rows={2} placeholder="Rakip hesap, konumlandırma veya içerik örnekleri" className={input} />
            </label>

            <button disabled={running || !selected} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50">
              <Play className="h-4 w-4" /> {running ? 'Akış çalışıyor…' : 'Akışı çalıştır'}
            </button>
            <p className="text-xs text-zinc-500">
              Akış birden çok AI çağrısı yapar; dakikada en fazla 3 kez çalıştırılabilir.
              Bir adım düşerse zincir durur — yarım bağlamla uydurma çıktı üretilmez.
            </p>
          </form>

          {steps.length > 0 && (
            <section className="space-y-3">
              {stoppedEarly && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Akış tamamlanmadan durdu. Aşağıdaki adımlar tamamlananlardır.
                </div>
              )}
              {steps.map((step, index) => (
                <article key={step.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                      {STATUS_ICON[step.status]} {index + 1}. {step.label}
                    </h3>
                    <span className="text-xs text-zinc-500">
                      {(step.durationMs / 1000).toFixed(1)} sn
                      {step.model ? ` · ${step.model}` : ''}
                      {typeof step.tokensUsed === 'number' ? ` · ${step.tokensUsed} token` : ''}
                    </span>
                  </header>
                  {step.reason && <p className="mt-2 text-xs text-amber-300">{step.reason}</p>}
                  {step.output && (
                    <ModelOutput content={step.output} className="mt-3 max-h-80 overflow-auto rounded-lg bg-zinc-950 p-3" />
                  )}
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
