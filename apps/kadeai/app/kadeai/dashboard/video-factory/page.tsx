'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'

type Aspect = 'portrait' | 'landscape'
type Language = 'tr' | 'en'

interface VideoResult {
  task_id: string
  videos: string[]
}

export default function VideoFactoryPage() {
  const [subject, setSubject] = useState('')
  const [script, setScript] = useState('')
  const [language, setLanguage] = useState<Language>('tr')
  const [aspect, setAspect] = useState<Aspect>('portrait')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)

  async function generate() {
    if (subject.trim().length < 2) {
      setError('Lütfen bir konu gir.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await apiFetch(
        apiPath('/api/video'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, script, language, aspect }),
        },
        290_000,
      )
      const data = await res.json()
      if (res.status === 402) {
        setError('Bu özellik için aktif bir paket gerekli. Paketler sayfasından yükseltebilirsin.')
        return
      }
      if (res.status === 503) {
        setError(data.error || 'Video motoru şu an hazır değil (bağımlılık kurulumu gerekli).')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Video üretilemedi.')
      setResult(data.data ?? data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video üretilemedi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <TopBar title="Video Fabrikası" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-100">Video Fabrikası</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Bir konu ver, KadeAI senaryoyu yazsın, seslendirsin, altyazılasın ve videoyu kursun.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Konu</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ör. Sabah rutininin verimliliğe etkisi"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Senaryo <span className="text-zinc-500">(opsiyonel — boşsa AI yazar)</span>
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={4}
              placeholder="Kendi senaryonu yapıştırabilir ya da boş bırakabilirsin."
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Dil</label>
              <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-800 p-1">
                {(['tr', 'en'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn('rounded-md px-3 py-1 text-sm', language === l ? 'bg-violet-500 text-white' : 'text-zinc-400')}
                  >
                    {l === 'tr' ? 'Türkçe' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">Format</label>
              <div className="inline-flex rounded-lg border border-zinc-700 bg-zinc-800 p-1">
                {(['portrait', 'landscape'] as Aspect[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={cn('rounded-md px-3 py-1 text-sm', aspect === a ? 'bg-violet-500 text-white' : 'text-zinc-400')}
                  >
                    {a === 'portrait' ? 'Dikey 9:16' : 'Yatay 16:9'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            className="w-full rounded-lg bg-violet-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            {loading ? 'Video üretiliyor… (birkaç dakika sürebilir)' : 'Video üret'}
          </button>
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <h2 className="mb-2 text-lg font-medium text-emerald-300">Video hazır 🎬</h2>
            <p className="text-sm text-zinc-400">Görev: {result.task_id}</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-200">
              {result.videos.map((v, i) => (
                <li key={i} className="break-all">{v}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
