'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

const styles = ['bilgilendirici', 'hikaye anlatımı', 'tartışmalı/cesur', 'liste', 'soru-cevap']

interface ThreadPost { no: number; icerik: string; tip: string }
interface Thread { hook: string; posts: ThreadPost[]; hashtags: string[] }

export default function ThreadPage() {
  const { selectedModel } = useModel()
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<'x' | 'linkedin'>('x')
  const [style, setStyle] = useState('bilgilendirici')
  const [count, setCount] = useState(7)
  const [loading, setLoading] = useState(false)
  const [thread, setThread] = useState<Thread | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true); setError(''); setThread(null)
    try {
      const res = await apiFetch('/api/generate/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, style, tweetCount: count, model: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setThread(data.thread)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const copyAll = () => {
    if (!thread) return
    const text = thread.posts.map((p) => `${p.no}/ ${p.icerik}`).join('\n\n') + '\n\n' + (thread.hashtags || []).join(' ')
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const tipColor: Record<string, string> = {
    hook: 'bg-violet-500/20 text-violet-300',
    bilgi: 'bg-blue-500/20 text-blue-300',
    ornek: 'bg-amber-500/20 text-amber-300',
    sonuc: 'bg-emerald-500/20 text-emerald-300',
    cta: 'bg-red-500/20 text-red-300',
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Thread Yazarı" description="X ve LinkedIn için viral thread'ler yaz" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Konu / Ana Fikir</label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3}
                  placeholder="Örn: Yapay zeka ile sabah rutini nasıl oluşturulur"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['x', 'linkedin'] as const).map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-2 rounded-lg text-sm font-medium transition-colors border',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-400 border-zinc-700')}>
                      {p === 'x' ? 'X (Twitter)' : 'LinkedIn'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Stil</label>
                <div className="space-y-1.5">
                  {styles.map((s) => (
                    <button key={s} type="button" onClick={() => setStyle(s)}
                      className={cn('w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors border',
                        style === s ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Tweet sayısı: {count}</label>
                <input type="range" min={5} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-zinc-600 text-xs mt-1"><span>5</span><span>15</span></div>
              </div>
              <button type="submit" disabled={loading || !topic.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Yazılıyor...' : 'Thread Yaz'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {thread && !loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-zinc-400 text-sm"><span className="text-violet-400 font-semibold">{thread.posts?.length}</span> tweet</p>
                  <button onClick={copyAll} className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200 transition-colors border border-zinc-700">
                    {copied ? '✓ Kopyalandı' : 'Tümünü Kopyala'}
                  </button>
                </div>
                {thread.posts?.map((post) => (
                  <div key={post.no} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-zinc-600 text-xs font-mono flex-shrink-0 mt-0.5">{post.no}/</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm leading-relaxed">{post.icerik}</p>
                        <div className="flex items-center justify-between mt-2">
                          {post.tip && <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', tipColor[post.tip] || 'bg-zinc-700 text-zinc-400')}>{post.tip}</span>}
                          <span className={cn('text-[10px] ml-auto', post.icerik.length > 280 ? 'text-red-400' : 'text-zinc-600')}>{post.icerik.length}/280</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {thread.hashtags?.length > 0 && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3">
                    <p className="text-zinc-500 text-xs mb-2">Hashtag önerileri</p>
                    <div className="flex flex-wrap gap-1.5">
                      {thread.hashtags.map((h, i) => (
                        <span key={i} className="bg-violet-500/10 text-violet-400 text-xs px-2 py-0.5 rounded">{h}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!thread && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Konu gir ve thread yaz butonuna bas</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
