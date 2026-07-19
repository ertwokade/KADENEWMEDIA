'use client'

import { apiFetch } from '@/lib/client/api'
import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import TopBar from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'
import {
  Upload, Scissors, Download, Zap, CheckCircle,
  Loader2, AlertCircle, Film, TrendingUp, Sparkles,
} from 'lucide-react'
import type { ClipSuggestion } from '@/app/api/generate/clips/route'
import { withBasePath } from '@/lib/appConfig'

// ─── WAV encoder (Web Audio API output → Groq-ready file) ─────────────────────
function encodeWAV(buffer: AudioBuffer): Blob {
  const numSamples = buffer.length
  const sampleRate = buffer.sampleRate
  const data = new Int16Array(numSamples)
  const ch = buffer.getChannelData(0)
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]))
    data[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const hdr = new ArrayBuffer(44)
  const v = new DataView(hdr)
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  ws(0, 'RIFF'); v.setUint32(4, 36 + data.byteLength, true)
  ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true)
  v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  ws(36, 'data'); v.setUint32(40, data.byteLength, true)
  const out = new Uint8Array(44 + data.byteLength)
  out.set(new Uint8Array(hdr))
  out.set(new Uint8Array(data.buffer), 44)
  return new Blob([out], { type: 'audio/wav' })
}

