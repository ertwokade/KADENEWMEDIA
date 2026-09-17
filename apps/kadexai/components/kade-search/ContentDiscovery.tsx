'use client'

import { useMemo, useState } from 'react'
import {
  ArrowUpRight, Check, Clapperboard, Copy, ExternalLink, Loader2,
  Search, Sparkles, X,
} from 'lucide-react'
import { apiFetch, recordToolRun } from '@/lib/client/api'
import {
  DISCOVERY_LANGUAGES,
  type DiscoveryCoverage,
  type DiscoveryLanguage,
  type DiscoveryResult,
  type DiscoveryScript,
} from '@/lib/kade-search/discovery'
import { platformLabel } from '@/lib/kade-search/taxonomy'
import { fmtCount } from '@/lib/kade-search/util'
import { cn } from '@/lib/utils'

const COUNTRIES = [
  ['TR', 'Türkiye'], ['US', 'ABD'], ['GB', 'Birleşik Krallık'], ['DE', 'Almanya'],
  ['FR', 'Fransa'], ['ES', 'İspanya'], ['IT', 'İtalya'], ['BR', 'Brezilya'],
  ['JP', 'Japonya'], ['KR', 'Güney Kore'], ['IN', 'Hindistan'],
] as const

const PLATFORM_OPTIONS = [
  'tiktok', 'instagram', 'youtube_shorts', 'youtube', 'google', 'reddit',
] as const

const PERIODS = [
  [1, 'Son 24 saat'], [3, 'Son 3 gün'], [7, 'Son 7 gün'], [30, 'Son 30 gün'],
] as const

interface DiscoverResponse {
  searchedAt: string
  results: DiscoveryResult[]
  coverage: DiscoveryCoverage[]
  notices: string[]
}

interface ScriptResponse {
  script: DiscoveryScript
  model?: string
}

function scriptText(script: DiscoveryScript) {
  return [
    script.title,
    `Açı: ${script.angle}`,
    `Kanca: ${script.hook}`,
    '',
    ...script.scenes.flatMap((scene) => [
      `SAHNE ${scene.order} · ${scene.time}`,
      `Görsel: ${scene.visual}`,
      `Anlatım: ${scene.narration}`,
      `Ekran yazısı: ${scene.onScreenText}`,
      `Kamera: ${scene.camera}`,
      `Geçiş: ${scene.transition}`,
      '',
    ]),
    `Seslendirme:\n${script.voiceover}`,
    `Caption:\n${script.caption}`,
    `CTA: ${script.cta}`,
    script.hashtags.join(' '),
    `Prodüksiyon notları:\n${script.productionNotes.map((note) => `• ${note}`).join('\n')}`,
  ].join('\n').trim()
}

