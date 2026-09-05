'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'

interface KwData { kelime: string; hacim: string; rekabet: string; kullan: boolean }
interface SeoData { seo_skoru: number; baslik_analizi: { puan: number; sorunlar: string[]; optimize_edilmis: string }; aciklama_analizi: { puan: number; sorunlar: string[]; optimize_edilmis: string }; tag_analizi: { puan: number; mevcut_iyi: string[]; eklenecek: string[]; cikarilacak: string[] }; anahtar_kelimeler: KwData[]; thumbnail_ipuclari: string[]; genel_oneriler: string[] }

function ScoreBadge({ score }: { score: number }) {
  const c = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'
  return <span className={cn('text-2xl font-bold', c)}>{score}</span>
}

export default function YoutubeSeoPage() {
  const { selectedModel } = useModel()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [niche, setNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SeoData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/youtube-seo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, tags, niche, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.seo)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 2000) }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="YouTube SEO" description="Başlık, açıklama ve etiketlerini optimize et" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Video Başlığı</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mevcut başlığını gir"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niş</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Teknoloji, finans..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Açıklama <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                  placeholder="Mevcut video açıklaması..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Etiketler <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ai, yapay zeka, youtube..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <button type="submit" disabled={loading || !title.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Analiz ediliyor...' : 'SEO Analiz Et'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 flex items-center gap-4">
                  <div className="text-center"><ScoreBadge score={data.seo_skoru} /><p className="text-zinc-500 text-xs">SEO Skoru</p></div>
                  <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', data.seo_skoru >= 80 ? 'bg-emerald-500' : data.seo_skoru >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${data.seo_skoru}%` }} />
                  </div>
                </div>
                {[
                  { key: 'baslik', label: 'Başlık', d: data.baslik_analizi, copyKey: 'title' },
                  { key: 'aciklama', label: 'Açıklama', d: data.aciklama_analizi, copyKey: 'desc' },
                ].map(({ key, label, d, copyKey }) => d && (
                  <div key={key} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-zinc-400 text-xs font-semibold">{label} · <span className={cn(d.puan >= 80 ? 'text-emerald-400' : d.puan >= 60 ? 'text-amber-400' : 'text-red-400')}>{d.puan}/100</span></p>
                    </div>
                    {d.sorunlar?.length > 0 && <ul className="space-y-0.5">{d.sorunlar.map((s: string, i: number) => <li key={i} className="text-red-400 text-xs flex gap-1.5"><span>✗</span>{s}</li>)}</ul>}
                    {d.optimize_edilmis && (
                      <div className="bg-zinc-900/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-emerald-400 text-[10px] font-semibold">Optimize edilmiş</p>
                          <button onClick={() => copy(d.optimize_edilmis, copyKey)} className="text-[10px] text-zinc-500 hover:text-zinc-300">{copied === copyKey ? '✓' : 'Kopyala'}</button>
                        </div>
                        <p className="text-zinc-300 text-xs">{d.optimize_edilmis}</p>
                      </div>
                    )}
                  </div>
                ))}
                {data.tag_analizi && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 space-y-2">
                    <p className="text-zinc-400 text-xs font-semibold">Etiketler · <span className={cn(data.tag_analizi.puan >= 80 ? 'text-emerald-400' : 'text-amber-400')}>{data.tag_analizi.puan}/100</span></p>
                    {data.tag_analizi.eklenecek?.length > 0 && <div><p className="text-emerald-400 text-[10px] mb-1">Ekle</p><div className="flex flex-wrap gap-1">{data.tag_analizi.eklenecek.map((t, i) => <span key={i} className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded">+ {t}</span>)}</div></div>}
                    {data.tag_analizi.cikarilacak?.length > 0 && <div><p className="text-red-400 text-[10px] mb-1">Kaldır</p><div className="flex flex-wrap gap-1">{data.tag_analizi.cikarilacak.map((t, i) => <span key={i} className="bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded">- {t}</span>)}</div></div>}
                  </div>
                )}
                {data.genel_oneriler?.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="text-amber-400 text-xs font-semibold mb-2">Genel Öneriler</p>
                    <ul className="space-y-1">{data.genel_oneriler.map((o, i) => <li key={i} className="text-zinc-300 text-xs flex gap-1.5"><span className="text-amber-500">→</span>{o}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Başlık gir ve SEO analizi yap</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
