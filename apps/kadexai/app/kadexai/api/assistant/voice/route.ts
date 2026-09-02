import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { geminiTranscribe, geminiTranscribeKullanilabilir } from '@/lib/ai/geminiTranscribe'

export const dynamic = 'force-dynamic'

/**
 * Asistana konuşma: kısa ses kaydını metne çevirir.
 *
 * `/api/transcribe` bilerek kullanılmadı: orası Altyazı Stüdyosu'nun ucu ve
 * `subtitles` / `clip-generator` paket özelliğine kilitli. Asistana soru
 * sormak bir altyazı özelliği değil, panelin giriş yöntemi — o kilide
 * bağlanırsa Başlangıç paketindeki kullanıcı asistanla konuşamazdı.
 *
 * Buna karşılık sınırlar dar tutuldu: yalnızca kısa kayıt, dakikada az
 * istek. Uzun dosya çözümlemek isteyen Altyazı Stüdyosu'na gider.
 */
const AZAMI_BOYUT = 4 * 1024 * 1024 // ~1 dakikalık konuşma
const IZINLI_TUR = new Set([
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav',
])

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const limit = rateLimit(getRateLimitKey(req, 'assistant-voice'), 20, 60_000)
  const headers = rateLimitHeaders(limit)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek. Biraz bekle.' }, { status: 429, headers })
  }

  if (!geminiTranscribeKullanilabilir()) {
    return NextResponse.json({ error: 'Ses çözümleme sağlayıcısı yapılandırılmamış.' }, { status: 503, headers })
  }

  try {
    const form = await req.formData()
    const dosya = form.get('file')
    if (!(dosya instanceof File)) {
      return NextResponse.json({ error: 'Ses kaydı gerekli.' }, { status: 400, headers })
    }
    if (dosya.size > AZAMI_BOYUT) {
      return NextResponse.json({ error: 'Kayıt çok uzun. Daha kısa konuş.' }, { status: 413, headers })
    }
    // Tür başlığı boş gelebiliyor (bazı tarayıcılar MediaRecorder'da yazmıyor).
    if (dosya.type && !IZINLI_TUR.has(dosya.type.split(';')[0])) {
      return NextResponse.json({ error: 'Desteklenmeyen ses biçimi.' }, { status: 415, headers })
    }

    const sonuc = await geminiTranscribe(dosya)
    const metin = sonuc.text.trim()
    if (!metin) {
      return NextResponse.json({ error: 'Konuşma anlaşılamadı, tekrar dener misin?' }, { status: 422, headers })
    }

    return NextResponse.json({ metin, dil: sonuc.language }, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ses çözümlenemedi.' },
      { status: 500, headers },
    )
  }
}
