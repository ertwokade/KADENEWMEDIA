'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import Link from 'next/link'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import CopyButton from '@/components/ui/CopyButton'
import LoadingState from '@/components/ui/LoadingState'
import { Platform } from '@/types'
import { getPlatformLabel, cn } from '@/lib/utils'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'

const platforms: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'linkedin', 'pinterest']

interface HashtagGroups {
  yuksek: string[]
  orta: string[]
  dusuk: string[]
  niche: string[]
}

export default function HashtagPage() {
  const workspaceHref = useWorkspaceHref()
  const { selectedModel } = useModel()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [niche, setNiche] = useState('')
  const [count, setCount] = useState(30)
  const [loading, setLoading] = useState(false)
  const [hashtags, setHashtags] = useState<HashtagGroups | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !niche.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/hashtag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, niche, model: selectedModel, count }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHashtags(data.hashtags)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const allHashtags = hashtags
    ? [...(hashtags.yuksek || []), ...(hashtags.orta || []), ...(hashtags.dusuk || []), ...(hashtags.niche || [])].join(' ')
    : ''

  const groups = hashtags
    ? [
        { key: 'yuksek', label: 'Yüksek Hacim (1M+)', color: 'text-red-400', tags: hashtags.yuksek || [] },
        { key: 'orta', label: 'Orta Hacim (100K-1M)', color: 'text-amber-400', tags: hashtags.orta || [] },
        { key: 'dusuk', label: 'Düşük Hacim (<100K)', color: 'text-emerald-400', tags: hashtags.dusuk || [] },
        { key: 'niche', label: 'Niş', color: 'text-violet-400', tags: hashtags.niche || [] },
      ]
    : []

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Hashtag AI" description="Platform ve nişe özel hashtag stratejisi" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik Konusu</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn: Evde pilates egzersizleri" rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
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
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niş</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)}
                  placeholder="Örn: fitness, sağlık, wellness"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Hashtag Sayısı: {count}</label>
                <input type="range" min={10} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
              <button type="submit" disabled={loading || !topic.trim() || !niche.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Üretiliyor...' : 'Hashtag Üret'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {hashtags && !loading && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-200 font-medium text-sm">Hashtag Seti</h3>
                  <div className="flex items-center gap-3">
                    <CopyButton text={allHashtags} />
                    <Link prefetch={false} href={workspaceHref(`/dashboard/title?topic=${encodeURIComponent(topic)}&keywords=${encodeURIComponent(allHashtags)}&platform=${platform}`)} className="text-xs text-violet-400 hover:text-violet-300">Başlık üret →</Link>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {groups.map((g) => g.tags.length > 0 && (
                    <div key={g.key} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
                      <p className={cn('text-xs font-semibold', g.color)}>{g.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {g.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-md cursor-pointer hover:bg-zinc-600 transition-colors"
                            onClick={() => navigator.clipboard.writeText(tag)}>
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!loading && !hashtags && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Konuyu ve nişi gir, hashtag üret butonuna tıkla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