// ─── Audio extraction with Web Audio API (NO FFmpeg, NO download) ─────────────
async function extractAudio(file: File, onMsg: (m: string) => void): Promise<File> {
  type CaptureStreamVideo = HTMLVideoElement & { captureStream: () => MediaStream }
  // Yöntem 1: captureStream + MediaRecorder → WebM/Opus ~32kbps (en küçük boyut)
  const supportsCapture = typeof (HTMLVideoElement.prototype as Partial<CaptureStreamVideo>).captureStream === 'function'
  if (supportsCapture) {
    try {
      onMsg('Ses sıkıştırılıyor (WebM/Opus 16x hız)...')
      const blob = await new Promise<Blob>((resolve, reject) => {
        const video = document.createElement('video')
        const url = URL.createObjectURL(file)
        video.src = url; video.muted = false
        video.onloadedmetadata = () => {
          try {
            const stream = (video as CaptureStreamVideo).captureStream()
            const audioTracks = stream.getAudioTracks()
            if (!audioTracks.length) throw new Error('no audio')
            const mime = ['audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus']
              .find(t => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
            const chunks: Blob[] = []
            const rec = new MediaRecorder(new MediaStream(audioTracks), { mimeType: mime, audioBitsPerSecond: 32000 })
            rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
            rec.onstop = () => { URL.revokeObjectURL(url); resolve(new Blob(chunks, { type: mime })) }
            rec.onerror = reject
            video.playbackRate = 16; video.play(); rec.start(200)
            video.onended = () => rec.stop()
            setTimeout(() => { try { if (rec.state === 'recording') rec.stop() } catch {} }, 180000)
          } catch (err) { URL.revokeObjectURL(url); reject(err) }
        }
        video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load error')) }
      })
      onMsg('Ses hazır!')
      return new File([blob], 'audio.webm', { type: blob.type })
    } catch { /* fallback */ }
  }

  // Yöntem 2: Web Audio API → WAV 8 kHz (4 dakika video = ~3.7 MB, Groq destekler)
  onMsg('Ses kanalı ayrıştırılıyor...')
  const ab = await file.arrayBuffer()
  const tmpCtx = new AudioContext()
  let original: AudioBuffer
  try { original = await tmpCtx.decodeAudioData(ab) }
  catch { throw new Error('Video formatı desteklenmiyor. MP4 veya MOV kullan.') }
  finally { await tmpCtx.close() }
  onMsg('8 kHz WAV oluşturuluyor...')
  const SR = 8000
  const offline = new OfflineAudioContext(1, Math.ceil(original.duration * SR), SR)
  const src = offline.createBufferSource(); src.buffer = original; src.connect(offline.destination); src.start(0)
  return new File([encodeWAV(await offline.startRendering())], 'audio.wav', { type: 'audio/wav' })
}

// ─── Caption builder ──────────────────────────────────────────────────────────
function buildDrawtextFilter(words: ClipSuggestion['words'], clipStart: number): string {
  if (!words.length) return ''
  const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/'/g, "'").replace(/:/g, '\\:').replace(/,/g, '\\,').replace(/%/g, '\\%')
  const chunks: { text: string; start: number; end: number }[] = []
  for (let i = 0; i < words.length; i += 5) {
    const g = words.slice(i, i + 5)
    chunks.push({ text: g.map(w => w.word).join(' '), start: Math.max(0, g[0].start - clipStart), end: g[g.length - 1].end - clipStart + 0.1 })
  }
  return chunks.map(c => `drawtext=text='${esc(c.text)}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=h-220:box=1:boxcolor=black@0.55:boxborderw=14:enable='between(t,${c.start.toFixed(2)},${c.end.toFixed(2)})'`).join(',')
}

function scoreColor(s: number) { return s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400' }

type Step = 'idle' | 'audio' | 'transcribe' | 'analyze' | 'cut' | 'done' | 'error'
const stepOrder: Step[] = ['audio', 'transcribe', 'analyze', 'cut', 'done']
const STEPS = [
  { key: 'audio' as Step,      label: 'Ses çıkarılıyor',   detail: 'Web Audio API · Tarayıcıda, indirme yok' },
  { key: 'transcribe' as Step, label: 'Transkripsiyon',     detail: 'Groq Whisper · Ücretsiz' },
  { key: 'analyze' as Step,    label: 'Viral analiz',       detail: 'Groq LLaMA 3.3 70B · Ücretsiz' },
  { key: 'cut' as Step,        label: 'Klip kesiliyor',     detail: 'FFmpeg WASM · Sadece bu adımda yüklenir' },
]
const catColors: Record<string, string> = {
  knowledge: 'bg-blue-500/20 text-blue-300', emotional: 'bg-pink-500/20 text-pink-300',
  shocking: 'bg-red-500/20 text-red-300', inspirational: 'bg-violet-500/20 text-violet-300',
  entertainment: 'bg-amber-500/20 text-amber-300', bilgi: 'bg-blue-500/20 text-blue-300',
  duygusal: 'bg-pink-500/20 text-pink-300', şok: 'bg-red-500/20 text-red-300',
  ilham: 'bg-violet-500/20 text-violet-300', eğlence: 'bg-amber-500/20 text-amber-300',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClipGeneratorPage() {
  const [videoFile, setVideoFile]         = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [step, setStep]                   = useState<Step>('idle')
  const [stepMsg, setStepMsg]             = useState('')
  const [clips, setClips]                 = useState<ClipSuggestion[]>([])
  const [outputClips, setOutputClips]     = useState<Record<number, string>>({})
  const [cuttingId, setCuttingId]         = useState<number | null>(null)
  const [error, setError]                 = useState('')
  const [transcript, setTranscript]       = useState('')
  const [detectedLang, setDetectedLang]   = useState('')
  const [ffmpegLog, setFfmpegLog]         = useState('')
  const [ffmpegReady, setFfmpegReady]     = useState(false)

  const ffmpegRef = useRef<FFmpeg | null>(null)

  // FFmpeg yalnızca klip keserken lazy yüklenir
  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return
    const ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => setFfmpegLog(message))
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 60_000)
    try {
      await ffmpeg.load({
        classWorkerURL: `${window.location.origin}${withBasePath('/ffmpeg/worker.js')}`,
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
      }, { signal: controller.signal })
    } finally {
      window.clearTimeout(timeout)
    }
    ffmpegRef.current = ffmpeg
    setFfmpegReady(true)
  }, [])

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/')) { setError('Sadece video dosyası yükleyebilirsin.'); return }
    if (file.size > 500 * 1024 * 1024) { setError('Video 500 MB sınırını aşıyor. Daha kısa veya sıkıştırılmış bir dosya seç.'); return }
    setVideoFile(file); setClips([]); setOutputClips([]); setTranscript(''); setDetectedLang(''); setError(''); setStep('idle'); setFfmpegLog('')
    const url = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.src = url
    vid.onloadedmetadata = () => { setVideoDuration(vid.duration); URL.revokeObjectURL(url) }
  }

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleVideoSelect(f) }

  // ── Ana analiz: ses yerelde çıkarılır, API anahtarı yalnızca sunucuda kalır ──
  const handleAnalyze = async () => {
    if (!videoFile) return
    setError(''); setClips([]); setOutputClips({}); setFfmpegLog('')

    try {
      // 1. Ses çıkar (Web Audio API / MediaRecorder — indirme yok)
      setStep('audio')
      const audioFile = await extractAudio(videoFile, (msg) => setStepMsg(msg))

      // 2. Sesi güvenli sunucu route'u üzerinden metne çevir
      setStep('transcribe')
      setStepMsg('Ses güvenli biçimde metne çevriliyor...')
      const transcriptionForm = new FormData()
      transcriptionForm.append('file', audioFile)
      const whisperRes = await apiFetch(
        '/api/transcribe',
        { method: 'POST', body: transcriptionForm },
        110_000
      )
      const whisperData = await whisperRes.json()
      if (!whisperRes.ok) throw new Error(whisperData.error || 'Transkripsiyon hatası')

      const transcript: string = whisperData.text?.trim() ?? ''
      const words: Array<{ word: string; start: number; end: number }> = whisperData.words ?? []
      const detectedLanguage: string = whisperData.language ?? ''

      if (!transcript || transcript.length < 10) {
        throw new Error('Transkripsiyon boş. Videoda konuşma var mı?')
      }
      setTranscript(transcript)
      setDetectedLang(detectedLanguage)

      // 3. Viral klip analizi
      setStep('analyze')
      setStepMsg('Viral kısımlar analiz ediliyor...')
      const analyzeRes = await apiFetch('/api/generate/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, words, videoDuration }),
      })
      const analyzeData = await analyzeRes.json()
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analiz hatası')

      setClips(analyzeData.clips ?? [])
      setStep('done')
      setStepMsg('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setStep('error')
    }
  }

  // ── Klip kes: sadece burada FFmpeg yüklenir (lazy) ────────────────────────
  const cutClip = async (clip: ClipSuggestion) => {
    if (!videoFile) return
    setCuttingId(clip.id); setStep('cut'); setFfmpegLog('')

    try {
      // FFmpeg yoksa sadece şimdi yükle
      if (!ffmpegRef.current) {
        setStepMsg('FFmpeg yükleniyor (~30 MB, bir kere)...')
        await loadFFmpeg()
      }
      if (!ffmpegRef.current) throw new Error('FFmpeg yüklenemedi.')

      const ffmpeg = ffmpegRef.current
      setStepMsg(`Klip #${clip.id} kesiliyor...`)
      const outName = `clip_${clip.id}.mp4`
      const dtFilter = buildDrawtextFilter(clip.words, clip.start)
      const cropScale = 'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920'
      const vf = dtFilter ? `${cropScale},${dtFilter}` : cropScale

      await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile))
      await ffmpeg.exec(['-ss', String(clip.start), '-i', 'input.mp4', '-t', String(clip.end - clip.start), '-vf', vf, '-c:v', 'libx264', '-crf', '22', '-preset', 'ultrafast', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outName])

      const raw = await ffmpeg.readFile(outName) as Uint8Array
      const copy = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer
      setOutputClips(prev => ({ ...prev, [clip.id]: URL.createObjectURL(new Blob([copy], { type: 'video/mp4' })) }))
    } catch (err) {
      setError(`Klip #${clip.id} kesilirken hata: ${err instanceof Error ? err.message : 'bilinmeyen'}`)
    } finally {
      setCuttingId(null); setStep('done'); setStepMsg('')
    }
  }

  const stepIdx = stepOrder.indexOf(step)
  const isActive = step !== 'idle' && step !== 'done' && step !== 'error'

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Klip Üretici" description="Videodan viral 9:16 klipler — Reels · Shorts · TikTok" />

      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">

          {/* Sol panel */}
          <div className="w-full flex-shrink-0 lg:w-80 space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 text-xs font-medium">100% Ücretsiz — Groq Whisper + LLaMA 3.3</p>
            </div>

            {/* Upload */}
            <div
              onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('video-input')?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                videoFile ? 'border-violet-500/50 bg-violet-500/5' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/30'
              )}
            >
              <input id="video-input" type="file" accept="video/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])} />
              <Film className={cn('w-8 h-8 mx-auto mb-2', videoFile ? 'text-violet-400' : 'text-zinc-600')} />
              {videoFile ? (
                <>
                  <p className="text-zinc-200 text-sm font-medium truncate">{videoFile.name}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {videoDuration > 0 ? `${Math.floor(videoDuration / 60)}:${String(Math.round(videoDuration % 60)).padStart(2, '0')}` : '—'}
                    {' · '}{(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-zinc-400 text-sm">Video sürükle veya tıkla</p>
                  <p className="text-zinc-600 text-xs mt-1">MP4 · MOV · AVI · MKV · Boyut sınırı yok</p>
                </>
              )}
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!videoFile || isActive}
              className="w-full py-2.5 rounded-lg bg-[#f2c322] text-zinc-950 text-sm font-medium hover:bg-[#ffda3f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isActive
                ? <><Loader2 className="w-4 h-4 animate-spin" /> İşleniyor...</>
                : <><Zap className="w-4 h-4" /> Viral Kısımları Bul</>
              }
            </button>

            {/* FFmpeg sadece klip keserken yüklenir */}
            {ffmpegReady && (
              <div className="flex items-center gap-2 text-emerald-500 text-xs">
                <CheckCircle className="w-3 h-3" /> FFmpeg WASM hazır (klip kesmeye hazır)
              </div>
            )}

            {stepMsg && (
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-zinc-400 text-xs">
                {stepMsg}
              </div>
            )}

            {/* Progress */}
            {step !== 'idle' && (
              <div className="space-y-2.5 pt-1">
                {STEPS.map((s, i) => {
                  const sIdx = stepOrder.indexOf(s.key)
                  const isDone = stepIdx > sIdx
                  const isCur = stepOrder[stepIdx] === s.key
                  return (
                    <div key={s.key} className="flex items-start gap-2.5">
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5',
                        isDone ? 'bg-emerald-500 text-white' : isCur ? 'bg-[#f2c322] text-zinc-950' : 'bg-zinc-800 text-zinc-600')}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-xs font-medium', isDone ? 'text-emerald-400' : isCur ? 'text-violet-300' : 'text-zinc-600')}>{s.label}</span>
                          {isCur && <Loader2 className="w-3 h-3 animate-spin text-violet-400" />}
                        </div>
                        <p className="text-zinc-600 text-[10px]">{s.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {ffmpegLog && step === 'cut' && (
              <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-2">
                <p className="text-zinc-600 text-[10px] font-mono truncate">{ffmpegLog}</p>
              </div>
            )}

            {transcript && (
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Transkript</p>
                  {detectedLang && <span className="text-zinc-600 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded">{detectedLang}</span>}
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed line-clamp-5">{transcript}</p>
              </div>
            )}
          </div>

          {/* Sağ panel */}
          <div className="flex-1 min-w-0">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm flex gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            {clips.length > 0 && (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  <span className="text-violet-400 font-semibold">{clips.length}</span> viral klip bulundu
                  <span className="text-zinc-600"> — "Kes & İndir" ile 9:16 MP4 al</span>
                </p>
                {clips.map((clip) => {
                  const isProcessing = cuttingId === clip.id
                  const isReady = !!outputClips[clip.id]
                  const dur = Math.round(clip.end - clip.start)
                  return (
                    <div key={clip.id} className={cn('rounded-xl border p-4 transition-colors',
                      isReady ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-zinc-700/50 bg-zinc-800/50')}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-zinc-600 text-xs font-mono">#{clip.id}</span>
                            {clip.category && (
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', catColors[clip.category] ?? 'bg-zinc-700 text-zinc-300')}>
                                {clip.category}
                              </span>
                            )}
                            <span className="text-zinc-600 text-xs ml-auto">{clip.start.toFixed(1)}s–{clip.end.toFixed(1)}s · {dur}s</span>
                          </div>
                          <h3 className="text-zinc-100 font-semibold text-sm mb-1">{clip.title}</h3>
                          <p className="text-zinc-500 text-xs mb-1.5 italic line-clamp-1">"{clip.hook}"</p>
                          <p className="text-zinc-500 text-xs leading-relaxed">{clip.reason}</p>
                        </div>
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          <div className={cn('text-lg font-bold', scoreColor(clip.viralScore))}>{clip.viralScore}</div>
                          <TrendingUp className={cn('w-3.5 h-3.5', scoreColor(clip.viralScore))} />
                          <div className="h-12 w-2 rounded-full bg-zinc-800 overflow-hidden flex flex-col-reverse">
                            <div className={cn('w-full rounded-full', clip.viralScore >= 80 ? 'bg-emerald-500' : clip.viralScore >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ height: `${clip.viralScore}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-zinc-700/50">
                        {!isReady ? (
                          <button onClick={() => cutClip(clip)} disabled={isProcessing || cuttingId !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-medium hover:bg-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            {isProcessing ? <><Loader2 className="w-3 h-3 animate-spin" /> Kesiliyor...</> : <><Scissors className="w-3 h-3" /> Kes &amp; İndir</>}
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <a href={outputClips[clip.id]}
                              download={`viral_clip_${clip.id}_${clip.title.replace(/\s+/g, '_').slice(0, 30)}.mp4`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                              <Download className="w-3 h-3" /> İndir MP4 (9:16)
                            </a>
                            <video src={outputClips[clip.id]} controls className="rounded-lg bg-black mx-auto block"
                              style={{ height: '18rem', width: 'auto', aspectRatio: '9/16' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {!clips.length && step !== 'error' && (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
                <Upload className="w-10 h-10 text-zinc-800" />
                <p className="text-zinc-600 text-sm">Video yükle, viral kısımları bul</p>
                <div className="flex items-center gap-3 text-zinc-700 text-xs">
                  <span>Web Audio API</span><span>→</span><span>Groq Whisper</span><span>→</span><span>LLaMA 3.3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
