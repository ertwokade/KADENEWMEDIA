'use client'

/**
 * Videodan ses cikarma (tarayicida, FFmpeg indirmeden).
 *
 * Transkripsiyon ucu 25 MB sinirli ve videolar bunu kolayca asiyor. Burada ses
 * kanali tarayicida ayristirilip kucultuluyor:
 *   1. Yontem: captureStream + MediaRecorder -> WebM/Opus ~32 kbps (en kucuk)
 *   Hızlı yol: Web Audio API -> 16/8 kHz mono WAV (video süresini beklemez)
 *   Yedek: captureStream + MediaRecorder (gerçek zamanlı)
 *
 * Klip Ureticisi, Altyazi Studyosu ve Dublaj ayni boru hattini kullanir.
 */

/** AudioBuffer -> 16 bit PCM WAV (Groq'un kabul ettigi bicim). */
export function encodeWAV(buffer: AudioBuffer): Blob {
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

export async function extractAudio(file: File, onMsg: (m: string) => void = () => {}): Promise<File> {
  const mediaType = file.type.split(';')[0].trim().toLowerCase()
  if (file.size > 0 && file.size <= 25 * 1024 * 1024 &&
      ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'].includes(mediaType)) {
    onMsg('Ses dosyası hazır.')
    return new File([file], file.name, { type: mediaType })
  }
  // Hızlı yol: ses tarayıcının arka plan çözücüsüyle çıkarılır (video süresi kadar
  // beklemez, sesli oynatmaz). Çok büyük dosyada bellek için gerçek zamanlı kayda düşülür.
  if (file.size > 0 && file.size <= 120 * 1024 * 1024 && typeof OfflineAudioContext !== 'undefined') {
    try {
      onMsg('Ses kanalı ayrıştırılıyor...')
      return await decodeToWav(file, onMsg)
    } catch { /* gerçek zamanlı kayda düş */ }
  }

  type CaptureStreamVideo = HTMLVideoElement & { captureStream: () => MediaStream }
  const supportsCapture = typeof (HTMLVideoElement.prototype as Partial<CaptureStreamVideo>).captureStream === 'function'

  if (supportsCapture) {
    try {
      onMsg('Ses çıkarılıyor (normal hızda; video süresi kadar sürebilir)...')
      const blob = await new Promise<Blob>((resolve, reject) => {
        const video = document.createElement('video')
        const url = URL.createObjectURL(file)
        let recorder: MediaRecorder | null = null
        let stream: MediaStream | null = null
        let settled = false
        const finish = (error?: Error, blob?: Blob) => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          video.pause()
          if (recorder?.state === 'recording') recorder.stop()
          stream?.getTracks().forEach((track) => track.stop())
          video.removeAttribute('src')
          video.load()
          URL.revokeObjectURL(url)
          if (error) reject(error)
          else if (blob?.size) resolve(blob)
          else reject(new Error('Ses kaydı boş.'))
        }
        // A timeout is a failure, never an apparently complete truncated recording.
        const timeout = setTimeout(() => finish(new Error('Ses çıkarma süresi aşıldı. Videoyu kısaltıp yeniden dene.')), 180000)
        video.muted = false
        video.playsInline = true
        video.onloadedmetadata = () => {
          if (settled) return
          try {
            stream = (video as CaptureStreamVideo).captureStream()
            const audioTracks = stream.getAudioTracks()
            if (!audioTracks.length) throw new Error('no audio')
            const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
              .find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
            const chunks: Blob[] = []
            const rec = new MediaRecorder(new MediaStream(audioTracks), { mimeType: mime, audioBitsPerSecond: 32000 })
            recorder = rec
            rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
            rec.onstop = () => {
              if (!video.ended) return finish(new Error('Ses kaydı tamamlanmadan durdu.'))
              finish(undefined, new Blob(chunks, { type: mime.split(';')[0] }))
            }
            rec.onerror = () => finish(new Error('Ses kaydı başarısız.'))
            // Speeding up playback also speeds up recorded speech and breaks timestamps.
            video.playbackRate = 1
            rec.start(200)
            void video.play().catch(() => finish(new Error('Video oynatılamadı.')))
            video.onended = () => { if (rec.state === 'recording') rec.stop() }
          } catch { finish(new Error('Ses kanalı kaydedilemedi.')) }
        }
        video.onerror = () => finish(new Error('Video açılamadı.'))
        video.src = url
      })
      onMsg('Ses hazır!')
      return new File([blob], 'audio.webm', { type: blob.type })
    } catch { /* ikinci yonteme dus */ }
  }

  onMsg('Ses kanalı ayrıştırılıyor...')
  return decodeToWav(file, onMsg)
}

async function decodeToWav(file: File, onMsg: (m: string) => void): Promise<File> {
  const ab = await file.arrayBuffer()
  const tmpCtx = new AudioContext()
  let original: AudioBuffer
  try { original = await tmpCtx.decodeAudioData(ab) }
  catch { throw new Error('Video formatı desteklenmiyor. MP4 veya MOV kullan.') }
  finally { await tmpCtx.close() }
  if (!original.duration || original.numberOfChannels === 0) throw new Error('Ses kanalı yok.')

  // Transkripsiyon ucu 25 MB kabul ediyor: 16 kHz ≈ 12 dk, 8 kHz ≈ 25 dk sığar.
  const SR = original.duration <= 12 * 60 ? 16000 : 8000
  if (original.duration * SR * 2 > 24 * 1024 * 1024) throw new Error('Video çok uzun; yaklaşık 25 dakikadan kısa bir bölüm yükle.')
  onMsg(`${SR / 1000} kHz WAV oluşturuluyor...`)
  const offline = new OfflineAudioContext(1, Math.ceil(original.duration * SR), SR)
  const src = offline.createBufferSource(); src.buffer = original; src.connect(offline.destination); src.start(0)
  const rendered = await offline.startRendering()
  // Uzun seslerde WAV kodlaması ana iş parçacığını kilitlemesin diye önce bir kare çizilir.
  await new Promise((resolve) => setTimeout(resolve, 0))
  const wav = new File([encodeWAV(rendered)], 'audio.wav', { type: 'audio/wav' })
  onMsg('Ses hazır!')
  return wav
}

/** Ses veya video dosyasinin suresini (saniye) okur. */
export function readMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('video')
    const url = URL.createObjectURL(file)
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(el.duration) ? el.duration : 0)
    }
    el.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    el.src = url
  })
}
