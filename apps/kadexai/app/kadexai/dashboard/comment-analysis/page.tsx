'use client'

import { apiFetch } from '@/lib/client/api'
import { useState } from 'react'
import { useModel } from '@/lib/context/ModelContext'
import TopBar from '@/components/layout/TopBar'
import LoadingState from '@/components/ui/LoadingState'
import CopyButton from '@/components/ui/CopyButton'
import { cn } from '@/lib/utils'

interface AnalysisData { ozet: { toplam_yorum: number; pozitif_oran: number; negatif_oran: number; notr_oran: number; genel_duygu: string }; duygu_analizi: { en_cok_hissedilen: string; pozitif_temalar: string[]; negatif_temalar: string[]; notr_sorular: string[] }; icerik_firsatlari: Array<{ fikir: string; kaynak_yorum: string; potansiyel: string }>; topluluk_sagligi: { puan: number; yorum: string }; yanit_oncelikleri: Array<{ yorum_ozeti: string; neden_onemli: string; yanit_tonu: string; yanit_taslagi?: string }>; genel_oneriler: string[] }

export default function CommentAnalysisPage() {
  const { selectedModel } = useModel()
  const [comments, setComments] = useState('')
  const [contentTitle, setContentTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalysisData | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comments.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await apiFetch('/api/generate/comment-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments, contentTitle, model: selectedModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json.analysis)
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setLoading(false) }
  }

  const duyguEmoji: Record<string, string> = { pozitif: '😊', negatif: '😞', karma: '😐', notr: '🤔' }

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Yorum Analizi" description="Yorumları analiz et, duygu ve içerik fırsatlarını bul" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">İçerik Başlığı <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Video/post başlığı"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322]" />
              </div>
              <div>
                <label className="block text-zinc-400 text-xs font-medium mb-1.5">Yorumlar</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={14}
                  placeholder={'Yorumları buraya yapıştır. Her satır bir yorum:\n\nHarika video, çok şey öğrendim!\nBu konuyu daha detaylı anlat lütfen\nKaynakları paylaşır mısın?\n...'}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#f2c322] resize-none" />
              </div>
              <button type="submit" disabled={loading || !comments.trim()}
                className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 transition-colors">
                {loading ? 'Analiz ediliyor...' : 'Yorumları Analiz Et'}
              </button>
            </form>
          </div>
          <div className="flex-1 min-w-0">
            {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm mb-4">{error}</div>}
            {loading && <LoadingState model={selectedModel} />}
            {data && !loading && (
              <div className="space-y-4">
                {/* Özet */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Genel Duygu', value: `${duyguEmoji[data.ozet?.genel_duygu] || '🤔'} ${data.ozet?.genel_duygu}` },
                    { label: 'Pozitif', value: `${data.ozet?.pozitif_oran}%`, color: 'text-emerald-400' },
                    { label: 'Negatif', value: `${data.ozet?.negatif_oran}%`, color: 'text-red-400' },
                    { label: 'Topluluk Sağlığı', value: `${data.topluluk_sagligi?.puan}/100`, color: data.topluluk_sagligi?.puan >= 70 ? 'text-emerald-400' : 'text-amber-400' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3 text-center">
                      <p className="text-zinc-500 text-[10px] mb-1">{s.label}</p>
                      <p className={cn('text-sm font-bold', s.color || 'text-zinc-200')}>{s.value}</p>
                    </div>
                  ))}
                </div>
                {/* Duygu temaları */}
                <div className="grid grid-cols-2 gap-3">
                  {data.duygu_analizi?.pozitif_temalar?.length > 0 && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-emerald-400 text-xs font-semibold mb-2">Pozitif Temalar</p>
                      <ul className="space-y-1">{data.duygu_analizi.pozitif_temalar.map((t, i) => <li key={i} className="text-zinc-300 text-xs">✓ {t}</li>)}</ul>
                    </div>
                  )}
                  {data.duygu_analizi?.negatif_temalar?.length > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-red-400 text-xs font-semibold mb-2">Negatif Temalar</p>
                      <ul className="space-y-1">{data.duygu_analizi.negatif_temalar.map((t, i) => <li key={i} className="text-zinc-300 text-xs">✗ {t}</li>)}</ul>
                    </div>
                  )}
                </div>
                {/* İçerik fırsatları */}
                {data.icerik_firsatlari?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-xs font-semibold">İçerik Fırsatları</p>
                    {data.icerik_firsatlari.map((f, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-zinc-200 text-sm font-medium">{f.fikir}</p>
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded', f.potansiyel === 'yüksek' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>{f.potansiyel}</span>
                        </div>
                        <p className="text-zinc-600 text-xs italic">{f.kaynak_yorum}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Yanıt öncelikleri */}
                {data.yanit_oncelikleri?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-zinc-400 text-xs font-semibold">Öncelikli Yanıtlanacaklar</p>
                    {data.yanit_oncelikleri.map((y, i) => (
                      <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-zinc-200 text-xs font-medium">{y.yorum_ozeti}</p>
                        <p className="text-zinc-500 text-xs mt-1">{y.neden_onemli} · Ton: <span className="text-amber-400">{y.yanit_tonu}</span></p>
                        {y.yanit_taslagi && (
                          <div className="mt-3 rounded-lg border border-zinc-700/60 bg-zinc-900/50 p-3">
                            <p className="text-zinc-300 text-sm leading-relaxed">{y.yanit_taslagi}</p>
                            <CopyButton text={y.yanit_taslagi} className="mt-2" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!data && !loading && !error && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">Yorumları yapıştır ve analiz et</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
