'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import RawModelOutput from '@/components/ui/RawModelOutput'

interface Quote {
  metin: string
  tip: string
  platform_onerisi: string
  hashtag_onerisi: string[]
}

interface QuoteResult {
  alintilar: Quote[]
  raw?: string
}

const tipColors: Record<string, string> = {
  ilham: 'bg-violet-500/20 text-violet-300',
  bilgi: 'bg-blue-500/20 text-blue-300',
  eglence: 'bg-amber-500/20 text-amber-300',
  dusunce: 'bg-emerald-500/20 text-emerald-300',
  default: 'bg-zinc-700 text-zinc-300',
}

export default function QuoteExtractorPage() {
  const { selectedModel } = useModel()
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleCopy = async (text: string, idx: number) => {
    await copyToClipboard(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/quote-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorName, model: selectedModel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Alıntı Çıkarıcı" description="İçerikten paylaşılabilir alıntılar çıkar" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Alıntı çıkarılacak metin veya script..." rows={10}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Yazar Adı <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="— Yazar adı"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <button type="submit" disabled={loading || !content.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Çıkarılıyor...' : 'Alıntıları Çıkar'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {result && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={result.raw} />
                {result.alintilar?.map((quote, i) => (
                  <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <blockquote className="text-zinc-100 text-base font-medium italic leading-relaxed flex-1">
                        &ldquo;{quote.metin}&rdquo;
                        {authorName && <span className="block text-zinc-500 text-sm font-normal mt-1">— {authorName}</span>}
                      </blockquote>
                      <button onClick={() => handleCopy(`"${quote.metin}"${authorName ? `\n— ${authorName}` : ''}`, i)}
                        className="text-zinc-500 hover:text-violet-400 transition-colors flex-shrink-0">
                        {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium',
                          tipColors[quote.tip?.toLowerCase()] || tipColors.default)}>
                          {quote.tip}
                        </span>
                        <span className="text-zinc-500 text-xs">{quote.platform_onerisi}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {quote.hashtag_onerisi?.map((tag, j) => (
                          <span key={j} className="text-violet-400 text-[10px]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && !result && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                İçerik gir ve alıntıları çıkar butonuna tıkla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
