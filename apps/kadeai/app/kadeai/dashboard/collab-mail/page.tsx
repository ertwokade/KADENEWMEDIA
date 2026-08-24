'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'

interface MailVersion { konu: string; metin: string }
interface Mail { kisa_versiyon: MailVersion; uzun_versiyon: MailVersion; takip_maili: string; ipuclari: string[] }

export default function CollabMailPage() {
  const { selectedModel } = useModel()
  const [form, setForm] = useState({ senderName: '', senderChannel: '', senderNiche: '', targetName: '', dealType: 'sponsorluk', extraNotes: '' })
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Mail | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'kisa' | 'uzun' | 'takip'>('kisa')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/collab-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.mail)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const activeContent = activeTab === 'kisa' ? data?.kisa_versiyon : activeTab === 'uzun' ? data?.uzun_versiyon : null
  const copy = () => {
    const text = activeTab === 'takip' ? data?.takip_maili : `Konu: ${activeContent?.konu}\n\n${activeContent?.metin}`
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Kolaborasyon Maili" description="Marka deal ve creator iş birliği için profesyonel outreach mailleri" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'senderName', label: 'Senin adın / marka adın', placeholder: 'Kade Studio' },
                { key: 'senderChannel', label: 'Kanal / hesap', placeholder: '@kadestudio' },
                { key: 'senderNiche', label: 'Niche', placeholder: 'teknoloji, yazılım' },
                { key: 'targetName', label: 'Hedef kişi / marka', placeholder: 'Notion, Samsung...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-zinc-400 text-xs font-medium mb-1">{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
                </div>
              ))}
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1">İş birliği türü</label>
                <select value={form.dealType} onChange={(e) => setForm(f => ({ ...f, dealType: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-[#f2c322]">
                  {['sponsorluk', 'affiliate', 'ürün incelemesi', 'kanal iş birliği', 'etkinlik daveti', 'içerik ortaklığı'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1">Ek notlar</label>
                <textarea value={form.extraNotes} onChange={(e) => setForm(f => ({ ...f, extraNotes: e.target.value }))} rows={2}
                  placeholder="Abone sayısı, oran, özel istek..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button type="submit" disabled={loading || !form.senderName || !form.targetName}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Yazılıyor...' : 'Mail Yaz'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['kisa', 'uzun', 'takip'] as const).map((t) => (
                    <button key={t} onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === t ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
                      {t === 'kisa' ? 'Kısa Versiyon' : t === 'uzun' ? 'Uzun Versiyon' : 'Takip Maili'}
                    </button>
                  ))}
                  <button onClick={copy} className="ml-auto px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:text-zinc-200 border border-zinc-700">
                    {copied ? '✓ Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
                {activeTab !== 'takip' && activeContent && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5 space-y-3">
                    <div className="bg-zinc-900/50 rounded-lg px-3 py-2">
                      <span className="text-zinc-500 text-xs">Konu: </span>
                      <span className="text-zinc-200 text-sm font-medium">{activeContent.konu}</span>
                    </div>
                    <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{activeContent.metin}</p>
                  </div>
                )}
                {activeTab === 'takip' && data.takip_maili && (
                  <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-5">
                    <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{data.takip_maili}</p>
                  </div>
                )}
                {data.ipuclari?.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="text-emerald-400 text-xs font-semibold mb-2">İpuçları</p>
                    <ul className="space-y-1">
                      {data.ipuclari.map((ip, i) => <li key={i} className="text-zinc-300 text-xs flex gap-2"><span className="text-emerald-500">→</span>{ip}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Bilgileri doldur ve mail yaz</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
