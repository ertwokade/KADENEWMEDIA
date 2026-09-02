import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { geminiSeslendir, geminiSeslendirmeKullanilabilir } from '@/lib/ai/geminiSpeech'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Tek istekte uretilecek en fazla parca ve karakter. Pano zaten partiler halinde
// gonderir; bu sinirlar hem sunucu suresini hem yanit boyutunu guvende tutar.
const MAX_SEGMENTS = 40
const MAX_TOTAL_CHARS = 3000
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
const CONCURRENCY = 4

interface DubBody {
  segments?: Array<{ index: number; text: string }>
  voice?: string
  model?: 'tts-1' | 'tts-1-hd'
  speed?: number
}

/**
 * Dublaj sesi uretir: her altyazi kutusu icin AYRI bir ses parcasi.
 *
 * Tek uzun ses yerine parca parca uretmenin sebebi zamanlama: pano her parcayi
 * kendi kutusunun baslangicina yerlestirir, boylece dublaj goruntuyle senkron kalir.
 */
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const limit = rateLimit(getRateLimitKey(req, 'dubbing-tts'), 12, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  }

  // OpenAI yoksa Gemini'ye düşülür. Eskiden burada doğrudan 503 dönülüyordu
  // ve canlıda OPENAI_API_KEY tanımlı olmadığı için Dublaj hiç çalışmıyordu.
  const openaiVar = Boolean(process.env.OPENAI_API_KEY?.trim())
  if (!openaiVar && !geminiSeslendirmeKullanilabilir()) {
    return NextResponse.json({ error: 'Ses sağlayıcısı yapılandırılmamış.' }, { status: 503 })
  }

  let body: DubBody
  try {
    body = (await req.json()) as DubBody
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const segments = (body.segments ?? [])
    .filter((s) => typeof s?.index === 'number' && typeof s?.text === 'string' && s.text.trim())
    .map((s) => ({ index: s.index, text: s.text.trim().slice(0, 600) }))

  if (!segments.length) return NextResponse.json({ error: 'Seslendirilecek metin yok.' }, { status: 400 })
  if (segments.length > MAX_SEGMENTS) {
    return NextResponse.json({ error: `Tek istekte en fazla ${MAX_SEGMENTS} parça seslendirilebilir.` }, { status: 413 })
  }
  const totalChars = segments.reduce((sum, s) => sum + s.text.length, 0)
  if (totalChars > MAX_TOTAL_CHARS) {
    return NextResponse.json({ error: `Tek istekte en fazla ${MAX_TOTAL_CHARS} karakter seslendirilebilir.` }, { status: 413 })
  }

  const voice = String(body.voice ?? 'nova')
  if (!VOICES.includes(voice)) return NextResponse.json({ error: 'Geçersiz ses seçimi.' }, { status: 400 })
  const model = body.model === 'tts-1-hd' ? 'tts-1-hd' : 'tts-1'
  const speed = Math.min(Math.max(Number(body.speed) || 1, 0.75), 1.4)

  if (!openaiVar) {
    const sonuclar: Array<{ index: number; audio: string; hata?: string }> = []
    for (let i = 0; i < segments.length; i += CONCURRENCY) {
      const dilim = segments.slice(i, i + CONCURRENCY)
      const parca = await Promise.all(
        dilim.map(async (segment) => {
          try {
            return { index: segment.index, audio: await geminiSeslendir(segment.text, voice) }
          } catch (e) {
            return { index: segment.index, audio: '', hata: e instanceof Error ? e.message : 'Seslendirilemedi' }
          }
        }),
      )
      sonuclar.push(...parca)
    }
    return NextResponse.json({
      parcalar: sonuclar,
      // Gemini ham PCM veriyor, WAV kabına alınıyor; istemci mime'ı kullanıyor.
      mime: 'audio/wav',
      saglayici: 'gemini',
      basarisiz: sonuclar.filter((r) => !r.audio).length,
    })
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60_000, maxRetries: 1 })

    const results: Array<{ index: number; audio: string; hata?: string }> = []

    // Sinirli es zamanlilik: hepsini birden gondermek saglayici tarafinda 429 uretiyor.
    for (let i = 0; i < segments.length; i += CONCURRENCY) {
      const slice = segments.slice(i, i + CONCURRENCY)
      const chunk = await Promise.all(
        slice.map(async (segment) => {
          try {
            const speech = await openai.audio.speech.create({
              model,
              voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
              input: segment.text,
              response_format: 'mp3',
              speed,
            })
            const buffer = Buffer.from(await speech.arrayBuffer())
            return { index: segment.index, audio: buffer.toString('base64') }
          } catch (e) {
            return { index: segment.index, audio: '', hata: e instanceof Error ? e.message : 'Seslendirilemedi' }
          }
        })
      )
      results.push(...chunk)
    }

    return NextResponse.json({
      parcalar: results,
      mime: 'audio/mpeg',
      basarisiz: results.filter((r) => !r.audio).length,
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ses üretimi tamamlanamadı.' }, { status: 500 })
  }
}
