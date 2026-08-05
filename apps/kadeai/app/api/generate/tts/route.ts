import { NextRequest, NextResponse } from 'next/server'
import { TTSRequest } from '@/types'
import { hasAuthenticatedUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { requireApiUser } from '@/lib/auth/server'

export const maxDuration = 120

// OpenAI TTS limiti 4096 karakter — uzun metinleri parçalara böl
function splitIntoChunks(text: string, maxLen = 4000): string[] {
  if (text.length <= maxLen) return [text]
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) { chunks.push(remaining); break }
    // Cümle sınırında kes
    let cutAt = maxLen
    const sentenceEnd = remaining.lastIndexOf('. ', maxLen)
    if (sentenceEnd > maxLen * 0.5) cutAt = sentenceEnd + 2
    else {
      const comma = remaining.lastIndexOf(', ', maxLen)
      if (comma > maxLen * 0.7) cutAt = comma + 2
    }
    chunks.push(remaining.slice(0, cutAt).trim())
    remaining = remaining.slice(cutAt).trim()
  }
  return chunks.filter(Boolean)
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  if (!(await hasAuthenticatedUser())) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const limit = rateLimit(getRateLimitKey(req, 'tts'), 5, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: rateLimitHeaders(limit) })
  try {
    const body: TTSRequest = await req.json()
    const { text, voice = 'nova', model = 'tts-1' } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Metin boş olamaz' }, { status: 400 })
    }
    if (text.length > 12_000) return NextResponse.json({ error: 'Metin 12.000 karakter sınırını aşıyor.' }, { status: 413 })
    if (!['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice)) {
      return NextResponse.json({ error: 'Geçersiz ses seçimi.' }, { status: 400 })
    }
    if (!['tts-1', 'tts-1-hd'].includes(model)) {
      return NextResponse.json({ error: 'Geçersiz ses modeli.' }, { status: 400 })
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Ses sağlayıcısı yapılandırılmamış.' }, { status: 503 })
    }

    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 })

    const chunks = splitIntoChunks(text.trim())

    // Tüm parçalar için paralel TTS
    const buffers = await Promise.all(
      chunks.map(async (chunk) => {
        const mp3 = await openai.audio.speech.create({ model, voice, input: chunk, response_format: 'mp3' })
        return Buffer.from(await mp3.arrayBuffer())
      })
    )

    // Parçaları birleştir
    const combined = Buffer.concat(buffers)

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="dubbing.mp3"',
        'Content-Length': String(combined.length),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Ses üretimi tamamlanamadı.' }, { status: 500 })
  }
}
