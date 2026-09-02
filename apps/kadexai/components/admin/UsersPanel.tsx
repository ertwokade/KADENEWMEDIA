'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Crown, Loader2, Search, X } from 'lucide-react'
import { apiPath } from '@/lib/appConfig'
import { cn } from '@/lib/utils'

type Kullanici = {
  userId: string
  eposta: string
  ad: string
  alan: string | null
  sahip: boolean
  paket: string
  paketTier: string | null
  paketBitis: string | null
  kayit: string
  sonGiris: string | null
  calisma: number
  sonCalisma: string | null
}

function tarih(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function gorece(iso: string | null) {
  if (!iso) return 'hiç'
  const fark = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(fark)) return '—'
  const gun = Math.floor(fark / 86_400_000)
  if (gun < 1) return 'bugün'
  if (gun === 1) return 'dün'
  if (gun < 30) return `${gun} gün önce`
  const ay = Math.floor(gun / 30)
  return ay < 12 ? `${ay} ay önce` : `${Math.floor(ay / 12)} yıl önce`
}

function PaketRozeti({ k }: { k: Kullanici }) {
  const stil = k.sahip
    ? 'border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] text-[color:var(--kade-a-600)]'
    : k.paketTier
      ? 'border-[color:var(--kade-ok-400)]/30 bg-[color:var(--kade-ok-400)]/10 text-[color:var(--kade-ok-400)]'
      : 'border-zinc-700 bg-zinc-800 text-zinc-400'
  return (
    <span className={cn('inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold', stil)}>
      {k.sahip && <Crown className="h-3 w-3" />}
      {k.paket}
    </span>
  )
}

/**
 * Hesap sahibinin kullanıcı listesi: kim kayıt olmuş, hangi paketi var,
 * çalışma alanı adresi ne ve ne kadar kullanmış.
 *
 * Kullanıcıların ürettiği içerik burada GÖSTERİLMEZ; uç da göndermez.
 */
