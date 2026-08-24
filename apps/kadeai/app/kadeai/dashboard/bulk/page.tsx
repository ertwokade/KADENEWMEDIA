'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import RawModelOutput from '@/components/ui/RawModelOutput'

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter'

interface BulkResult {
  basliklar: string[]
  hooklar: string[]
  captions: Record<string, string[]>
  hashtag_setleri: string[][]
  raw?: string
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
}

export default function BulkPage() {
  const { selectedModel } = useModel()
  const [topic, setTopic] = useState('')
  const [niche, setNiche] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram', 'tiktok'])
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState('')
  const [activeCapPlatform, setActiveCapPlatform] = useState<Platform>('instagram')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const handleCopy = async (text: string, key: string) => {
    await copyToClipboard(text)
    setCopiedStates((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => setCopiedStates((prev) => ({ ...prev, [key]: false })), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || platforms.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, niche, platforms, count, model: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.data)
      setActiveCapPlatform(platforms[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Toplu İçerik Üretici" description="Tek konudan çoklu platform içerikleri oluştur" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Konu</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="İçerik konusu..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niş <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Kanal niş alanı..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platformlar</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(platformLabels) as Platform[]).map((p) => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={cn('py-1.5 px-2 rounded-lg text-xs font-medium transition-colors',
                        platforms.includes(p) ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {platformLabels[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Başlık Sayısı: <span className="text-violet-400">{count}</span></label>
                <input type="range" min={3} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-zinc-600 text-xs mt-0.5"><span>3</span><span>10</span></div>
              </div>
              <button type="submit" disabled={loading || !topic.trim() || platforms.length === 0}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Oluşturuluyor...' : 'Toplu Üret'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {result && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={result.raw} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-2">Başlıklar</p>
                    <ol className="space-y-1.5">
                      {result.basliklar?.map((title, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-zinc-600 text-xs w-4 flex-shrink-0">{i + 1}.</span>
                          <div className="flex items-start justify-between gap-1 flex-1">
                            <span className="text-zinc-300 text-xs">{title}</span>
                            <button onClick={() => handleCopy(title, `title-${i}`)} className="text-zinc-600 hover:text-violet-400 transition-colors flex-shrink-0">
                              {copiedStates[`title-${i}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-2">Hook'lar</p>
                    <ol className="space-y-1.5">
                      {result.hooklar?.map((hook, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-zinc-600 text-xs w-4 flex-shrink-0">{i + 1}.</span>
                          <div className="flex items-start justify-between gap-1 flex-1">
                            <span className="text-zinc-300 text-xs">{hook}</span>
                            <button onClick={() => handleCopy(hook, `hook-${i}`)} className="text-zinc-600 hover:text-violet-400 transition-colors flex-shrink-0">
                              {copiedStates[`hook-${i}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                {result.captions && Object.keys(result.captions).length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 overflow-hidden">
                    <div className="flex border-b border-zinc-700/50 overflow-x-auto">
                      {Object.keys(result.captions).map((p) => (
                        <button key={p} onClick={() => setActiveCapPlatform(p as Platform)}
                          className={cn('px-4 py-2.5 text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors capitalize',
                            activeCapPlatform === p ? 'bg-violet-500/20 text-violet-300 border-b-2 border-violet-500'
                              : 'text-zinc-500 hover:text-zinc-300')}>
                          {platformLabels[p as Platform] || p}
                        </button>
                      ))}
                    </div>
                    <div className="p-4 space-y-2">
                      {result.captions[activeCapPlatform]?.map((cap, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 bg-zinc-900/50 rounded-lg p-3">
                          <p className="text-zinc-300 text-xs flex-1">{cap}</p>
                          <button onClick={() => handleCopy(cap, `cap-${activeCapPlatform}-${i}`)} className="text-zinc-600 hover:text-violet-400 transition-colors flex-shrink-0">
                            {copiedStates[`cap-${activeCapPlatform}-${i}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.hashtag_setleri?.length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <p className="text-zinc-400 text-xs font-semibold mb-2">Hashtag Setleri</p>
                    <div className="space-y-2">
                      {result.hashtag_setleri.map((set, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-zinc-900/50 rounded-lg p-2.5">
                          <p className="text-violet-400 text-xs flex-1">{set.join(' ')}</p>
                          <button onClick={() => handleCopy(set.join(' '), `hash-${i}`)} className="text-zinc-600 hover:text-violet-400 transition-colors flex-shrink-0">
                            {copiedStates[`hash-${i}`] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!loading && !result && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Konu ve platformları seç, toplu içerik üret
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
