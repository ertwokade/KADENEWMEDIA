import { NextRequest, NextResponse } from 'next/server'
import { getMaterialById } from '@/lib/materials/store'
import { requireReaderAccess } from '../../kade-search/_guard'
import { fetchMaterial, thumbnailBytes } from '@/lib/materials/fetch'

export const dynamic = 'force-dynamic'

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

    const { bytes, type } = await thumbnailBytes(await fetchMaterial(source))
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': type,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Küçük resim alınamadı. Kaynak geçici olarak kullanılamıyor olabilir.' },
      { status: 502 },
    )
  }
}