export default function UsersPanel() {
  const [kullanicilar, setKullanicilar] = useState<Kullanici[] | null>(null)
  const [hata, setHata] = useState('')
  const [kirpildi, setKirpildi] = useState(false)
  const [arama, setArama] = useState('')
  const [suzgec, setSuzgec] = useState<'tumu' | 'odeyen' | 'ucretsiz'>('tumu')
  // Liste yalnızca okunabiliyordu: kimin ne paketi olduğu görünüyor ama
  // buradan değiştirilemiyordu.
  const [duzenlenen, setDuzenlenen] = useState<Kullanici | null>(null)
  const [islemde, setIslemde] = useState(false)
  const [islemHatasi, setIslemHatasi] = useState('')
  const [tier, setTier] = useState<'baslangic' | 'pro' | 'sinirsiz'>('pro')
  const [donem, setDonem] = useState<'monthly' | 'yearly'>('monthly')
  const [ay, setAy] = useState(1)

  useEffect(() => {
    let alive = true
    fetch(apiPath('/api/admin/users'))
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Liste alınamadı.')
        return d
      })
      .then((d) => {
        if (!alive) return
        setKullanicilar(d.kullanicilar ?? [])
        setKirpildi(Boolean(d.kirpildi))
      })
      .catch((e) => alive && setHata(e instanceof Error ? e.message : 'Hata'))
    return () => { alive = false }
  }, [])

  const gosterilen = useMemo(() => {
    if (!kullanicilar) return []
    const q = arama.trim().toLocaleLowerCase('tr-TR')
    return kullanicilar.filter((k) => {
      if (suzgec === 'odeyen' && !k.paketTier) return false
      if (suzgec === 'ucretsiz' && k.paketTier) return false
      if (!q) return true
      return `${k.eposta} ${k.ad} ${k.alan ?? ''}`.toLocaleLowerCase('tr-TR').includes(q)
    })
  }, [kullanicilar, arama, suzgec])

  async function paketiUygula(islem: 'ver' | 'kaldir') {
    if (!duzenlenen) return
    setIslemde(true)
    setIslemHatasi('')
    try {
      const r = await fetch(apiPath('/api/admin/users'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: duzenlenen.userId, islem, tier, donem, ay }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Paket güncellenemedi.')
      setKullanicilar((liste) =>
        (liste ?? []).map((k) =>
          k.userId === duzenlenen.userId
            ? {
                ...k,
                paket: d.paket ?? 'Ücretsiz',
                paketTier: d.paketTier ?? null,
                paketBitis: d.paketBitis ?? null,
              }
            : k,
        ),
      )
      setDuzenlenen(null)
    } catch (e) {
      setIslemHatasi(e instanceof Error ? e.message : 'Hata')
    } finally {
      setIslemde(false)
    }
  }

  const ozet = useMemo(() => {
    const t = kullanicilar ?? []
    return {
      toplam: t.length,
      odeyen: t.filter((k) => k.paketTier && !k.sahip).length,
      aktif30: t.filter((k) => k.sonCalisma && Date.now() - new Date(k.sonCalisma).getTime() < 30 * 86_400_000).length,
    }
  }, [kullanicilar])

  if (hata) {
    return (
      <div className="flex items-center gap-2 border border-[color:var(--kade-err-400)]/30 bg-[color:var(--kade-err-400)]/10 p-4 text-sm text-[color:var(--kade-err-400)]">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {hata}
      </div>
    )
  }

  if (!kullanicilar) {
    return <p className="p-4 text-sm text-zinc-400">Kullanıcılar yükleniyor…</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-px bg-zinc-700/50">
        {[
          { etiket: 'Kayıtlı kullanıcı', deger: ozet.toplam },
          { etiket: 'Paketi olan', deger: ozet.odeyen },
          { etiket: 'Son 30 günde aktif', deger: ozet.aktif30 },
        ].map((h) => (
          <div key={h.etiket} className="bg-zinc-900 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{h.etiket}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-100">{h.deger}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="E-posta, ad veya alan adresi ara…"
            className="w-full border border-zinc-700 bg-zinc-800 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[color:var(--kade-a-500)] focus:outline-none"
          />
        </div>
        {([
          ['tumu', 'Tümü'],
          ['odeyen', 'Paketi olan'],
          ['ucretsiz', 'Ücretsiz'],
        ] as const).map(([id, etiket]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSuzgec(id)}
            className={cn(
              'border px-3 py-2 text-xs font-semibold transition-colors',
              suzgec === id
                ? 'border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] text-[color:var(--kade-a-600)]'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200',
            )}
          >
            {etiket}
          </button>
        ))}
      </div>

      {kirpildi && (
        <p className="text-xs text-[color:var(--kade-warn-400)]">
          Liste ilk 500 hesapla sınırlı; daha fazlası için sayfalama gerekiyor.
        </p>
      )}

      <div className="overflow-x-auto border border-zinc-700/50">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700/50 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              <th className="p-3 font-bold">Kullanıcı</th>
              <th className="p-3 font-bold">Alan adresi</th>
              <th className="p-3 font-bold">Paket</th>
              <th className="p-3 font-bold text-right">Çalışma</th>
              <th className="p-3 font-bold">Son işlem</th>
              <th className="p-3 font-bold">Kayıt</th>
              <th className="p-3 font-bold text-right">Paket işlemi</th>
            </tr>
          </thead>
          <tbody>
            {gosterilen.map((k) => (
              <tr key={k.userId} className="border-b border-zinc-800 last:border-0">
                <td className="p-3">
                  <p className="font-medium text-zinc-100">{k.ad}</p>
                  <p className="text-xs text-zinc-500">{k.eposta}</p>
                </td>
                <td className="p-3 font-mono text-xs text-zinc-400">
                  {k.alan ? `/kadexai/${k.alan}` : '—'}
                </td>
                <td className="p-3">
                  <PaketRozeti k={k} />
                  {k.paketBitis && (
                    <p className="mt-1 text-[11px] text-zinc-500">{tarih(k.paketBitis)}&apos;e kadar</p>
                  )}
                </td>
                <td className="p-3 text-right tabular-nums text-zinc-300">{k.calisma}</td>
                <td className="p-3 text-xs text-zinc-400">{gorece(k.sonCalisma)}</td>
                <td className="p-3 text-xs text-zinc-400">{tarih(k.kayit)}</td>
                <td className="p-3 text-right">
                  {k.sahip ? (
                    <span className="text-[11px] text-zinc-500">kod tarafından</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDuzenlenen(k)
                        setIslemHatasi('')
                        setTier((k.paketTier as 'baslangic' | 'pro' | 'sinirsiz') || 'pro')
                      }}
                      className="border border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] px-3 py-1.5 text-xs font-semibold text-[color:var(--kade-a-600)]"
                    >
                      Değiştir
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {gosterilen.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-sm text-zinc-500">
                  Bu süzgeçle eşleşen kullanıcı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {duzenlenen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Paket değiştir"
          onClick={() => !islemde && setDuzenlenen(null)}
        >
          <div
            className="w-full max-w-md space-y-4 border border-zinc-700 bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="kade-eyebrow">Paket değiştir</p>
                <p className="mt-2 font-medium text-zinc-100">{duzenlenen.ad}</p>
                <p className="text-xs text-zinc-500">{duzenlenen.eposta}</p>
              </div>
              <button type="button" onClick={() => setDuzenlenen(null)} aria-label="Kapat" className="text-zinc-500 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Paket</label>
                <div className="flex gap-1.5">
                  {([['baslangic', 'Başlangıç'], ['pro', 'Pro'], ['sinirsiz', 'Sınırsız']] as const).map(([id, etiket]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTier(id)}
                      className={cn(
                        'flex-1 border px-3 py-2 text-xs font-semibold transition-colors',
                        tier === id
                          ? 'border-[color:var(--kade-a-200)] bg-[color:var(--kade-a-50)] text-[color:var(--kade-a-600)]'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                      )}
                    >
                      {etiket}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Dönem</label>
                  <select
                    value={donem}
                    onChange={(e) => setDonem(e.target.value as 'monthly' | 'yearly')}
                    className="w-full border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-[color:var(--kade-a-500)] focus:outline-none"
                  >
                    <option value="monthly">Aylık</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Süre (ay)</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={ay}
                    onChange={(e) => setAy(Math.min(36, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm tabular-nums text-zinc-100 focus:border-[color:var(--kade-a-500)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {islemHatasi && (
              <p className="border border-[color:var(--kade-err-400)]/30 bg-[color:var(--kade-err-400)]/10 p-2.5 text-xs text-[color:var(--kade-err-400)]">
                {islemHatasi}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={islemde}
                onClick={() => void paketiUygula('ver')}
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[image:var(--kade-gradient)] px-4 py-2.5 text-sm font-semibold text-[color:var(--kade-on-accent)] disabled:opacity-50"
              >
                {islemde && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Paketi ver
              </button>
              {duzenlenen.paketTier && (
                <button
                  type="button"
                  disabled={islemde}
                  onClick={() => void paketiUygula('kaldir')}
                  className="border border-[color:var(--kade-err-400)]/30 px-4 py-2.5 text-sm text-[color:var(--kade-err-400)] disabled:opacity-50"
                >
                  Paketi kaldır
                </button>
              )}
            </div>

            <p className="text-[11px] leading-5 text-zinc-500">
              Elle verilen paket satın alınanla aynı biçimde yazılır; kullanıcı aynı
              özelliklere kavuşur. İşlem denetim kaydına düşer.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
