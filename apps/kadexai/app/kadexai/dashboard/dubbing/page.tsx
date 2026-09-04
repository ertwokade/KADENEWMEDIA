'use client'

import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, Check, Download, Languages, Loader2, Mic2, Play, Video, Volume2,
} from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import TopBar from '@/components/layout/TopBar'
import CapabilityNotice from '@/components/ui/CapabilityNotice'
import { useModel } from '@/lib/context/ModelContext'
import { extractAudio, readMediaDuration } from '@/lib/media/extractAudio'
import { assembleDubTrack, type DubSegment } from '@/lib/media/dubMixer'
import { cuesToSrt, formatTimestamp, wordsToCues, type Cue } from '@/lib/subtitles/cues'
import { TTS_LANGUAGES, languageLabel } from '@/lib/subtitles/languages'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'audio' | 'transcribe' | 'translate' | 'tts' | 'mix' | 'done' | 'error'

const VOICES = [
  { id: 'nova', label: 'Nova', hint: 'Kadın · sıcak, anlatıcı' },
  { id: 'shimmer', label: 'Shimmer', hint: 'Kadın · enerjik' },
  { id: 'alloy', label: 'Alloy', hint: 'Nötr · dengeli' },
  { id: 'echo', label: 'Echo', hint: 'Erkek · sakin' },
  { id: 'onyx', label: 'Onyx', hint: 'Erkek · derin' },
  { id: 'fable', label: 'Fable', hint: 'Nötr · hikâye anlatıcı' },
]

// Seslendirme ucu istek basina 40 parca / 3000 karakter kabul ediyor.
const TTS_BATCH = 30

const PHASE_LABELS: Record<Phase, string> = {
  idle: '',
  audio: 'Ses çıkarılıyor',
  transcribe: 'Konuşma çözümleniyor',
  translate: 'Çeviri yapılıyor',
  tts: 'Seslendiriliyor',
  mix: 'Ses kurgulanıyor',
  done: 'Hazır',
  error: 'Hata',
}

