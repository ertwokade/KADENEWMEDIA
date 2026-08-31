'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import { cn } from '@/lib/utils'
import RawModelOutput from '@/components/ui/RawModelOutput'

const allPlatforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'x']
type BioData = { platformlar: Record<string, Record<string, string>>; link_sayfasi: { baslik: string; aciklama: string; linkler: Array<{ baslik: string; aciklama: string }> }; raw?: string }

export default function BioLinkPage() {
  const { selectedModel } = useModel()
  const [name, setName] = useState('')
  const [niche, setNiche] = useState('')
  const [highlights, setHighlights] = useState('')
  const [tone, setTone] = useState('samimi')
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'youtube'])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BioData | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('instagram')
  const [copied, setCopied] = useState<string | null>(null)

  const togglePlatform = (p: string) => setPlatforms(ps => ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/bio-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, niche, platforms, highlights, tone, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.bio)
      if (platforms[0]) setActiveTab(platforms[0])
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Bağlantı Biyografisi" description="Her platform için optimize profil biyografisi ve link sayfası" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İsim / Marka</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kade Studio"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Niche</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Teknoloji, yapay zeka, üretkenlik"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Öne Çıkan Özellikler</label>
                <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3}
                  placeholder="500K+ takipçi, 5 yıllık deneyim, weekly newsletter..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Ton</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['samimi', 'profesyonel', 'esprili', 'ilham verici'].map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)}
                      className={cn('py-1.5 rounded-lg text-xs transition-colors border',
                        tone === t ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Platformlar</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {allPlatforms.map((p) => (
                    <button key={p} type="button" onClick={() => togglePlatform(p)}
                      className={cn('py-1.5 rounded-lg text-xs capitalize transition-colors border',
                        platforms.includes(p) ? 'bg-violet-500/20 text-violet-300 border-violet-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading || !name || !niche}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Üretiliyor...' : 'Biyografi Üret'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <RawModelOutput content={data.raw} />
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(data.platformlar || {}).map((p) => (
                    <button key={p} onClick={() => setActiveTab(p)}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                        activeTab === p ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setActiveTab('link')}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      activeTab === 'link' ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300')}>
                    Link Sayfası
                  </button>
                </div>
                {activeTab !== 'link' && data.platformlar?.[activeTab] && (
                  <div className="space-y-3">
                    {Object.entries(data.platformlar[activeTab]).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-zinc-500 text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                          <button onClick={() => copy(val, key)} className="text-xs text-zinc-500 hover:text-zinc-300">{copied === key ? '✓' : 'Kopyala'}</button>
                        </div>
                        <p className="text-zinc-200 text-sm whitespace-pre-wrap">{val}</p>
                        <p className="text-zinc-600 text-xs mt-1">{String(val).length} karakter</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'link' && data.link_sayfasi && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 space-y-3">
                    <h3 className="text-zinc-100 font-semibold">{data.link_sayfasi.baslik}</h3>
                    <p className="text-zinc-400 text-sm">{data.link_sayfasi.aciklama}</p>
                    <div className="space-y-2">
                      {data.link_sayfasi.linkler?.map((l, i) => (
                        <div key={i} className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
                          <p className="text-zinc-200 text-sm font-medium">{l.baslik}</p>
                          <p className="text-zinc-500 text-xs">{l.aciklama}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Bilgileri doldur ve biyografi üret</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
