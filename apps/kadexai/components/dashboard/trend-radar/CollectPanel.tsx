'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import { cn } from '@/lib/utils'

interface SourceInfo {
  id: string
  label: string
  configured: boolean
}

interface SourceProgress {
  id: string
  label: string
  status: 'bekliyor' | 'calisiyor' | 'bitti' | 'hata'
  found?: number
  added?: number
  note?: string
  error?: string
}

const COUNTRIES = ['TR', 'US', 'GB', 'DE', 'FR', 'ES']

/**
 * Toplama paneli.
 *
 * Her kaynak AYRI istekte calisir: tek istekte tum kaynaklari taramak
 * sunucusuz sure sinirini asiyordu. Panel sirayla ilerler, en sonda
 * `finalize` cagrisi capraz baglantilari ve skorlari hesaplar.
 */
export default function CollectPanel({
  sources,
  onDone,
}: {
  sources: SourceInfo[]
  onDone: () => void
}) {
  const [countries, setCountries] = useState<string[]>(['TR'])
  const [selected, setSelected] = useState<string[]>(sources.map((s) => s.id))
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<SourceProgress[]>([])
  const [summary, setSummary] = useState<string>('')
  const [error, setError] = useState('')

  const toggle = (list: string[], value: string, setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const run = async () => {
    if (!selected.length || !countries.length) return
    setRunning(true)
    setError('')
    setSummary('')

    const queue = sources.filter((s) => selected.includes(s.id))
    setProgress(queue.map((s) => ({ id: s.id, label: s.label, status: 'bekliyor' })))

    let runId: string | undefined
    let totalFound = 0
    let totalAdded = 0

    for (const source of queue) {
      setProgress((prev) => prev.map((p) => (p.id === source.id ? { ...p, status: 'calisiyor' } : p)))
      try {
        // Tek kaynagin taranmasi dakikalar surebilir; istemci zaman asimini uzat.
        const res = await apiFetch(
          '/api/kade-search/collect',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: source.id, countries, runId }),
          },
          300_000
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Toplama başarısız')

        runId = json.sonuc?.runId ?? runId
        totalFound += json.sonuc?.found ?? 0
        totalAdded += json.sonuc?.added ?? 0
        setProgress((prev) =>
          prev.map((p) =>
            p.id === source.id
              ? {
                  ...p,
                  status: json.sonuc?.errors?.length && !json.sonuc?.found ? 'hata' : 'bitti',
                  found: json.sonuc?.found,
                  added: json.sonuc?.added,
                  note: json.sonuc?.note,
                  error: json.sonuc?.errors?.[0],
                }
              : p
          )
        )
      } catch (e) {
        setProgress((prev) =>
          prev.map((p) =>
            p.id === source.id ? { ...p, status: 'hata', error: e instanceof Error ? e.message : 'Hata' } : p
          )
        )
      }
    }

    try {
      const res = await apiFetch(
        '/api/kade-search/collect',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ finalize: true }),
        },
        300_000
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Skorlama başarısız')
      setSummary(
        `${totalFound} kayıt (${totalAdded} yeni) · ${json.ozet?.scored ?? 0} trend skorlandı · ` +
          `${json.ozet?.links ?? 0} çapraz bağlantı · ${json.ozet?.breakouts ?? 0} patlama uyarısı`
      )
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skorlama tamamlanamadı')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Veri topla</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Kaynaklar sırayla taranır, sonra skorlar ve çapraz eşleşmeler hesaplanır.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ülkeler</label>
        <div className="flex flex-wrap gap-1.5">
          {COUNTRIES.map((c) => (
            <button
              key={c}
              type="button"
              disabled={running}
              onClick={() => toggle(countries, c, setCountries)}
              className={cn(
                'rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-50',
                countries.includes(c)
                  ? 'border-[#f2c322]/40 bg-[#f2c322]/10 text-[#f2c322]'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-500'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kaynaklar</label>
        <div className="space-y-1">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={running}
              onClick={() => toggle(selected, s.id, setSelected)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors disabled:opacity-50',
                selected.includes(s.id)
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-700 bg-zinc-800/30 text-zinc-500'
              )}
            >
              <span>{s.label}</span>
              {!s.configured && (
                <span className="text-[10px] text-amber-400" title="Anahtar/çerez tanımlı değil — çıkarım moduna düşer">
                  anahtarsız
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running || !selected.length || !countries.length}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2c322] py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-[#ffda3f] disabled:opacity-50"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {running ? 'Toplanıyor...' : 'Toplamayı başlat'}
      </button>

      {progress.length > 0 && (
        <ul className="space-y-1 text-xs">
          {progress.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-2 text-zinc-400">
              <span className="flex items-center gap-1.5">
                {p.status === 'calisiyor' && <Loader2 className="h-3 w-3 animate-spin text-[#f2c322]" />}
                {p.status === 'bitti' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                {p.status === 'hata' && <AlertTriangle className="h-3 w-3 text-red-400" />}
                {p.status === 'bekliyor' && <span className="h-3 w-3 rounded-full border border-zinc-600" />}
                {p.label}
              </span>
              <span className="text-right text-zinc-500">
                {p.status === 'bitti' && `${p.found} kayıt (${p.added} yeni)`}
                {p.status === 'hata' && <span className="text-red-400">{p.error?.slice(0, 40)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {summary && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">{summary}</p>
      )}
      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}