export default function DubbingPage() {
  const { selectedModel } = useModel()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')

  const [sourceLang, setSourceLang] = useState('tr')
  const [targetLang, setTargetLang] = useState('en')
  const [voice, setVoice] = useState('nova')
  const [speed, setSpeed] = useState(1)
  const [originalVolume, setOriginalVolume] = useState(0.12)

  const [sourceCues, setSourceCues] = useState<Cue[]>([])
  const [dubCues, setDubCues] = useState<Cue[]>([])
  const [audioUrl, setAudioUrl] = useState('')
  const [mixInfo, setMixInfo] = useState<{ hizlandirilan: number; tasan: number } | null>(null)

  const busy = phase !== 'idle' && phase !== 'done' && phase !== 'error'
  const totalChars = useMemo(() => dubCues.reduce((sum, c) => sum + c.text.length, 0), [dubCues])

  const pickFile = async (picked: File | null) => {
    if (!picked) return
    setFile(picked)
    setError('')
    setPhase('idle')
    setSourceCues([])
    setDubCues([])
    setAudioUrl('')
    setDuration(await readMediaDuration(picked))
  }

  /** 1. adım: videodan konuşma metnini zaman damgalarıyla çıkar. */
  const transcribe = async () => {
    if (!file) return
    setError('')
    try {
      setPhase('audio')
      const audio = await extractAudio(file, setDetail)

      setPhase('transcribe')
      setDetail('Whisper konuşmayı çözüyor...')
      const form = new FormData()
      form.append('file', audio)
      const res = await apiFetch('/api/transcribe', { method: 'POST', body: form }, 180_000)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Transkripsiyon başarısız')

      const words = (json.words ?? []) as Array<{ word: string; start: number; end: number }>
      if (!words.length) throw new Error('Ses içinde konuşma bulunamadı.')

      // Dublaj kutulari altyazidan biraz daha uzun olabilir: cumle butunlugu
      // seslendirmede okunabilirlikten daha onemli.
      const cues = wordsToCues(words, { maxChars: 140, maxDuration: 8 })
      setSourceCues(cues)
      setSourceLang((json.language || 'tr').slice(0, 2))
      setPhase('done')
      setDetail(`${cues.length} konuşma bölümü bulundu.`)
    } catch (e) {
      setPhase('error')
      setError(e instanceof Error ? e.message : 'Transkripsiyon tamamlanamadı.')
    }
  }

  /** 2. adım: çevir → seslendir → zaman çizgisine yerleştir. */
  const dub = async () => {
    if (!sourceCues.length) return
    setError('')
    setAudioUrl('')
    setMixInfo(null)

    try {
      setPhase('translate')
      setDetail(`${languageLabel(targetLang)} çevirisi yapılıyor...`)
      const translateRes = await apiFetch(
        '/api/subtitles/translate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cues: sourceCues.map((c) => ({ index: c.index, text: c.text })),
            targetLang,
            sourceLang,
            model: selectedModel,
            mode: 'dubbing',
          }),
        },
        300_000
      )
      const translateJson = await translateRes.json()
      if (!translateRes.ok) throw new Error(translateJson.error || 'Çeviri başarısız')

      const map = new Map<number, string>(
        (translateJson.ceviriler ?? []).map((c: { index: number; text: string }) => [c.index, c.text])
      )
      const translated = sourceCues.map((c) => ({ ...c, text: map.get(c.index) ?? c.text }))
      setDubCues(translated)

      setPhase('tts')
      const parts: DubSegment[] = []
      for (let i = 0; i < translated.length; i += TTS_BATCH) {
        const batch = translated.slice(i, i + TTS_BATCH)
        setDetail(`Seslendiriliyor: ${Math.min(i + TTS_BATCH, translated.length)}/${translated.length} bölüm`)
        const res = await apiFetch(
          '/api/dubbing/tts',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              segments: batch.map((c) => ({ index: c.index, text: c.text })),
              voice,
              speed,
            }),
          },
          300_000
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Seslendirme başarısız')

        for (const part of json.parcalar ?? []) {
          const cue = translated.find((c) => c.index === part.index)
          if (cue && part.audio) parts.push({ index: cue.index, start: cue.start, end: cue.end, audio: part.audio })
        }
      }

      if (!parts.length) throw new Error('Hiçbir bölüm seslendirilemedi.')
      const completedIndexes = new Set(parts.map((part) => part.index))
      const missingCount = translated.filter((cue) => !completedIndexes.has(cue.index)).length
      if (missingCount > 0) {
        throw new Error(`Dublaj tamamlanmadı: ${missingCount}/${translated.length} bölüm seslendirilemedi. Eksik sesli dosya oluşturulmadı; lütfen yeniden dene.`)
      }

      setPhase('mix')
      setDetail('Ses parçaları zaman çizgisine yerleştiriliyor...')
      const result = await assembleDubTrack(parts, {
        duration,
        originalFile: file,
        originalVolume,
        onProgress: (done, total) => setDetail(`Ses çözülüyor: ${done}/${total}`),
      })

      setAudioUrl(URL.createObjectURL(result.blob))
      setMixInfo({ hizlandirilan: result.hizlandirilan, tasan: result.tasan })
      setPhase('done')
      setDetail(`Dublaj hazır — ${parts.length} bölüm seslendirildi.`)
    } catch (e) {
      setPhase('error')
      setError(e instanceof Error ? e.message : 'Dublaj tamamlanamadı.')
    }
  }

  const downloadSrt = () => {
    const blob = new Blob([cuesToSrt(dubCues)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dublaj-${targetLang}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Dublaj Stüdyosu" description="Videoyu otomatik olarak başka dillerde seslendir" />
      <div className="px-4 pt-4 sm:px-6"><CapabilityNotice need="transcribe" /></div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          {/* ── Sol: kaynak ve ayarlar ────────────────────────────────────── */}
          <div className="w-full flex-shrink-0 space-y-4 lg:w-80">
            <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">1 · Video</h3>
              <input
                ref={fileInput}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => void pickFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-4 text-center transition-colors hover:border-[#f2c322]/50 disabled:opacity-50"
              >
                <Video className="h-5 w-5 text-zinc-500" />
                <span className="text-xs text-zinc-400">{file ? file.name : 'Video veya ses dosyası seç'}</span>
                {duration > 0 && <span className="text-[10px] text-zinc-600">{formatTimestamp(duration, 'srt')}</span>}
              </button>
              <button
                type="button"
                onClick={transcribe}
                disabled={!file || busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2c322] py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-[#ffda3f] disabled:opacity-50"
              >
                {busy && (phase === 'audio' || phase === 'transcribe') ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic2 className="h-4 w-4" />
                )}
                Konuşmayı çöz
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <Languages className="h-3.5 w-3.5 text-zinc-400" />
                2 · Hedef dil ve ses
              </h3>

              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={busy}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-[#f2c322] focus:outline-none disabled:opacity-50"
              >
                {TTS_LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Ses karakteri</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={busy}
                      onClick={() => setVoice(v.id)}
                      title={v.hint}
                      className={cn(
                        'rounded-lg border py-1.5 text-xs transition-colors disabled:opacity-50',
                        voice === v.id
                          ? 'border-violet-500/40 bg-violet-500/20 text-violet-300'
                          : 'border-zinc-700 bg-zinc-800 text-zinc-500'
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  Konuşma hızı: {speed.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min={0.75}
                  max={1.4}
                  step={0.05}
                  value={speed}
                  disabled={busy}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-[#f2c322]"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                  <Volume2 className="h-3 w-3" />
                  Orijinal ses: %{Math.round(originalVolume * 100)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.02}
                  value={originalVolume}
                  disabled={busy}
                  onChange={(e) => setOriginalVolume(Number(e.target.value))}
                  className="w-full accent-[#f2c322]"
                />
                <p className="mt-1 text-[11px] text-zinc-600">
                  Arka planda kısık kalan orijinal ses, ortam sesini ve müziği korur.
                </p>
              </div>

              <button
                type="button"
                onClick={dub}
                disabled={!sourceCues.length || busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/20 py-2.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
              >
                {busy && phase !== 'audio' && phase !== 'transcribe' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Dublajı üret
              </button>

              {sourceCues.length > 0 && (
                <p className="text-[11px] text-zinc-500">
                  {sourceCues.length} bölüm · yaklaşık {Math.ceil(totalChars || sourceCues.reduce((s, c) => s + c.text.length, 0))} karakter
                </p>
              )}
            </div>

            {busy && (
              <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                <p className="flex items-center gap-2 text-sm text-zinc-300">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f2c322]" />
                  {PHASE_LABELS[phase]}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{detail}</p>
              </div>
            )}
          </div>

          {/* ── Sağ: sonuç ────────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {phase === 'done' && detail && !error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <Check className="h-4 w-4" />
                {detail}
              </div>
            )}

            {audioUrl && (
              <div className="mb-4 space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-100">
                  {languageLabel(targetLang)} dublaj sesi
                </h3>
                <audio controls src={audioUrl} className="w-full" />
                <div className="flex flex-wrap gap-2">
                  <a
                    href={audioUrl}
                    download={`dublaj-${targetLang}.wav`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#f2c322] px-3 py-1.5 text-xs font-medium text-zinc-950 transition-colors hover:bg-[#ffda3f]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Ses dosyasını indir (WAV)
                  </a>
                  <button
                    type="button"
                    onClick={downloadSrt}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#f2c322]/50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Çeviri altyazısı (SRT)
                  </button>
                </div>
                {mixInfo && mixInfo.hizlandirilan > 0 && (
                  <p className="text-[11px] text-amber-400">
                    {mixInfo.hizlandirilan} bölüm kendi süresine sığması için hızlandırıldı
                    {mixInfo.tasan > 0 && `, ${mixInfo.tasan} bölüm yine de taşıyor — o bölümlerin çevirisini kısaltmak senkronu düzeltir`}.
                  </p>
                )}
                <p className="text-[11px] text-zinc-500">
                  Ses ayrı bir dosyadır; videoya kurgu programında (veya ffmpeg ile) bindirilir.
                </p>
              </div>
            )}

            {sourceCues.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">
                  Bölümler — çeviri üretildikten sonra metni düzenleyip dublajı yeniden alabilirsin.
                </p>
                {sourceCues.map((cue) => {
                  const translated = dubCues.find((c) => c.index === cue.index)
                  return (
                    <div key={cue.index} className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="font-medium text-zinc-600">{cue.index}</span>
                        <span className="font-mono">
                          {formatTimestamp(cue.start, 'srt')} → {formatTimestamp(cue.end, 'srt')}
                        </span>
                        <span className="text-zinc-600">{(cue.end - cue.start).toFixed(1)} sn</span>
                      </div>
                      <p className="text-xs text-zinc-500">{cue.text}</p>
                      {translated && (
                        <textarea
                          value={translated.text}
                          onChange={(e) =>
                            setDubCues((prev) =>
                              prev.map((c) => (c.index === cue.index ? { ...c, text: e.target.value } : c))
                            )
                          }
                          rows={2}
                          className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-600">
                <Mic2 className="h-8 w-8 text-zinc-700" />
                <p>Bir video seç ve konuşmayı çöz.</p>
                <p className="text-xs">Ses tarayıcıda çıkarılır; çeviri ve seslendirme sunucuda yapılır.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
