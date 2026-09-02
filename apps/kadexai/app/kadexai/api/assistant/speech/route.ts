import { NextRequest, NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/auth/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { geminiSeslendir, geminiSeslendirmeKullanilabilir } from '@/lib/ai/geminiSpeech'

export const dynamic = 'force-dynamic'

/** Asistanın cevabını sesli okur. Uzun cevaplar kırpılır: bu bir seslendirme
 *  aracı değil, konuşma sırasının karşılığı. */
const AZAMI_KARAKTER = 1200

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const limit = rateLimit(getRateLimitKey(req, 'assistant-speech'), 20, 60_000)
  const headers = rateLimitHeaders(limit)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })
  }

  if (!geminiSeslendirmeKullanilabilir()) {
    return NextResponse.json({ error: 'Ses sağlayıcısı yapılandırılmamış.' }, { status: 503, headers })
  }

  try {
    const govde = await req.json() as { metin?: unknown; ses?: unknown }
    const metin = String(govde.metin ?? '').trim().slice(0, AZAMI_KARAKTER)
    if (!metin) return NextResponse.json({ error: 'Okunacak metin yok.' }, { status: 400, headers })

    const ses = typeof govde.ses === 'string' ? govde.ses : 'nova'
    return NextResponse.json({ ses: await geminiSeslendir(metin, ses), mime: 'audio/wav' }, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seslendirilemedi.' },
      { status: 500, headers },
    )
  }
}
