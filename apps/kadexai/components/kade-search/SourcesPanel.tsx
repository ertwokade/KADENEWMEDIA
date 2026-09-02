'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Plus, Radio, Trash2, XCircle } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { cn } from '@/lib/utils'

/**
 * KadeSearch kaynakları ve izleme listesi.
 *
 * Bu bilgi sistemde vardı ama hiçbir ekranda görünmüyordu: `/sources` ucunun
 * arayüzü hiç yoktu, izleme listesi ise ayrı bir sayfaya (Trend Radarı)
 * gömülüydü. Sonuç olarak "KadeSearch neyi tarıyor, nasıl yeni bir şey
 * eklerim" sorusunun cevabı panelde yoktu. Onay merkezinin içine alındı:
 * kararı verdiğin yerle taramayı yönettiğin yer aynı olsun.
 */

type Kaynak = {
  id: string
  label: string
  platforms?: string[]
  configured: boolean
}

type IzlemeSatiri = { term: string; note?: string | null }

export default function SourcesPanel() {
  const [kaynaklar, setKaynaklar] = useState<Kaynak[] | null>(null)
  const [izleme, setIzleme] = useState<IzlemeSatiri[]>([])
  const [terim, setTerim] = useState('')
  const [not, setNot] = useState('')
  const [islemde, setIslemde] = useState(false)
  const [hata, setHata] = useState('')

  const yukle = useCallback(async () => {
    try {
      const [k, i] = await Promise.all([
        apiFetch('/api/kade-search/sources').then((r) => (r.ok ? r.json() : null)),
        apiFetch('/api/kade-search/watchlist').then((r) => (r.ok ? r.json() : null)),
      ])
      setKaynaklar(k?.kaynaklar ?? [])
      setIzleme(i?.liste ?? [])
    } catch {
      setHata('Kaynak ve izleme listesi okunamadı.')
    }
  }, [])

  useEffect(() => { void yukle() }, [yukle])

  async function ekle(e: FormEvent) {
    e.preventDefault()
    const t = terim.trim()
    if (!t || islemde) return
    setIslemde(true); setHata('')
    try {
      const r = await apiFetch('/api/kade-search/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: t, note: not.trim() || undefined }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Eklenemedi.')
      setIzleme(d.liste ?? [])
      setTerim(''); setNot('')
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Eklenemedi.')
    } finally {
      setIslemde(false)
    }
  }

  async function cikar(term: string) {
    setIslemde(true); setHata('')
    try {
      const r = await apiFetch(`/api/kade-search/watchlist?term=${encodeURIComponent(term)}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Çıkarılamadı.')
      setIzleme(d.liste ?? [])
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Çıkarılamadı.')
    } finally {
      setIslemde(false)
    }
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 lg:grid-cols-2">
      <div>
        <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
          <Radio className="h-3.5 w-3.5" /> Taranan kaynaklar
        </p>
        {!kaynaklar ? (
          <p className="text-sm text-zinc-500">Yükleniyor…</p>
        ) : (
          <ul className="space-y-1.5">
            {kaynaklar.map((k) => (
              <li key={k.id} className="flex items-center gap-2 text-sm">
                {k.configured
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--kade-ok-400)]" />
                  : <XCircle className="h-3.5 w-3.5 shrink-0 text-zinc-600" />}
                <span className={k.configured ? 'text-zinc-200' : 'text-zinc-500'}>{k.label}</span>
                {k.platforms?.length ? (
                  <span className="ml-auto text-[11px] text-zinc-600">{k.platforms.join(', ')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-5 text-zinc-600">
          Sönük olanların anahtarı tanımlı değil; o kaynak taranmıyor.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
          İzlediğin terimler
        </p>

        <form onSubmit={ekle} className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={terim}
            onChange={(e) => setTerim(e.target.value)}
            placeholder="Yeni terim ekle…"
            maxLength={120}
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[color:var(--kade-a-500)] focus:outline-none"
          />
          <input
            value={not}
            onChange={(e) => setNot(e.target.value)}
            placeholder="Not (isteğe bağlı)"
            maxLength={200}
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-[color:var(--kade-a-500)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={islemde || !terim.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[image:var(--kade-gradient)] px-4 py-2 text-sm font-semibold text-[color:var(--kade-on-accent)] disabled:opacity-50"
          >
            {islemde ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Ekle
          </button>
        </form>

        {hata && <p className="mb-2 text-xs text-[color:var(--kade-err-400)]">{hata}</p>}

        {izleme.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Henüz terim yok. Eklediğin terimler her taramada ayrıca aranır.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {izleme.map((s) => (
              <li key={s.term} className={cn('flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm')}>
                <span className="text-zinc-200">{s.term}</span>
                {s.note && <span className="truncate text-[11px] text-zinc-600">{s.note}</span>}
                <button
                  type="button"
                  onClick={() => void cikar(s.term)}
                  disabled={islemde}
                  aria-label={`${s.term} terimini çıkar`}
                  className="ml-auto text-zinc-600 hover:text-[color:var(--kade-err-400)] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
