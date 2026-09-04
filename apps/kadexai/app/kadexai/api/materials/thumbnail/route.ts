import { NextRequest, NextResponse } from 'next/server'
import { getMaterialById } from '@/lib/materials/store'
import { requireReaderAccess } from '../../kade-search/_guard'

export const dynamic = 'force-dynamic'

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * Kaynak CDN'lerin hotlink/referrer kuralları kart önizlemelerini bozmasın diye
 * küçük resmi aynı kök üzerinden geçirir. Hedef adres kullanıcıdan değil,
 * yetkili materyal kaydından okunur.
 */
export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Materyal kimliği gerekli.' }, { status: 400 })

  try {
    const material = await getMaterialById(id)
    const source = material?.thumbnail || (material?.kind === 'photo' ? material.media_url : null)
    if (!source) return NextResponse.json({ error: 'Küçük resim bulunamadı.' }, { status: 404 })

    const target = new URL(source)
    if (!ALLOWED_PROTOCOLS.has(target.protocol)) {
      return NextResponse.json({ error: 'Desteklenmeyen küçük resim adresi.' }, { status: 422 })
    }

    const response = await fetch(target, {
      redirect: 'follow',
      headers: {
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; KadexAI-Materials/1.0)',
      },
    })
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok || !response.body || !contentType.toLowerCase().startsWith('image/')) {
      return NextResponse.json({ error: `Küçük resim alınamadı (${response.status}).` }, { status: 502 })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Küçük resim alınamadı.' },
      { status: 500 },
    )
  }
}
