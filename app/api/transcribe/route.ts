import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitKey, rateLimit } from '@/lib/rateLimit'
import { hasAuthenticatedUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

async function hasSupportedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const ascii = String.fromCharCode(...bytes)
  return (
    ascii.startsWith('ID3') ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
    (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WAVE') ||
    ascii.startsWith('OggS') ||
    ascii.slice(4, 8) === 'ftyp' ||
    (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)
  )
}

export async function POST(req: NextRequest) {
  if (!(await hasAuthenticatedUser())) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 })
  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const apiKey = process.env.GROQ_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'Transkripsiyon sağlayıcısı yapılandırılmamış.' }, { status: 503 })
    }

    const incoming = await req.formData()
    const file = incoming.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ses dosyası gerekli.' }, { status: 400 })
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ses dosyası 25 MB sınırını aşıyor.' }, { status: 413 })
    }
    const allowedTypes = new Set(['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', 'video/mp4', 'video/webm'])
    if (file.type && !allowedTypes.has(file.type)) {
      return NextResponse.json({ error: 'Desteklenmeyen ses veya video dosya türü.' }, { status: 415 })
    }
    if (!(await hasSupportedSignature(file))) {
      return NextResponse.json({ error: 'Dosya içeriği desteklenen ses veya video biçimiyle eşleşmiyor.' }, { status: 415 })
    }

    const outgoing = new FormData()
    const extension = file.type.includes('wav') ? 'wav' : file.type.includes('ogg') ? 'ogg' : file.type.includes('mp4') ? 'mp4' : file.type.includes('mpeg') || file.type.includes('mp3') ? 'mp3' : 'webm'
    outgoing.append('file', file, `upload.${extension}`)
    outgoing.append('model', 'whisper-large-v3-turbo')
    outgoing.append('response_format', 'verbose_json')
    outgoing.append('timestamp_granularities[]', 'word')

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: outgoing,
      signal: AbortSignal.timeout(90000),
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: 'Transkripsiyon tamamlanamadı.' }, { status: 502 })

    return NextResponse.json({
      text: data.text || '',
      words: data.words || [],
      language: data.language || '',
    })
  } catch {
    return NextResponse.json({ error: 'Transkripsiyon tamamlanamadı.' }, { status: 500 })
  }
}
