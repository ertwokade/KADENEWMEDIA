'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock3, Download, Eye, Image as ImageIcon, Loader2, Play, RefreshCw, Search, Video, X } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { apiPath } from '@/lib/appConfig'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'

interface MaterialRow {
  id: string
  source: string
  kind: 'video' | 'photo'
  title: string
  description: string | null
  page_url: string
  media_url: string | null
  thumbnail: string | null
  duration_sec: number | null
  view_count: number | null
  published_at: string | null
}

interface RunRow {
  finished_at: string | null
  found: number
  inserted: number
  updated: number
  ok: boolean
  error: string | null
}

const KINDS: Array<{ key: string; label: string }> = [
  { key: '', label: 'Tümü' },
  { key: 'video', label: 'Video' },
  { key: 'photo', label: 'Fotoğraf' },
]

const SORTS: Array<{ key: string; label: string }> = [
  { key: 'yeni', label: 'En yeni' },
  { key: 'izlenme', label: 'En çok izlenen' },
  { key: 'sure', label: 'En uzun' },
]

function sureMetni(saniye: number | null) {
  if (!saniye) return null
  const dakika = Math.floor(saniye / 60)
  const kalan = saniye % 60
  return dakika ? `${dakika}:${String(kalan).padStart(2, '0')}` : `0:${String(kalan).padStart(2, '0')}`
}

function sayiMetni(deger: number | null) {
  if (deger == null) return null
  if (deger >= 1_000_000) return `${(deger / 1_000_000).toFixed(1)}M`
  if (deger >= 1_000) return `${(deger / 1_000).toFixed(1)}B`
  return String(deger)
}

export default function MateryalPage() {
  const [materyaller, setMateryaller] = useState<MaterialRow[]>([])
  const [toplam, setToplam] = useState(0)
  const [sonKosu, setSonKosu] = useState<RunRow | null>(null)
  const [arama, setArama] = useState('')
  const [tur, setTur] = useState('')
  const [toplamaOzeti, setToplamaOzeti] = useState<string | null>(null)
  const [sirala, setSirala] = useState('yeni')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplaniyor, setToplaniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [acik, setAcik] = useState<MaterialRow | null>(null)

  const getir = useCallback(async () => {
    setYukleniyor(true)
    setHata(null)
    try {
      const params = new URLSearchParams({ sort: sirala, limit: '60' })
      if (arama.trim()) params.set('q', arama.trim())
      if (tur) params.set('kind', tur)
      const cevap = await apiFetch(apiPath(`/api/materials?${params}`))
      const veri = await cevap.json()
      if (!cevap.ok) throw new Error(veri?.error || 'Materyaller getirilemedi.')
      setMateryaller(veri.materyaller ?? [])
      setToplam(veri.istatistik?.toplam ?? 0)
      setSonKosu(veri.istatistik?.sonKosu ?? null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Materyaller getirilemedi.')
    } finally {
      setYukleniyor(false)
    }
  }, [arama, sirala, tur])

  useEffect(() => {
    const zamanlayici = setTimeout(getir, arama ? 350 : 0)
    return () => clearTimeout(zamanlayici)
  }, [getir, arama])

  const topla = useCallback(async () => {
    setToplaniyor(true)
    setHata(null)
    try {
      const cevap = await apiFetch(apiPath('/api/materials/sync'), { method: 'POST' })
      const veri = await cevap.json()
      if (!cevap.ok) throw new Error(veri?.error || 'Toplama başarısız.')
      /* Kaynak adları kullanıcıya gösterilmiyor; yalnızca toplam sonuç. */
      const toplam = veri.toplam ?? { found: 0, inserted: 0 }
      setToplamaOzeti(`${toplam.found} kayıt tarandı · ${toplam.inserted} yeni eklendi`)
      await getir()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Toplama başarısız.')
    } finally {
      setToplaniyor(false)
    }
  }, [getir])

  const ozet = useMemo(() => {
    if (!sonKosu?.finished_at) return 'Henüz toplama yapılmadı'
    const tarih = new Date(sonKosu.finished_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
    return `Son toplama ${tarih} · ${sonKosu.found} kayıt tarandı, ${sonKosu.inserted} yeni`
  }, [sonKosu])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Materyal Kütüphanesi" description="Video ve fotoğraf materyalleri" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Başlıkta ara"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] p-1">
            {KINDS.map((k) => (
              <button
                key={k.key || 'tum'}
                type="button"
                onClick={() => setTur(k.key)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md transition-colors',
                  tur === k.key ? 'bg-[var(--accent)] text-black' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <select
            value={sirala}
            onChange={(e) => setSirala(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={topla}
            disabled={toplaniyor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-black text-sm font-semibold disabled:opacity-60"
          >
            {toplaniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Kütüphaneyi tazele
          </button>
        </div>

        <p className="text-xs text-[var(--muted)]">
          Havuzda {toplam.toLocaleString('tr-TR')} materyal · {ozet}
        </p>

        {toplamaOzeti && (
          <p className="text-xs text-[var(--muted)] border-l-2 border-[var(--accent)] pl-3">{toplamaOzeti}</p>
        )}

        {hata && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{hata}</div>
        )}

        {yukleniyor ? (
          <div className="flex items-center justify-center py-20 text-[var(--muted)]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : materyaller.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--muted)]">
              Havuz boş. &quot;Kaynağı tara&quot; ile arsivhub arşivini içeri alabilirsin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {materyaller.map((m) => (
              <div
                key={m.id}
                className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)]"
              >
                <button
                  type="button"
                  onClick={() => setAcik(m)}
                  className="relative block w-full aspect-video bg-black/30 overflow-hidden cursor-zoom-in"
                  aria-label={`${m.title} önizle`}
                >
                  {m.thumbnail ? (
                    // Kaynak CDN'i Next image loader'inda tanimli olmadigi icin dogrudan img.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.thumbnail}
                      alt={m.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[var(--muted)]">
                      {m.kind === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                    </div>
                  )}
                  {sureMetni(m.duration_sec) && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white tabular-nums">
                      {sureMetni(m.duration_sec)}
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <Play className="w-9 h-9 text-white" />
                  </span>
                </button>
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium line-clamp-2">{m.title}</p>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      {m.kind === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {m.kind === 'video' ? 'Video' : 'Fotoğraf'}
                    </span>
                    {sayiMetni(m.view_count) && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {sayiMetni(m.view_count)}
                      </span>
                    )}
                    {m.published_at && (
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {new Date(m.published_at).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                  {m.media_url && (
                    <a
                      href={m.media_url}
                      download
                      className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      İndir
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {acik && (
        /* Önizleme: video ise yerinde oynatılır, fotoğraf ise büyütülür. */
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAcik(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setAcik(null)}
              className="absolute -top-10 right-0 inline-flex items-center gap-1 text-sm text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" /> Kapat
            </button>
            {acik.kind === 'video' && acik.media_url ? (
              <video src={acik.media_url} poster={acik.thumbnail ?? undefined} controls autoPlay className="w-full rounded-xl bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={acik.media_url ?? acik.thumbnail ?? ''} alt={acik.title} className="w-full rounded-xl" />
            )}
            <div className="flex items-center justify-between gap-4 mt-3">
              <p className="text-sm text-white/90">{acik.title}</p>
              {acik.media_url && (
                <a
                  href={acik.media_url}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
