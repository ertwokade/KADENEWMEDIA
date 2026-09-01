'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { apiFetch } from '@/lib/client/api'
import { useModel } from '@/lib/context/ModelContext'
import { useWorkspaceHref } from '@/lib/workspace/WorkspaceContext'
import { cn } from '@/lib/utils'

/**
 * Kanal Denetimi.
 *
 * Sosyal Medya Analizi düzyazı bir rapor döndürüyor; okunuyor ama bir şey
 * yaptırmıyor. Burada aynı girdiden tek bir skor, bu hafta yapılabilecek üç
 * iş ve tarihli bir yol haritası çıkıyor — her iş çalıştırılabilir bir araca
 * bağlı.
 */

type Boyut = { ad: string; puan: number; durum: string; yorum: string }
type Kazanim = { baslik: string; neden: string; arac: string | null; aracAdi: string | null; rota: string | null }
type Donem = { donem: string; hedef: string; isler: string[] }
type Denetim = {
  saglikSkoru: number
  skorGerekcesi: string
  veriEksigi: string[]
  boyutlar: Boyut[]
  hizliKazanimlar: Kazanim[]
  yolHaritasi: Donem[]
}

const PLATFORMLAR = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'X']

const DURUM_RENK: Record<string, string> = {
  iyi: 'text-[color:var(--kade-ok-400)]',
  orta: 'text-[color:var(--kade-warn-400)]',
  zayif: 'text-[color:var(--kade-err-400)]',
  veri_yok: 'text-zinc-500',
}
const DURUM_ETIKET: Record<string, string> = {
  iyi: 'iyi', orta: 'orta', zayif: 'zayıf', veri_yok: 'veri yok',
}

const alan = 'w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[#f2c322] focus:outline-none'

