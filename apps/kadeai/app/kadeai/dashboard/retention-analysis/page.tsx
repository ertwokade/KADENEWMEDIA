'use client'

import { apiFetch } from '@/lib/client/api'
import { FormEvent, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import { useModel } from '@/lib/context/ModelContext'
import { cn } from '@/lib/utils'

const platforms = ['YouTube', 'Instagram Reels', 'TikTok', 'Shorts', 'LinkedIn', 'X']

export default function RetentionAnalysisPage() {
  const { selectedModel } = useModel()
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('YouTube')
  const [audience, setAudience] = useState('')
  const [metrics, setMetrics] = useState('')
  const [input, setInput] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError('')
    setContent('')

    try {
      const response = await apiFetch('/api/generate/retention-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, platform, audience, metrics, content: input, model: selectedModel }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analiz üretilemedi')
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="İzlenme Analizi" description="İçerik neden izlenir, nerede bırakılır ve nasıl düzelir?" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Başlık / konu</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Video veya post konusu"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {platforms.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPlatform(item)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                        platform === item
                          ? 'border-yellow-400/50 bg-yellow-400/15 text-yellow-200'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hedef kitle</label>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Kim izleyecek?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Varsa metrikler</label>
                <textarea
                  value={metrics}
                  onChange={(event) => setMetrics(event.target.value)}
                  rows={3}
                  placeholder="CTR, izlenme süresi, retention, yorumlar..."
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hook / script / transkript</label>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={10}
                  placeholder="İçerik metnini veya video akışını buraya yapıştır"
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-full rounded-lg bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Analiz ediliyor...' : 'İzlenme Analizi Yap'}
              </button>
            </form>
          </div>

          <div className="min-w-0 flex-1">
            {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {content && !loading && (
              <div className="rounded-xl border border-yellow-400/20 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-yellow-300">Retention raporu</p>
                  <CopyButton text={content} />
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-7 text-zinc-200">{content}</pre>
              </div>
            )}
            {!content && !loading && !error && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-600">
                İçeriği yapıştır, izlenme/kopma nedenleri burada çıksın.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
