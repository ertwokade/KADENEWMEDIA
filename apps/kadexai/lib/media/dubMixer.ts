'use client'

/**
 * Dublaj ses kurgusu (tarayicida).
 *
 * Sunucu her altyazi kutusu icin ayri bir mp3 doner. Burada bu parcalar zaman
 * cizgisine yerlestirilir: her parca kendi kutusunun baslangicinda calar. Parca
 * kendi zaman araligina sigmiyorsa (ceviri daha uzun surdugu icin) konusma hizi
 * yukseltilerek sigdirilir — sinirli olcude, cunku asiri hizlanma anlasilmaz olur.
 */
import { encodeWAV } from './extractAudio'

export interface DubSegment {
  index: number
  start: number
  end: number
  /** base64 mp3 (sunucudan gelen parca) */
  audio: string
}

export interface MixOptions {
  /** Toplam sure (saniye). Genelde videonun suresi. */
  duration: number
  /** Orijinal ses bu seviyede altta kalir (0 = tamamen kapali). */
  originalVolume?: number
  /** Orijinal sesi almak icin kaynak video/ses dosyasi. */
  originalFile?: File | null
  /** Bir parca kendi araligina sigmazsa izin verilen en yuksek hizlanma. */
  maxSpeedUp?: number
  onProgress?: (done: number, total: number) => void
}

export interface MixResult {
  blob: Blob
  /** Araligina sigmadigi icin hizlandirilan parca sayisi. */
  hizlandirilan: number
  /** Hizlandirmaya ragmen sonraki kutuya tasan parca sayisi. */
  tasan: number
}

const SAMPLE_RATE = 44100

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function assembleDubTrack(segments: DubSegment[], options: MixOptions): Promise<MixResult> {
  const { duration, originalVolume = 0, originalFile = null, maxSpeedUp = 1.6, onProgress } = options
  const usable = segments.filter((s) => s.audio)
  if (!usable.length) throw new Error('Seslendirilmiş parça yok.')

  const totalDuration = Math.max(duration, ...usable.map((s) => s.end)) + 1
  const decodeCtx = new AudioContext()
  const decoded: Array<{ segment: DubSegment; buffer: AudioBuffer }> = []

  try {
    for (const [i, segment] of usable.entries()) {
      try {
        const buffer = await decodeCtx.decodeAudioData(base64ToArrayBuffer(segment.audio))
        decoded.push({ segment, buffer })
      } catch {
        // Tek parca cozulemezse dublajin tamami durmaz; o aralik sessiz kalir.
      }
      onProgress?.(i + 1, usable.length)
    }

    let originalBuffer: AudioBuffer | null = null
    if (originalFile && originalVolume > 0) {
      try {
        originalBuffer = await decodeCtx.decodeAudioData(await originalFile.arrayBuffer())
      } catch {
        originalBuffer = null
      }
    }

    const offline = new OfflineAudioContext(1, Math.ceil(totalDuration * SAMPLE_RATE), SAMPLE_RATE)

    if (originalBuffer) {
      const source = offline.createBufferSource()
      source.buffer = originalBuffer
      const gain = offline.createGain()
      gain.gain.value = Math.min(Math.max(originalVolume, 0), 1)
      source.connect(gain).connect(offline.destination)
      source.start(0)
    }

    let hizlandirilan = 0
    let tasan = 0

    decoded.forEach(({ segment, buffer }, i) => {
      const next = decoded[i + 1]?.segment
      // Kullanilabilir alan: kendi araligi, sonraki kutuya kadar uzatilabilir.
      const slot = Math.max((next ? next.start : segment.end) - segment.start, 0.3)

      let rate = 1
      if (buffer.duration > slot) {
        rate = Math.min(buffer.duration / slot, maxSpeedUp)
        hizlandirilan++
        if (buffer.duration / rate > slot + 0.05) tasan++
      }

      const source = offline.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = rate
      source.connect(offline.destination)
      source.start(segment.start)
    })

    const rendered = await offline.startRendering()
    return { blob: encodeWAV(rendered), hizlandirilan, tasan }
  } finally {
    await decodeCtx.close()
  }
}
