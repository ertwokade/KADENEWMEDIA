'use client'

/**
 * Videodan ses cikarma (tarayicida, FFmpeg indirmeden).
 *
 * Transkripsiyon ucu 25 MB sinirli ve videolar bunu kolayca asiyor. Burada ses
 * kanali tarayicida ayristirilip kucultuluyor:
 *   1. Yontem: captureStream + MediaRecorder -> WebM/Opus ~32 kbps (en kucuk)
 *   2. Yontem: Web Audio API -> 8 kHz mono WAV (her tarayicida calisir)
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
  type CaptureStreamVideo = HTMLVideoElement & { captureStream: () => MediaStream }
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
            const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
              .find((t) => MediaRecorder.isTypeSupported(t)) ?? 'audio/webm'
            const chunks: Blob[] = []
            const rec = new MediaRecorder(new MediaStream(audioTracks), { mimeType: mime, audioBitsPerSecond: 32000 })
            rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
            rec.onstop = () => { URL.revokeObjectURL(url); resolve(new Blob(chunks, { type: mime })) }
            rec.onerror = reject
            video.playbackRate = 16; void video.play(); rec.start(200)
            video.onended = () => rec.stop()
            setTimeout(() => { try { if (rec.state === 'recording') rec.stop() } catch {} }, 180000)
          } catch (err) { URL.revokeObjectURL(url); reject(err) }
        }
        video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load error')) }
      })
      onMsg('Ses hazır!')
      return new File([blob], 'audio.webm', { type: blob.type })
    } catch { /* ikinci yonteme dus */ }
  }

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
