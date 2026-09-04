'use client'

/*
 * Sayfa mimarisi:
 * 1. Stüdyo: kaynak/döküm + marka sesi -> çoklu format paketi
 * 2. Kitaplık: kullanıcıya ait kalıcı içerik paketleri
 * 3. Marka sesi: örnekleri saklama ve ses gücü görünümü
 * Mevcut TopBar, model seçici, API istemcisi ve KadexAI renk/boşluk sistemi kullanılır.
 */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen, Check, Copy, ExternalLink, FileAudio, FileText, Library,
  Loader2, MessageCircle, Mic2, RefreshCw, Scissors, Search, Sparkles, Upload,
} from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import RawModelOutput from '@/components/ui/RawModelOutput'
import { apiFetch } from '@/lib/client/api'
import { useModel } from '@/lib/context/ModelContext'
import { withBasePath } from '@/lib/appConfig'
import { cn, copyToClipboard } from '@/lib/utils'
import type { ContentStudioPackage } from '@/lib/contentStudio'

type View = 'studio' | 'library' | 'voice'
type OutputTab = 'short-video' | 'thread' | 'linkedin' | 'newsletter' | 'captions' | 'summary' | 'quotes' | 'evidence'

interface Run {
  id: string
  source_title: string
  source_url: string | null
  output: ContentStudioPackage
  model: string
  created_at: string
}

interface Voice {
  samples: string[]
  strength: number
  updated_at: string
}

