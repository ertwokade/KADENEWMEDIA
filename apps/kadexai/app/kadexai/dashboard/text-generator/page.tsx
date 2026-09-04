'use client'

import { apiFetch } from '@/lib/client/api'
import { FormEvent, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import ModelOutput from '@/components/ui/ModelOutput'
import { useModel } from '@/lib/context/ModelContext'
import { cn } from '@/lib/utils'

const formats = ['Landing metni', 'Reklam metni', 'Mail', 'Sosyal medya caption', 'Satış sayfası', 'Duyuru']
const tones = ['Net ve profesyonel', 'Samimi', 'Premium', 'Agresif satış', 'Eğitici', 'Kısa ve vurucu']

export default function TextGeneratorPage() {
  const { selectedModel } = useModel()
  const [goal, setGoal] = useState('')
  const [format, setFormat] = useState(formats[0])
  const [platform, setPlatform] = useState('Kade Media web / sosyal medya')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState(tones[0])
  const [keyPoints, setKeyPoints] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!goal.trim()) return

    setLoading(true)
    setError('')
    setContent('')

    try {
      const response = await apiFetch('/api/generate/text-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, format, platform, audience, tone, keyPoints, model: selectedModel }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Metin üretilemedi')
      setContent(data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Metin Oluşturucu" description="Site, reklam, mail ve sosyal medya metinlerini tek ekrandan üret" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Metnin amacı</label>
                <textarea
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  rows={4}
                  placeholder="Örn: Big Kit için satın almaya götüren kısa landing metni yaz"
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {formats.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormat(item)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-xs font-medium transition-colors',
                      format === item
                        ? 'border-yellow-400/50 bg-yellow-400/15 text-yellow-200'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platform / kanal</label>
                <input
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hedef kitle</label>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="İçerik üreticileri, ajanslar, işletmeler..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ton</label>
                <select
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-yellow-400 focus:outline-none"
                >
                  {tones.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Mutlaka geçsin</label>
                <textarea
                  value={keyPoints}
                  onChange={(event) => setKeyPoints(event.target.value)}
                  rows={4}
                  placeholder="Paketler, fiyat, demo, güven, hız, AI araçları..."
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-yellow-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="w-full rounded-lg bg-yellow-400 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Üretiliyor...' : 'Metin Oluştur'}
              </button>
            </form>
          </div>

          <div className="min-w-0 flex-1">
            {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {content && !loading && (
              <div className="rounded-xl border border-yellow-400/20 bg-zinc-900 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-yellow-300">Hazır metin</p>
                  <CopyButton text={content} />
                </div>
                <ModelOutput content={content} />
              </div>
            )}
            {!content && !loading && !error && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-600">
                Brief gir, metin burada oluşsun.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
