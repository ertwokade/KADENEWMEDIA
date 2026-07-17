'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn, copyToClipboard } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import RawModelOutput from '@/components/ui/RawModelOutput'

type Platform = 'youtube' | 'blog' | 'instagram'

interface FAQ {
  soru: string
  cevap: string
  kategori: string
}

interface FAQResult {
  faqs: FAQ[]
  schema_markup: string
  raw?: string
}

const platformLabels: Record<Platform, string> = {
  youtube: 'YouTube',
  blog: 'Blog',
  instagram: 'Instagram',
}

export default function FAQPage() {
  const { selectedModel } = useModel()
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [count, setCount] = useState(8)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FAQResult | null>(null)
  const [error, setError] = useState('')
  const [schemaCopied, setSchemaCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/generate/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform, count, model: selectedModel }),
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

  const categoryColors: Record<string, string> = {
    genel: 'bg-zinc-700 text-zinc-300',
    teknik: 'bg-blue-500/20 text-blue-300',
    fiyat: 'bg-emerald-500/20 text-emerald-300',
    kullanim: 'bg-violet-500/20 text-violet-300',
    default: 'bg-zinc-700 text-zinc-300',
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="SSS Üretici" description="İçeriğin için sık sorulan sorular oluştur" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik / Konu</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder="Video veya blog içeriğini yapıştır..." rows={7}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platform</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(platformLabels) as Platform[]).map((p) => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      className={cn('py-1.5 px-2 rounded-lg text-xs font-medium transition-colors',
                        platform === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600')}>
                      {platformLabels[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Soru Sayısı: <span className="text-violet-400">{count}</span></label>
                <input type="range" min={5} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-violet-500" />
                <div className="flex justify-between text-zinc-600 text-xs mt-0.5">
                  <span>5</span><span>15</span>
                </div>
              </div>
              <button type="submit" disabled={loading || !content.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {loading ? 'Oluşturuluyor...' : 'SSS Oluştur'}
              </button>
            </form>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {result && !loading && (
              <div className="space-y-3">
                <RawModelOutput content={result.raw} />
                {result.faqs?.map((faq, i) => (
                  <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-zinc-100 text-sm font-semibold leading-snug">{faq.soru}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                        categoryColors[faq.kategori?.toLowerCase()] || categoryColors.default)}>
                        {faq.kategori}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed">{faq.cevap}</p>
                  </div>
                ))}
                {result.schema_markup && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-emerald-400 text-xs font-semibold">Schema Markup (JSON-LD)</p>
                      <button onClick={async () => { await copyToClipboard(result.schema_markup); setSchemaCopied(true); setTimeout(() => setSchemaCopied(false), 2000) }}
                        className="text-zinc-500 hover:text-emerald-400 transition-colors">
                        {schemaCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre className="text-zinc-500 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap line-clamp-4">{result.schema_markup}</pre>
                  </div>
                )}
              </div>
            )}
            {!loading && !result && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                İçerik gir ve SSS oluştur butonuna tıkla
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