const outputTabs: Array<{ id: OutputTab; label: string }> = [
  { id: 'short-video', label: 'Kısa video' },
  { id: 'thread', label: 'X / Threads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'newsletter', label: 'Bülten' },
  { id: 'captions', label: 'Açıklamalar' },
  { id: 'summary', label: 'Özet' },
  { id: 'quotes', label: 'Alıntılar' },
  { id: 'evidence', label: 'Kaynak kontrolü' },
]

function packageText(content: ContentStudioPackage, tab: OutputTab) {
  if (tab === 'short-video') return [
    `INSTAGRAM REELS\n${content.shortVideos?.reels || ''}`,
    `TIKTOK\n${content.shortVideos?.tiktok || ''}`,
    `YOUTUBE SHORTS\n${content.shortVideos?.shorts || ''}`,
  ].join('\n\n')
  if (tab === 'thread') return content.thread.map((item, index) => `${index + 1}/${content.thread.length}\n${item}`).join('\n\n')
  if (tab === 'linkedin') return content.linkedIn
  if (tab === 'newsletter') return `${content.newsletter.subject}\n\n${content.newsletter.body}`.trim()
  if (tab === 'captions') return [
    `INSTAGRAM\n${content.captions.instagram}`,
    `TIKTOK\n${content.captions.tiktok}`,
    `YOUTUBE\n${content.captions.youtube}`,
  ].join('\n\n')
  if (tab === 'summary') return content.summary.map((item) => `• ${item}`).join('\n')
  if (tab === 'quotes') return content.quotes.map((item) => `“${item.replace(/^“|”$/g, '')}”`).join('\n\n')
  return content.evidence.map((item, index) => `${index + 1}. ${item.claim}\nKanıt: ${item.evidence}`).join('\n\n')
}

export default function ContentStudioPage() {
  const params = useSearchParams()
  const { selectedModel } = useModel()
  const [view, setView] = useState<View>('studio')
  const [outputTab, setOutputTab] = useState<OutputTab>('short-video')
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [voice, setVoice] = useState<Voice | null>(null)
  const [voiceSamples, setVoiceSamples] = useState(['', ''])
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [savingVoice, setSavingVoice] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiFetch('/api/content-studio')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İçerik stüdyosu yüklenemedi.')
      const nextRuns = (data.runs ?? []) as Run[]
      const nextVoice = (data.voice ?? null) as Voice | null
      setRuns(nextRuns)
      setVoice(nextVoice)
      if (nextVoice?.samples?.length) setVoiceSamples([...nextVoice.samples, ''].slice(0, 3))
      const requestedRun = params?.get('run')
      const match = requestedRun ? nextRuns.find((item) => item.id === requestedRun) : null
      if (match) {
        setSelectedRun(match)
        setView('studio')
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İçerik stüdyosu yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => { void load() }, [load])

  const filteredRuns = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR')
    if (!normalized) return runs
    return runs.filter((run) => `${run.source_title} ${run.output.title} ${run.output.sourceSummary}`.toLocaleLowerCase('tr-TR').includes(normalized))
  }, [query, runs])

  const changeSample = (index: number, value: string) => {
    setVoiceSamples((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const saveVoice = async () => {
    setSavingVoice(true); setError(''); setNotice('')
    try {
      const response = await apiFetch('/api/content-studio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_voice', samples: voiceSamples }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Marka sesi kaydedilemedi.')
      setVoice(data.voice)
      setNotice('Marka sesi kaydedildi. Bundan sonraki paketler bu üslubu kullanacak.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Marka sesi kaydedilemedi.')
    } finally { setSavingVoice(false) }
  }

  const uploadAndTranscribe = async (file: File) => {
    setTranscribing(true); setError(''); setNotice('')
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await apiFetch('/api/transcribe', { method: 'POST', body: form }, 180_000)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Dosya çözümlenemedi.')
      setSourceText(data.text || '')
      if (!sourceTitle) setSourceTitle(file.name.replace(/\.[^.]+$/, ''))
      setNotice('Döküm hazır. Metni kontrol edip içerik paketini oluşturabilirsin.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dosya çözümlenemedi.')
    } finally { setTranscribing(false) }
  }

  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    setGenerating(true); setError(''); setNotice(''); setSelectedRun(null)
    try {
      const response = await apiFetch('/api/content-studio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate', sourceTitle, sourceUrl, sourceText,
          voiceSamples, model: selectedModel,
        }),
      }, 180_000)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İçerik paketi oluşturulamadı.')
      const run = data.run as Run
      setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)])
      setSelectedRun(run)
      setOutputTab('short-video')
      setNotice('İçerik paketi hazır ve kitaplığa kaydedildi.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İçerik paketi oluşturulamadı.')
    } finally { setGenerating(false) }
  }

  const sendWhatsApp = async (run: Run) => {
    setSending(true); setError(''); setNotice('')
    try {
      const response = await apiFetch('/api/content-studio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'notify', runId: run.id }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'WhatsApp mesajı gönderilemedi.')
      setNotice('Seçtiğin içerik paketi WhatsApp’a gönderildi.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'WhatsApp mesajı gönderilemedi.')
    } finally { setSending(false) }
  }

  const copyActive = async () => {
    if (!selectedRun) return
    await copyToClipboard(packageText(selectedRun.output, outputTab))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const openRun = (run: Run) => {
    setSelectedRun(run)
    setOutputTab('short-video')
    setView('studio')
    window.history.replaceState(window.history.state, '', withBasePath(`/dashboard/content-studio?run=${run.id}`))
  }

  return (
    <div className="kade-content-studio flex h-full flex-col bg-zinc-950">
      <TopBar title="İçerik Stüdyosu" description="Bir kaynaktan, kendi marka sesinle haftalık yayın paketi" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
        <section className="mx-auto max-w-7xl space-y-5">
          <div className="kade-content-studio-hero overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-violet-950/40 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-violet-300"><Sparkles className="h-4 w-4" /> Kaynak bağlı üretim</p>
                <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Bir kayıt girer. Bir haftalık içerik çıkar.</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Dökümde söylenmeyeni uydurmadan Reels, TikTok ve Shorts senaryoları; X dizisi, LinkedIn gönderisi, bülten, platform açıklamaları, özet ve gerçek alıntılar üretir.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={withBasePath('/dashboard/kade-search')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-violet-500/50 hover:text-white"><Search className="h-4 w-4" /> KadeSearch’ten konu seç</Link>
                <Link href={withBasePath('/dashboard/clip-generator')} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-violet-500/50 hover:text-white"><Scissors className="h-4 w-4" /> Viral klip çıkar</Link>
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/70 p-1.5">
            {([
              ['studio', 'Stüdyo', FileText],
              ['library', `Kitaplık · ${runs.length}`, Library],
              ['voice', `Marka sesi · ${voice?.strength ?? 0}%`, Mic2],
            ] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setView(id)} className={cn('inline-flex min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition', view === id ? 'bg-violet-500 text-white' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200')}><Icon className="h-4 w-4" /> {label}</button>
            ))}
          </div>

          {notice && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{notice}</div>}
          {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

          {loading ? <div className="grid min-h-72 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-violet-400" /></div> : view === 'studio' ? (
            <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
              <form onSubmit={generate} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-300">01 · Kaynak</p><h2 className="mt-1 text-lg font-semibold text-white">Dinlediğimiz kayıt</h2></div><span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-500">1 AI çalıştırması</span></div>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Kaynak başlığı</span><input value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} maxLength={180} placeholder="Video, podcast veya yazı başlığı" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-violet-500/70" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Kaynak bağlantı <span className="text-zinc-600">(opsiyonel, referans için)</span></span><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} inputMode="url" placeholder="https://youtube.com/watch?v=…" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-violet-500/70" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Metin veya döküm</span><textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} minLength={120} maxLength={16000} rows={10} placeholder="Kaynak metni ya da video/podcast dökümünü buraya yapıştır…" className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-violet-500/70" /><span className="mt-1 block text-right text-[10px] text-zinc-600">{sourceText.length.toLocaleString('tr-TR')} / 16.000</span></label>
                <label className={cn('flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-4 text-xs font-medium text-zinc-400 transition hover:border-violet-500/60 hover:text-violet-300', transcribing && 'pointer-events-none opacity-60')}><input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,video/mp4,video/webm" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAndTranscribe(file) }} />{transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {transcribing ? 'Döküm çıkarılıyor…' : 'Ses veya video yükle · 25 MB'}</label>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"><div className="flex items-center justify-between"><span className="text-xs font-medium text-zinc-400">Marka sesi</span><button type="button" onClick={() => setView('voice')} className="text-[11px] font-medium text-violet-300 hover:text-violet-200">Düzenle →</button></div><p className="mt-1 text-xs leading-5 text-zinc-600">{voice?.samples?.length ? `${voice.samples.length} örnek · ses gücü %${voice.strength}` : 'Örnek yok; doğal profesyonel ton kullanılır.'}</p></div>
                <button type="submit" disabled={generating || sourceText.trim().length < 120} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {generating ? '10 format hazırlanıyor…' : 'Haftalık paket oluştur'}</button>
                <p className="text-center text-[10px] leading-4 text-zinc-600">Gerçek kullanım token defterine kaydedilir. Kaynakta olmayan iddialar yasaktır.</p>
              </form>

              <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5">
                {generating ? <div className="grid min-h-[520px] place-items-center text-center"><div><Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-400" /><p className="mt-4 text-sm font-medium text-zinc-300">Kaynak okunuyor ve marka sesine uyarlanıyor</p><p className="mt-1 text-xs text-zinc-600">Döküm → kaynak kontrolü → 3 kısa video + 7 yayın formatı → kitaplık</p></div></div> : selectedRun ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Hazır · kitaplığa kaydedildi</p><h2 className="mt-1 text-xl font-semibold text-white">{selectedRun.output.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{selectedRun.output.sourceSummary}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => void copyActive()} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />} {copied ? 'Kopyalandı' : 'Kopyala'}</button><button onClick={() => void sendWhatsApp(selectedRun)} disabled={sending} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} WhatsApp</button></div></div>
                    {selectedRun.source_url && <a href={selectedRun.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"><ExternalLink className="h-3.5 w-3.5" /> Kaynağı aç</a>}
                    <div className="flex gap-1 overflow-x-auto border-b border-zinc-800 pb-2">{outputTabs.map((item) => <button key={item.id} onClick={() => setOutputTab(item.id)} className={cn('whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium', outputTab === item.id ? 'bg-violet-500/15 text-violet-300' : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300')}>{item.label}</button>)}</div>
                    <pre className="min-h-[360px] whitespace-pre-wrap break-words rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-7 text-zinc-300">{packageText(selectedRun.output, outputTab) || 'Bu format için içerik dönmedi. Kaynak metni genişletip yeniden deneyebilirsin.'}</pre>
                    <RawModelOutput content={selectedRun.output.raw} />
                    <p className="text-[10px] text-zinc-600">{new Date(selectedRun.created_at).toLocaleString('tr-TR')} · {selectedRun.model}</p>
                  </div>
                ) : <div className="grid min-h-[520px] place-items-center text-center"><div className="max-w-sm"><FileAudio className="mx-auto h-10 w-10 text-zinc-700" /><p className="mt-4 text-sm font-medium text-zinc-300">Kaynağını ekle, yayın paketini tek seferde al</p><p className="mt-2 text-xs leading-5 text-zinc-600">Çıktılar kaynak kanıtlarıyla birlikte burada görünecek ve kitaplığa kalıcı olarak kaydedilecek.</p></div></div>}
              </div>
            </div>
          ) : view === 'library' ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Başlık, kaynak veya özet ara…" className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-violet-500/60" /></label><button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs text-zinc-400 hover:text-white"><RefreshCw className="h-4 w-4" /> Yenile</button></div>
              {filteredRuns.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredRuns.map((run) => <article key={run.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5"><div className="flex items-start justify-between gap-3"><BookOpen className="h-5 w-5 shrink-0 text-violet-400" /><span className="text-[10px] text-zinc-600">{new Date(run.created_at).toLocaleDateString('tr-TR')}</span></div><h2 className="mt-4 text-base font-semibold text-white">{run.output.title || run.source_title}</h2><p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">{run.output.sourceSummary || run.source_title}</p><div className="mt-4 flex flex-wrap gap-1.5 text-[10px] text-zinc-500"><span className="rounded-full border border-zinc-800 px-2 py-1">{run.output.thread?.length ?? 0} post</span><span className="rounded-full border border-zinc-800 px-2 py-1">{run.output.quotes?.length ?? 0} alıntı</span><span className="rounded-full border border-zinc-800 px-2 py-1">{run.model}</span></div><div className="mt-auto flex gap-2 pt-5"><button onClick={() => openRun(run)} className="flex-1 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-400">Paketi aç</button><button aria-label="WhatsApp’a gönder" onClick={() => void sendWhatsApp(run)} disabled={sending} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-300 disabled:opacity-50"><MessageCircle className="h-4 w-4" /></button></div></article>)}</div> : <div className="rounded-2xl border border-dashed border-zinc-800 p-14 text-center"><Library className="mx-auto h-10 w-10 text-zinc-700" /><p className="mt-4 text-sm text-zinc-400">Kitaplığında henüz içerik paketi yok.</p><button onClick={() => setView('studio')} className="mt-3 text-xs font-medium text-violet-300">İlk paketini oluştur →</button></div>}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-violet-300">Marka sesi</p><h2 className="mt-1 text-xl font-semibold text-white">Kendi yazdığın örnekleri öğret</h2><p className="mt-2 text-sm leading-6 text-zinc-500">KadexAI örneklerdeki bilgileri değil; ritim, cümle uzunluğu, kelime seçimi ve tonu kullanır.</p></div>{voiceSamples.map((sample, index) => <label key={index} className="block"><span className="mb-1.5 block text-xs font-medium text-zinc-400">Yazı örneği {String(index + 1).padStart(2, '0')}</span><textarea value={sample} onChange={(event) => changeSample(index, event.target.value)} maxLength={4000} rows={5} placeholder="Kendi yazdığın bir gönderi, bülten veya açıklamayı yapıştır…" className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-violet-500/70" /></label>)}{voiceSamples.length < 3 && <button onClick={() => setVoiceSamples((current) => [...current, ''])} className="text-xs font-medium text-violet-300 hover:text-violet-200">+ Üçüncü örnek ekle</button>}<button onClick={() => void saveVoice()} disabled={savingVoice || !voiceSamples.some((sample) => sample.trim().length >= 30)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50">{savingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Marka sesini kaydet</button></div>
              <div className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/75 p-5"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Ses gücü</p><p className="mt-3 text-5xl font-semibold text-white">%{voice?.strength ?? 0}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${voice?.strength ?? 0}%` }} /></div><p className="mt-4 text-xs leading-5 text-zinc-500">{voice?.strength ? `${voice.samples.length} örnek kaydedildi. Daha uzun ve birbirini temsil eden örnekler ses tutarlılığını artırır.` : 'En az bir gerçek yazı örneği ekle. İki farklı format en iyi başlangıcı verir.'}</p><div className="mt-5 border-t border-zinc-800 pt-4 text-[11px] leading-5 text-zinc-600"><p>• Örnekler sadece sana ait paketlerde kullanılır.</p><p>• Kaynak gerçekleri ses örneklerinden alınmaz.</p><p>• İçeriklerin model eğitimi için paylaşılmaz.</p></div></div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
