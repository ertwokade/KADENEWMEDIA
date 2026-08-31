'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, Check, Download, Loader2, Link2, Captions,
  Languages, MonitorPlay, Upload, Video, X,
} from 'lucide-react'
import { apiFetch } from '@/lib/client/api'
import TopBar from '@/components/layout/TopBar'
import CapabilityNotice from '@/components/ui/CapabilityNotice'
import { useModel } from '@/lib/context/ModelContext'
import { extractAudio, readMediaDuration } from '@/lib/media/extractAudio'
import {
  cuesToSrt, cuesToVtt, formatTimestamp, inspectCues, parseSubtitles,
  renumber, shiftCues, wordsToCues,
  type Cue,
} from '@/lib/subtitles/cues'
import { LANGUAGES, languageLabel } from '@/lib/subtitles/languages'
import { cn } from '@/lib/utils'

type Step = 'idle' | 'audio' | 'transcribe' | 'done' | 'error'

interface YouTubeStatus {
  connected: boolean
  clientConfigured: boolean
  encryptionConfigured: boolean
  channel: { id: string; title: string; thumbnail: string | null } | null
}

interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string | null
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SubtitlesPage() {
  const { selectedModel } = useModel()
  const fileInput = useRef<HTMLInputElement>(null)
  const srtInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(0)
  const [step, setStep] = useState<Step>('idle')
  const [stepMsg, setStepMsg] = useState('')
  const [error, setError] = useState('')

  // Dil kodu -> altyazi kutulari. Kaynak dil ilk uretilen izdir.
  const [tracks, setTracks] = useState<Record<string, Cue[]>>({})
  const [sourceLang, setSourceLang] = useState('tr')
  const [activeLang, setActiveLang] = useState('tr')
  const [translating, setTranslating] = useState('')
  const [targetLang, setTargetLang] = useState('en')

  const [yt, setYt] = useState<YouTubeStatus | null>(null)
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [videoId, setVideoId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [asDraft, setAsDraft] = useState(false)

  const cues = useMemo(() => tracks[activeLang] ?? [], [tracks, activeLang])
  const warnings = useMemo(() => inspectCues(cues), [cues])
  const languageTabs = Object.keys(tracks)

  const loadYouTubeStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/api/youtube/status')
      if (res.ok) setYt(await res.json())
    } catch {
      setYt(null)
    }
  }, [])

  useEffect(() => {
    void loadYouTubeStatus()

    // OAuth donusu: /api/youtube/callback bu sayfaya ?youtube=... ile doner.
    const params = new URLSearchParams(window.location.search)
    const state = params.get('youtube')
    if (state === 'baglandi') setUploadMsg('YouTube hesabı bağlandı.')
    else if (state === 'hata') setError(params.get('detay') || 'YouTube bağlantısı kurulamadı.')
    if (state) window.history.replaceState({}, '', window.location.pathname)
  }, [loadYouTubeStatus])

  const pickFile = async (picked: File | null) => {
    if (!picked) return
    setFile(picked)
    setError('')
    setStep('idle')
    setDuration(await readMediaDuration(picked))
  }

  const generate = async () => {
    if (!file) return
    setError('')
    setUploadMsg('')
    try {
      setStep('audio')
      const audio = await extractAudio(file, setStepMsg)

      setStep('transcribe')
      setStepMsg('Konuşma çözümleniyor (Whisper)...')
      const form = new FormData()
      form.append('file', audio)
      const res = await apiFetch('/api/transcribe', { method: 'POST', body: form }, 180_000)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Transkripsiyon başarısız')

      const words = (json.words ?? []) as Array<{ word: string; start: number; end: number }>
      if (!words.length) throw new Error('Ses içinde konuşma bulunamadı.')

      const generated = wordsToCues(words)
      const lang = (json.language || 'tr').slice(0, 2)
      setSourceLang(lang)
      setActiveLang(lang)
      setTracks({ [lang]: generated })
      setStep('done')
      setStepMsg(`${generated.length} altyazı kutusu üretildi.`)
    } catch (e) {
      setStep('error')
      setError(e instanceof Error ? e.message : 'Altyazı üretilemedi.')
    }
  }

  const importSubtitles = async (picked: File | null) => {
    if (!picked) return
    try {
      const parsed = parseSubtitles(await picked.text())
      if (!parsed.length) throw new Error('Dosyada altyazı kutusu bulunamadı.')
      setTracks((prev) => ({ ...prev, [sourceLang]: parsed }))
      setActiveLang(sourceLang)
      setStep('done')
      setStepMsg(`${parsed.length} kutu içe aktarıldı.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Altyazı dosyası okunamadı.')
    }
  }

  const updateCue = (index: number, patch: Partial<Cue>) => {
    setTracks((prev) => ({
      ...prev,
      [activeLang]: (prev[activeLang] ?? []).map((c) => (c.index === index ? { ...c, ...patch } : c)),
    }))
  }

  const removeCue = (index: number) => {
    setTracks((prev) => ({ ...prev, [activeLang]: renumber((prev[activeLang] ?? []).filter((c) => c.index !== index)) }))
  }

  const shiftAll = (seconds: number) => {
    setTracks((prev) => ({ ...prev, [activeLang]: shiftCues(prev[activeLang] ?? [], seconds) }))
  }

  const translate = async () => {
    const base = tracks[sourceLang]
    if (!base?.length || translating) return
    setTranslating(targetLang)
    setError('')
    try {
      const res = await apiFetch(
        '/api/subtitles/translate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cues: base.map((c) => ({ index: c.index, text: c.text })),
            targetLang,
            sourceLang,
            model: selectedModel,
            mode: 'subtitle',
          }),
        },
        300_000
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Çeviri başarısız')

      const map = new Map<number, string>((json.ceviriler ?? []).map((c: { index: number; text: string }) => [c.index, c.text]))
      const translated = base.map((c) => ({ ...c, text: map.get(c.index) ?? c.text }))
      setTracks((prev) => ({ ...prev, [targetLang]: translated }))
      setActiveLang(targetLang)
      if (json.atlanan > 0) setUploadMsg(`${json.atlanan} kutu çevrilemedi, kaynak metin korundu.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Çeviri tamamlanamadı.')
    } finally {
      setTranslating('')
    }
  }

  const connectYouTube = async () => {
    try {
      const res = await apiFetch('/api/youtube/connect')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Bağlantı başlatılamadı')
      window.location.href = json.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bağlantı başlatılamadı.')
    }
  }

  const disconnectYouTube = async () => {
    await apiFetch('/api/youtube/disconnect', { method: 'POST' })
    setVideos([])
    setVideoId('')
    void loadYouTubeStatus()
  }

  const loadVideos = async () => {
    try {
      const res = await apiFetch('/api/youtube/videos?limit=25')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Videolar alınamadı')
      setVideos(json.videolar ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Videolar alınamadı.')
    }
  }

  const uploadCaptions = async () => {
    if (!videoId || !cues.length) return
    setUploading(true)
    setError('')
    setUploadMsg('')
    try {
      const res = await apiFetch(
        '/api/youtube/captions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            language: activeLang,
            name: `KadexAI ${languageLabel(activeLang)}`,
            content: cuesToSrt(cues),
            format: 'srt',
            isDraft: asDraft,
          }),
        },
        180_000
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Yükleme başarısız')
      setUploadMsg(`Altyazı yüklendi: ${languageLabel(activeLang)}${asDraft ? ' (taslak)' : ''}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Altyazı yüklenemedi.')
    } finally {
      setUploading(false)
    }
  }

  const busy = step === 'audio' || step === 'transcribe'
  const ytUnavailable = yt && (!yt.clientConfigured || !yt.encryptionConfigured)

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Altyazı Stüdyosu" description="Videodan altyazı üret, çevir, düzenle ve YouTube'a yükle" />
      <div className="px-4 pt-4 sm:px-6"><CapabilityNotice need="transcribe" /></div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:gap-6">
          {/* ── Sol: kaynak, çeviri, YouTube ──────────────────────────────── */}
          <div className="w-full flex-shrink-0 space-y-4 lg:w-80">
            <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-100">1 · Kaynak</h3>
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
                onClick={generate}
                disabled={!file || busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2c322] py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-[#ffda3f] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
                {busy ? 'İşleniyor...' : 'Altyazı üret'}
              </button>

              <input
                ref={srtInput}
                type="file"
                accept=".srt,.vtt,text/plain"
                className="hidden"
                onChange={(e) => void importSubtitles(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => srtInput.current?.click()}
                className="w-full rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                Hazır SRT/VTT içe aktar
              </button>

              {busy && (
                <p className="flex items-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="h-3 w-3 animate-spin text-[#f2c322]" />
                  {stepMsg}
                </p>
              )}
              {step === 'done' && stepMsg && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Check className="h-3 w-3" />
                  {stepMsg}
                </p>
              )}
            </div>

            {languageTabs.length > 0 && (
              <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                  <Languages className="h-3.5 w-3.5 text-zinc-400" />
                  2 · Çeviri
                </h3>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                >
                  {LANGUAGES.filter((l) => l.code !== sourceLang).map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={translate}
                  disabled={Boolean(translating)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/20 py-2 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-500/30 disabled:opacity-50"
                >
                  {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                  {translating ? `${languageLabel(translating)} çevriliyor...` : 'Bu dile çevir'}
                </button>
                <p className="text-[11px] text-zinc-500">
                  Çeviri her zaman kaynak dilden ({languageLabel(sourceLang)}) yapılır, zamanlamalar korunur.
                </p>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-4">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
                <MonitorPlay className="h-3.5 w-3.5 text-red-400" />
                3 · YouTube&apos;a yükle
              </h3>

              {ytUnavailable && (
                <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                  {!yt?.clientConfigured
                    ? 'GOOGLE_OAUTH_CLIENT_ID ve GOOGLE_OAUTH_CLIENT_SECRET tanımlanmadan hesap bağlanamaz.'
                    : 'KADE_TOKEN_ENCRYPTION_KEY tanımlı değil; belirteç şifrelenemediği için bağlantı kapalı.'}
                </p>
              )}

              {yt?.connected ? (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-2">
                    <span className="truncate text-xs text-zinc-300">{yt.channel?.title}</span>
                    <button
                      type="button"
                      onClick={disconnectYouTube}
                      className="text-[11px] text-zinc-500 transition-colors hover:text-red-400"
                    >
                      Bağlantıyı kes
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={loadVideos}
                    className="w-full rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                  >
                    Videolarımı listele
                  </button>

                  {videos.length > 0 && (
                    <select
                      value={videoId}
                      onChange={(e) => setVideoId(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                    >
                      <option value="">Video seç...</option>
                      {videos.map((v) => (
                        <option key={v.id} value={v.id}>{v.title}</option>
                      ))}
                    </select>
                  )}

                  <input
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value.trim())}
                    placeholder="veya video ID / link yapıştır"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-[#f2c322] focus:outline-none"
                  />

                  <label className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <input
                      type="checkbox"
                      checked={asDraft}
                      onChange={(e) => setAsDraft(e.target.checked)}
                      className="accent-[#f2c322]"
                    />
                    Taslak olarak yükle (yayında görünmez)
                  </label>

                  <button
                    type="button"
                    onClick={uploadCaptions}
                    disabled={!videoId || !cues.length || uploading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/90 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Yükleniyor...' : `${languageLabel(activeLang)} altyazısını yükle`}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={connectYouTube}
                  disabled={Boolean(ytUnavailable)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-300 transition-colors hover:border-red-500/40 hover:text-zinc-100 disabled:opacity-50"
                >
                  <Link2 className="h-4 w-4" />
                  YouTube hesabını bağla
                </button>
              )}
            </div>
          </div>

          {/* ── Sağ: editör ───────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {uploadMsg && (
              <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {uploadMsg}
              </div>
            )}

            {languageTabs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-600">
                <Captions className="h-8 w-8 text-zinc-700" />
                <p>Bir video seç ve altyazı üret.</p>
                <p className="text-xs">Ses tarayıcıda çıkarılır, yalnızca ses dosyası sunucuya gider.</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {languageTabs.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setActiveLang(code)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        activeLang === code ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {languageLabel(code)}
                      {code === sourceLang && <span className="ml-1 text-[10px] opacity-60">kaynak</span>}
                    </button>
                  ))}

                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => shiftAll(-0.5)}
                      className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                      title="Tüm altyazıları yarım saniye geri al"
                    >
                      −0,5 sn
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftAll(0.5)}
                      className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:text-zinc-200"
                      title="Tüm altyazıları yarım saniye ileri al"
                    >
                      +0,5 sn
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(`altyazi-${activeLang}.srt`, cuesToSrt(cues))}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:border-[#f2c322]/50"
                    >
                      <Download className="h-3 w-3" /> SRT
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(`altyazi-${activeLang}.vtt`, cuesToVtt(cues))}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:border-[#f2c322]/50"
                    >
                      <Download className="h-3 w-3" /> VTT
                    </button>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-300">
                    {warnings.length} kutuda kalite uyarısı var (okuma hızı, süre veya çakışma). Aşağıda işaretli.
                  </div>
                )}

                <div className="space-y-2">
                  {cues.map((cue) => {
                    const cueWarnings = warnings.filter((w) => w.index === cue.index)
                    return (
                      <div
                        key={cue.index}
                        className={cn(
                          'rounded-xl border bg-zinc-800/50 p-3',
                          cueWarnings.length ? 'border-amber-500/30' : 'border-zinc-700/50'
                        )}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                          <span className="w-6 font-medium text-zinc-600">{cue.index}</span>
                          <input
                            value={formatTimestamp(cue.start, 'srt')}
                            onChange={(e) => {
                              const [h, m, rest] = e.target.value.split(':')
                              const [s, ms] = (rest ?? '0,0').split(',')
                              const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms ?? 0) / 1000
                              if (Number.isFinite(seconds)) updateCue(cue.index, { start: seconds })
                            }}
                            className="w-28 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300 focus:border-[#f2c322] focus:outline-none"
                          />
                          <span>→</span>
                          <input
                            value={formatTimestamp(cue.end, 'srt')}
                            onChange={(e) => {
                              const [h, m, rest] = e.target.value.split(':')
                              const [s, ms] = (rest ?? '0,0').split(',')
                              const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms ?? 0) / 1000
                              if (Number.isFinite(seconds)) updateCue(cue.index, { end: seconds })
                            }}
                            className="w-28 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300 focus:border-[#f2c322] focus:outline-none"
                          />
                          <span className="text-zinc-600">{(cue.end - cue.start).toFixed(1)} sn</span>
                          <button
                            type="button"
                            onClick={() => removeCue(cue.index)}
                            className="ml-auto text-zinc-600 transition-colors hover:text-red-400"
                            aria-label={`${cue.index}. kutuyu sil`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <textarea
                          value={cue.text}
                          onChange={(e) => updateCue(cue.index, { text: e.target.value })}
                          rows={2}
                          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-[#f2c322] focus:outline-none"
                        />

                        {cueWarnings.length > 0 && (
                          <p className="mt-1.5 text-[11px] text-amber-400">
                            {cueWarnings.map((w) => w.message).join(' ')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