export default function ContentDiscovery() {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState<DiscoveryLanguage>('tr')
  const [country, setCountry] = useState('TR')
  const [periodDays, setPeriodDays] = useState(7)
  const [platforms, setPlatforms] = useState<string[]>([...PLATFORM_OPTIONS])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState<DiscoverResponse | null>(null)
  const [selected, setSelected] = useState<DiscoveryResult | null>(null)
  const [scriptLanguage, setScriptLanguage] = useState<DiscoveryLanguage>('tr')
  const [durationSec, setDurationSec] = useState(45)
  const [script, setScript] = useState<DiscoveryScript | null>(null)
  const [scriptModel, setScriptModel] = useState('')
  const [scriptLoading, setScriptLoading] = useState(false)
  const [scriptError, setScriptError] = useState('')
  const [copied, setCopied] = useState(false)

  const visibleCoverage = useMemo(() => response?.coverage.filter((row) => row.platform !== 'music') ?? [], [response])

  const togglePlatform = (platform: string) => {
    setPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform])
  }

  const search = async () => {
    if (query.trim().length < 2 || loading || !platforms.length) return
    setLoading(true)
    setError('')
    setResponse(null)
    try {
      const result = await apiFetch('/api/kade-search/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), language, country, periodDays, platforms }),
      }, 70_000)
      const json = await result.json()
      if (!result.ok) throw new Error(json.error || 'İçerik araması tamamlanamadı.')
      setResponse(json as DiscoverResponse)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İçerik araması tamamlanamadı.')
    } finally {
      setLoading(false)
    }
  }

  const selectResult = (result: DiscoveryResult) => {
    setSelected(result)
    setScript(null)
    setScriptError('')
    setCopied(false)
    setScriptLanguage(language)
    setDurationSec(Math.max(30, Math.min(90, result.durationSec || 45)))
  }

  const generateScript = async () => {
    if (!selected || scriptLoading) return
    setScriptLoading(true)
    setScriptError('')
    setScript(null)
    try {
      const result = await apiFetch('/api/kade-search/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: selected, language: scriptLanguage, durationSec }),
      }, 130_000)
      const json = await result.json() as ScriptResponse & { error?: string }
      if (!result.ok || !json.script) throw new Error(json.error || 'Sahneli video metni üretilemedi.')
      setScript(json.script)
      setScriptModel(json.model || '')
      recordToolRun({ tool: 'kade-search', model: json.model, input: { title: selected.title, url: selected.url, language: scriptLanguage, durationSec }, output: JSON.stringify(json.script) })
    } catch (cause) {
      setScriptError(cause instanceof Error ? cause.message : 'Sahneli video metni üretilemedi.')
    } finally {
      setScriptLoading(false)
    }
  }

  const copyScript = async () => {
    if (!script) return
    await navigator.clipboard.writeText(scriptText(script))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/25">
      <div className="border-b border-zinc-800 p-4 sm:p-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-300">
              <Sparkles className="h-4 w-4" /> Canlı içerik keşfi
            </p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-100">Konuyu yaz, platformlardaki en güçlü güncel içerikleri bul.</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Tahmin kayıtları sıralamaya alınmaz. Canlı ve ölçülmüş sonuçlar kaynak, izlenme ve tazelikle birlikte gösterilir.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:w-[820px] 2xl:grid-cols-[minmax(220px,1fr)_140px_140px_125px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void search()}
                maxLength={120}
                placeholder="örn. yapay zeka reklamı, kahve tarifi"
                aria-label="Aranacak içerik"
                className="min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-10 pr-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-700 focus:border-violet-500"
              />
            </div>
            <select aria-label="Arama dili" value={language} onChange={(event) => setLanguage(event.target.value as DiscoveryLanguage)} className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500">
              {Object.entries(DISCOVERY_LANGUAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select aria-label="Arama ülkesi" value={country} onChange={(event) => setCountry(event.target.value)} className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500">
              {COUNTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select aria-label="Arama dönemi" value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus:border-violet-500">
              {PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={() => void search()} disabled={loading || query.trim().length < 2 || !platforms.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50 sm:col-span-2 xl:col-span-4 2xl:col-span-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} {loading ? 'Aranıyor' : 'Ara'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORM_OPTIONS.map((platform) => <button key={platform} type="button" onClick={() => togglePlatform(platform)} className={cn('rounded-full border px-2.5 py-1 text-[11px] transition', platforms.includes(platform) ? 'border-violet-500/40 bg-violet-500/15 text-violet-200' : 'border-zinc-800 text-zinc-600')}>{platformLabel(platform)}</button>)}
        </div>
      </div>

      {error && <div role="alert" className="m-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {response && (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm font-semibold text-zinc-100">{response.results.length} doğrulanmış sonuç</p>
            {visibleCoverage.map((item) => <span key={item.platform} title={item.note} className={cn('rounded-full border px-2 py-1 text-[10px]', item.mode === 'live' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : item.mode === 'measured' ? 'border-sky-500/30 bg-sky-500/10 text-sky-300' : 'border-zinc-800 text-zinc-600')}>{platformLabel(item.platform)} · {item.count}</span>)}
          </div>
          {response.notices.map((notice) => <p key={notice} className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-200">{notice}</p>)}

          {response.results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">Bu dil, ülke ve dönemde gerçek ölçümlü eşleşme bulunamadı. Dönemi genişlet veya daha genel bir kelime dene.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {response.results.map((result, index) => (
                <article key={`${result.id}:${result.url}`} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/55">
                  {result.thumbnail && <div role="img" aria-label={`${result.title} küçük resmi`} className="aspect-video w-full bg-zinc-900 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(result.thumbnail).slice(1, -1)})` }} />}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <div className="flex flex-wrap gap-1.5"><span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-300">#{index + 1} genel</span><span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">#{result.platformRank} {platformLabel(result.platform)}</span></div>
                      <span className={result.fresh ? 'text-emerald-400' : 'text-zinc-600'}>{result.fresh ? '● güncel' : 'ölçülmüş'}</span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-zinc-100">{result.title}</h3>
                    {result.author && <p className="mt-1 truncate text-[11px] text-zinc-600">{result.author}</p>}
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-zinc-900 p-2 text-center">
                      <div><p className="text-xs font-semibold text-zinc-200">{fmtCount(result.views || result.posts)}</p><p className="text-[9px] uppercase text-zinc-600">{result.views ? 'izlenme' : 'hacim'}</p></div>
                      <div><p className="text-xs font-semibold text-zinc-200">{fmtCount(result.likes + result.comments + result.shares)}</p><p className="text-[9px] uppercase text-zinc-600">etkileşim</p></div>
                      <div><p className="text-xs font-semibold text-amber-300">{result.popularityScore}</p><p className="text-[9px] uppercase text-zinc-600">güncel skor</p></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => selectResult(result)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f2c322] px-3 text-xs font-semibold text-zinc-950 hover:bg-[#ffda3f]"><Clapperboard className="h-3.5 w-3.5" /> Sahneli metin yaz</button>
                      <a href={result.url} target="_blank" rel="noreferrer noopener" aria-label="Kaynak içeriği aç" className="grid min-h-10 w-10 place-items-center rounded-lg border border-zinc-700 text-zinc-400 hover:text-white"><ExternalLink className="h-4 w-4" /></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/65" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-4 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-[#f2c322]">Özgün video senaryosu</p><h2 className="mt-1 text-lg font-semibold text-zinc-100">{selected.title}</h2><p className="mt-1 text-xs text-zinc-500">{platformLabel(selected.platform)} · {fmtCount(selected.views || selected.posts)} hacim · kaynak metni kopyalanmaz</p></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Senaryo panelini kapat" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_150px_auto]">
              <select aria-label="Senaryo dili" value={scriptLanguage} onChange={(event) => setScriptLanguage(event.target.value as DiscoveryLanguage)} className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-[#f2c322]">{Object.entries(DISCOVERY_LANGUAGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <select aria-label="Video süresi" value={durationSec} onChange={(event) => setDurationSec(Number(event.target.value))} className="min-h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-[#f2c322]">{[15, 30, 45, 60, 90].map((seconds) => <option key={seconds} value={seconds}>{seconds} saniye</option>)}</select>
              <button type="button" onClick={() => void generateScript()} disabled={scriptLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f2c322] px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50">{scriptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{scriptLoading ? 'Yazılıyor' : 'Senaryoyu üret'}</button>
            </div>
            {scriptError && <p role="alert" className="mt-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{scriptError}</p>}

            {script && <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4"><div className="flex justify-between gap-3"><div><p className="text-xs text-violet-300">{script.language} · {script.durationSec} saniye{scriptModel ? ` · ${scriptModel}` : ''}</p><h3 className="mt-1 font-semibold text-zinc-100">{script.title}</h3></div><button type="button" onClick={() => void copyScript()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-600 px-2.5 text-xs text-zinc-300">{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Kopyalandı' : 'Kopyala'}</button></div><p className="mt-3 text-sm leading-6 text-zinc-200"><b>Kanca:</b> {script.hook}</p><p className="mt-2 text-xs leading-5 text-zinc-400"><b>Açı:</b> {script.angle}</p></div>
              <div className="space-y-3">{script.scenes.map((scene) => <article key={`${scene.order}:${scene.time}`} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#f2c322]">SAHNE {scene.order}</p><span className="text-[11px] text-zinc-500">{scene.time}</span></div><p className="mt-2 text-sm leading-6 text-zinc-200">{scene.visual}</p><dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><div><dt className="text-zinc-600">ANLATIM</dt><dd className="mt-0.5 leading-5 text-zinc-400">{scene.narration}</dd></div><div><dt className="text-zinc-600">EKRAN YAZISI</dt><dd className="mt-0.5 leading-5 text-zinc-400">{scene.onScreenText}</dd></div><div><dt className="text-zinc-600">KAMERA</dt><dd className="mt-0.5 leading-5 text-zinc-400">{scene.camera}</dd></div><div><dt className="text-zinc-600">GEÇİŞ</dt><dd className="mt-0.5 leading-5 text-zinc-400">{scene.transition}</dd></div></dl></article>)}</div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tam seslendirme</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">{script.voiceover}</p><p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Caption ve CTA</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-300">{script.caption}</p><p className="mt-2 text-sm text-[#f2c322]">{script.cta}</p><p className="mt-2 text-sm text-violet-300">{script.hashtags.join(' ')}</p></div>
              {script.productionNotes.length > 0 && <div className="rounded-xl border border-zinc-800 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Prodüksiyon notları</p><ul className="mt-2 space-y-1 text-sm text-zinc-400">{script.productionNotes.map((note) => <li key={note}>• {note}</li>)}</ul></div>}
              <a href={selected.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:text-white">Kaynak içeriği aç <ArrowUpRight className="h-4 w-4" /></a>
            </div>}
          </aside>
        </div>
      )}
    </section>
  )
}
