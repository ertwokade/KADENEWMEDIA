'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  if (saniye == null || !Number.isFinite(saniye) || saniye < 0) return null
  saniye = Math.floor(saniye)
  const dakika = Math.floor(saniye / 60)
  const kalan = saniye % 60
  return dakika ? `${dakika}:${String(kalan).padStart(2, '0')}` : `0:${String(kalan).padStart(2, '0')}`
}

function sourceLink(value: string) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined }
  catch { return undefined }
}

function sayiMetni(deger: number | null) {
  if (deger == null) return null
  if (deger >= 1_000_000) return `${(deger / 1_000_000).toFixed(1)}M`
  if (deger >= 1_000) return `${(deger / 1_000).toFixed(1)}B`
  return String(deger)
}

export default function MateryalPage() {
  const [materyaller, setMateryaller] = useState<MaterialRow[]>([])
  const [toplam, setToplam] = useState<number | null>(null)
  const [canCollect, setCanCollect] = useState(false)
  const [devamiVar, setDevamiVar] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [devamYukleniyor, setDevamYukleniyor] = useState(false)
  const [bozukResimler, setBozukResimler] = useState<Set<string>>(new Set())
  const [onizlemeHatasi, setOnizlemeHatasi] = useState(false)
  const requestId = useRef(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [sonKosu, setSonKosu] = useState<RunRow | null>(null)
  const [arama, setArama] = useState('')
  const [tur, setTur] = useState('')
  const [toplamaOzeti, setToplamaOzeti] = useState<string | null>(null)
  const [sirala, setSirala] = useState('yeni')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [toplaniyor, setToplaniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [acik, setAcik] = useState<MaterialRow | null>(null)

  const getir = useCallback(async (offset = 0) => {
    const request = ++requestId.current
    if (offset) setDevamYukleniyor(true)
    else { setYukleniyor(true); setDevamYukleniyor(false) }
    setHata(null)
    try {
      const params = new URLSearchParams({ sort: sirala, limit: '60', offset: String(offset) })
      if (arama.trim()) params.set('q', arama.trim())
      if (tur) params.set('kind', tur)
      const cevap = await apiFetch(apiPath(`/api/materials?${params}`))
      const veri = await cevap.json()
      if (request !== requestId.current) return
      if (!cevap.ok) throw new Error(veri?.error || 'Materyaller getirilemedi.')
      if (!Array.isArray(veri.materyaller) || !Number.isFinite(veri.istatistik?.toplam)) throw new Error('Materyal yanıtı doğrulanamadı.')
      setMateryaller(previous => offset ? [...new Map([...previous, ...veri.materyaller].map(item => [item.id, item])).values()] : veri.materyaller)
      setToplam(veri.istatistik.toplam)
      setCanCollect(veri.canCollect === true)
      setDevamiVar(veri.materyaller.length === 60)
      setNextOffset(offset + veri.materyaller.length)
      setSonKosu(veri.istatistik?.sonKosu ?? null)
    } catch (e) {
      if (request !== requestId.current) return
      if (!offset) { setMateryaller([]); setToplam(null); setSonKosu(null); setDevamiVar(false) }
      setHata(e instanceof Error ? e.message : 'Materyaller getirilemedi.')
    } finally {
      if (request === requestId.current) { setYukleniyor(false); setDevamYukleniyor(false) }
    }
  }, [arama, sirala, tur])

  const invalidateRequest = useCallback(() => { requestId.current++ }, [])
  useEffect(() => {
    const zamanlayici = setTimeout(() => void getir(), arama ? 350 : 0)
    return () => { clearTimeout(zamanlayici); invalidateRequest() }
  }, [getir, arama, invalidateRequest])

  useEffect(() => {
    if (!acik || !dialogRef.current) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [acik])

  const topla = useCallback(async () => {
    setToplaniyor(true)
    setHata(null)
    try {
      const cevap = await apiFetch(apiPath('/api/materials/sync'), { method: 'POST' })
      const veri = await cevap.json()
      if (!cevap.ok) throw new Error(veri?.error || 'Toplama başarısız.')
      /* Kaynak adları kullanıcıya gösterilmiyor; yalnızca toplam sonuç. */
      const toplam = veri.toplam ?? { found: 0, inserted: 0 }
      const eksikler = Array.isArray(veri.sonuclar) ? veri.sonuclar.filter((result: { ok: boolean }) => !result.ok).length : 0
      setToplamaOzeti(`${toplam.found} kayıt tarandı · ${toplam.inserted} yeni eklendi${eksikler ? ` · ${eksikler} kaynak tamamlanamadı veya yapılandırılmamış.` : ''}`)
      await getir()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Toplama başarısız.')
    } finally {
      setToplaniyor(false)
    }
  }, [getir])

  const ozet = useMemo(() => {
    if (toplam == null) return 'İstatistik henüz doğrulanmadı'
    if (!sonKosu?.finished_at) return 'Henüz toplama yapılmadı'
    const tarih = new Date(sonKosu.finished_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
    if (sonKosu.ok) return `Son toplama ${tarih} · ${sonKosu.found} kayıt tarandı, ${sonKosu.inserted} yeni`
    return sonKosu.error ? `Son deneme ${tarih} · ${sonKosu.error}` : `Son toplama ${tarih} · tamamlanamadı`
  }, [sonKosu, toplam])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Materyal Kütüphanesi" description="Video ve fotoğraf materyalleri" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--kade-faint)]" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Başlıkta ara"
              aria-label="Materyal başlığında ara"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--kade-surface-soft)] border border-[var(--kade-line)] text-sm outline-none focus:border-[var(--kade-accent)]"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[var(--kade-line)] p-1">
            {KINDS.map((k) => (
              <button
                key={k.key || 'tum'}
                type="button"
                onClick={() => setTur(k.key)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-md transition-colors',
                  tur === k.key ? 'bg-[var(--kade-accent)] text-black' : 'text-[var(--kade-faint)] hover:text-[var(--kade-ink)]'
                )}
              >
                {k.label}
              </button>
            ))}
          </div>

          <select
            value={sirala}
            aria-label="Materyal sıralaması"
            onChange={(e) => setSirala(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--kade-surface-soft)] border border-[var(--kade-line)] text-sm outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {canCollect && <button
            type="button"
            onClick={topla}
            disabled={toplaniyor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--kade-accent)] text-black text-sm font-semibold disabled:opacity-60"
          >
            {toplaniyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Kütüphaneyi tazele
          </button>}
        </div>

        <p className="text-xs text-[var(--kade-faint)]">
          {toplam == null ? 'Materyal sayısı henüz doğrulanmadı' : `Havuzda ${toplam.toLocaleString('tr-TR')} materyal`} · {ozet}
        </p>

        {toplamaOzeti && (
          <p className="text-xs text-[var(--kade-faint)] border-l-2 border-[var(--kade-accent)] pl-3">{toplamaOzeti}</p>
        )}

        {hata && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{hata}
            <button type="button" onClick={() => void getir()} className="ml-3 underline">Yeniden dene</button>
          </div>
        )}

        {yukleniyor ? (
          <div className="flex items-center justify-center py-20 text-[var(--kade-faint)]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : materyaller.length === 0 && !hata ? (
          <div className="rounded-xl border border-dashed border-[var(--kade-line)] px-6 py-16 text-center">
            <p className="text-sm text-[var(--kade-faint)]">
              {arama.trim() || tur ? 'Bu filtrelerle eşleşen materyal yok.' : 'Henüz materyal eklenmemiş.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {materyaller.map((m) => (
              <div
                key={m.id}
                className="group rounded-xl overflow-hidden border border-[var(--kade-line)] bg-[var(--kade-surface-soft)] transition-colors hover:border-[var(--kade-accent)]"
              >
                <button
                  type="button"
                  onClick={() => { setOnizlemeHatasi(false); setAcik(m) }}
                  className="relative block w-full aspect-video bg-black/30 overflow-hidden cursor-zoom-in"
                  aria-label={`${m.title} önizle`}
                >
                  {(m.thumbnail || (m.kind === 'photo' && m.media_url)) && !bozukResimler.has(m.id) ? (
                    // Kaynak CDN'i Next image loader'inda tanimli olmadigi icin dogrudan img.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiPath(`/api/materials/thumbnail?id=${encodeURIComponent(m.id)}`)}
                      alt={m.title}
                      loading="lazy"
                      onError={() => setBozukResimler(previous => new Set(previous).add(m.id))}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[var(--kade-faint)]">
                      {m.kind === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      {bozukResimler.has(m.id) && <span className="text-xs">Küçük resim yüklenemedi</span>}
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
                  <div className="flex items-center gap-3 text-[11px] text-[var(--kade-faint)]">
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
                      href={apiPath(`/api/materials/download?id=${encodeURIComponent(m.id)}`)}
                      className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[var(--kade-faint)] hover:text-[var(--kade-ink)]"
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
        {devamiVar && !yukleniyor && (
          <button type="button" disabled={devamYukleniyor} onClick={() => void getir(nextOffset)} className="px-4 py-2 border border-[var(--kade-line)] rounded-lg text-sm disabled:opacity-60">
            {devamYukleniyor ? 'Yükleniyor…' : 'Daha fazla materyal göster'}
          </button>
        )}
      </div>

      {acik && (
        /* Önizleme: video ise yerinde oynatılır, fotoğraf ise büyütülür. */
        <dialog
          ref={dialogRef}
          className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-xl border border-[var(--kade-line)] bg-[var(--kade-surface-soft)] p-4 text-[var(--kade-ink)] backdrop:bg-black/80"
          aria-labelledby="material-preview-title"
          onCancel={() => setAcik(null)}
          onClick={(event) => { if (event.target === event.currentTarget) setAcik(null) }}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setAcik(null)}
              className="ml-auto mb-3 flex items-center gap-1 min-h-11 px-3 text-sm"
            >
              <X className="w-4 h-4" /> Kapat
            </button>
            {onizlemeHatasi || (!acik.media_url && !acik.thumbnail) ? (
              <p role="status" className="py-16 text-center">Önizleme açılamadı. Materyali kaynak sayfasından inceleyebilirsin.</p>
            ) : acik.kind === 'video' && acik.media_url ? (
              <video src={acik.media_url} poster={acik.thumbnail ? apiPath(`/api/materials/thumbnail?id=${encodeURIComponent(acik.id)}`) : undefined} onError={() => setOnizlemeHatasi(true)} controls autoPlay className="w-full max-h-[65dvh] rounded-xl bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={apiPath(`/api/materials/thumbnail?id=${encodeURIComponent(acik.id)}`)} onError={() => setOnizlemeHatasi(true)} alt={acik.title} className="w-full max-h-[65dvh] object-contain rounded-xl" />
            )}
            <div className="flex items-center justify-between gap-4 mt-3">
              <p id="material-preview-title" className="text-sm">{acik.title}</p>
              {acik.media_url && (
                <a
                  href={apiPath(`/api/materials/download?id=${encodeURIComponent(acik.id)}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--kade-accent)] text-black text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </a>
              )}
            </div>
            {sourceLink(acik.page_url) && <a href={sourceLink(acik.page_url)} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm underline">Kaynak sayfasını aç</a>}
          </div>
        </dialog>
      )}
    </div>
  )
}