export default function ChannelAuditPage() {
  const { selectedModel } = useModel()
  const alanYolu = useWorkspaceHref()
  const [accountName, setAccountName] = useState('')
  const [niche, setNiche] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['YouTube'])
  const [bio, setBio] = useState('')
  const [metrics, setMetrics] = useState('')
  const [recentPosts, setRecentPosts] = useState('')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [denetim, setDenetim] = useState<Denetim | null>(null)

  const platformSec = (p: string) =>
    setPlatforms((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]))

  const gonder = async (e: FormEvent) => {
    e.preventDefault()
    if (!accountName.trim() || !niche.trim()) return
    setLoading(true); setError(''); setDenetim(null)
    try {
      const r = await apiFetch('/api/generate/channel-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, niche, platforms, bio, metrics, recentPosts, goal, model: selectedModel }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Denetim üretilemedi')
      setDenetim(d.denetim)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Kanal Denetimi" description="Tek skor, bu hafta yapılacak işler ve yol haritası" />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:h-full lg:flex-row lg:gap-6">
          <div className="w-full flex-shrink-0 lg:w-80">
            <form onSubmit={gonder} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hesap / kanal adı</label>
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className={alan} placeholder="Kade Media" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Niş</label>
                <input value={niche} onChange={(e) => setNiche(e.target.value)} className={alan} placeholder="teknoloji, yemek, vlog…" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Platformlar</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMLAR.map((p) => (
                    <button key={p} type="button" onClick={() => platformSec(p)}
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        platforms.includes(p)
                          ? 'border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] text-[color:var(--kade-a-600)]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200')}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Metrikler <span className="text-zinc-600">(puanlama buna dayanır)</span></label>
                <textarea value={metrics} onChange={(e) => setMetrics(e.target.value)} rows={4} className={cn(alan, 'resize-none')}
                  placeholder="Takipçi, ortalama izlenme, etkileşim oranı, CTR, aylık büyüme…" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Bio / profil <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className={cn(alan, 'resize-none')} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Son içerikler <span className="text-zinc-600">(opsiyonel)</span></label>
                <textarea value={recentPosts} onChange={(e) => setRecentPosts(e.target.value)} rows={3} className={cn(alan, 'resize-none')}
                  placeholder="Son 5 videonun başlığı ve izlenmesi" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Hedef <span className="text-zinc-600">(opsiyonel)</span></label>
                <input value={goal} onChange={(e) => setGoal(e.target.value)} className={alan} placeholder="6 ayda 100 bin abone" />
              </div>
              <button type="submit" disabled={loading || !accountName.trim() || !niche.trim()}
                className="w-full rounded-lg bg-[#f2c322] py-2.5 text-sm font-medium text-zinc-950 disabled:opacity-50">
                {loading ? 'Denetleniyor…' : 'Kanalı denetle'}
              </button>
            </form>
          </div>

          <div className="min-w-0 flex-1 space-y-5">
            {error && <div className="rounded-xl border border-[color:var(--kade-err-400)]/30 bg-[color:var(--kade-err-400)]/10 p-4 text-sm text-[color:var(--kade-err-400)]">{error}</div>}
            {loading && (
              <div className="flex h-64 items-center justify-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Kanal denetleniyor…
              </div>
            )}

            {!loading && !denetim && !error && (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-600">
                Hesap adı ve nişi gir, denetimi başlat
              </div>
            )}

            {denetim && !loading && (
              <>
                <div className="kade-vignette">
                  <div className="kade-vignette-head">
                    <span>Kanal sağlık skoru</span>
                    <i className="kade-vignette-dots" aria-hidden="true"><i /><i /><i /></i>
                  </div>
                  <p className="text-5xl font-light tracking-tight text-zinc-100">
                    {denetim.saglikSkoru}<span className="text-lg text-zinc-500"> / 100</span>
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-700/60">
                    <div className="h-full rounded-full bg-[image:var(--kade-gradient)]" style={{ width: `${denetim.saglikSkoru}%` }} />
                  </div>
                  {denetim.skorGerekcesi && <p className="mt-3 text-sm text-zinc-400">{denetim.skorGerekcesi}</p>}
                  {denetim.veriEksigi.length > 0 && (
                    <p className="mt-2 text-xs text-[color:var(--kade-warn-400)]">
                      Puanlanamayan: {denetim.veriEksigi.join(', ')}
                    </p>
                  )}
                </div>

                {denetim.boyutlar.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {denetim.boyutlar.map((b) => (
                      <div key={b.ad} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-zinc-200">{b.ad}</p>
                          <span className={cn('text-xs font-semibold', DURUM_RENK[b.durum])}>
                            {b.durum === 'veri_yok' ? DURUM_ETIKET[b.durum] : `${b.puan} · ${DURUM_ETIKET[b.durum]}`}
                          </span>
                        </div>
                        {b.yorum && <p className="mt-1.5 text-xs text-zinc-500">{b.yorum}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {denetim.hizliKazanimlar.length > 0 && (
                  <div>
                    <p className="kade-eyebrow">Bu hafta</p>
                    <div className="mt-3 grid gap-2">
                      {denetim.hizliKazanimlar.map((k, i) => (
                        <div key={i} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
                          <p className="text-sm font-medium text-zinc-100">{k.baslik}</p>
                          {k.neden && <p className="mt-1 text-xs text-zinc-500">{k.neden}</p>}
                          {k.rota && (
                            <Link href={alanYolu(k.rota)}
                              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--kade-accent-text)]">
                              {k.aracAdi} ile yap <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {denetim.yolHaritasi.length > 0 && (
                  <div>
                    <p className="kade-eyebrow">Yol haritası</p>
                    <div className="mt-3 grid gap-2">
                      {denetim.yolHaritasi.map((d) => (
                        <div key={d.donem} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-4">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="rounded-full border border-[color:var(--kade-line-strong)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-300">{d.donem}</span>
                            <p className="text-sm text-zinc-200">{d.hedef}</p>
                          </div>
                          <ul className="mt-2.5 space-y-1">
                            {d.isler.map((is, i) => (
                              <li key={i} className="flex gap-2 text-xs text-zinc-400">
                                <span className="text-[color:var(--kade-accent)]">·</span>{is}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
