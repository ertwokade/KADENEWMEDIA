import { NextRequest, NextResponse } from 'next/server'
import { getMaterialById } from '@/lib/materials/store'
import { requireReaderAccess } from '../../kade-search/_guard'

export const dynamic = 'force-dynamic'

/**
 * Materyal indirme.
 *
 * Kartlardaki `<a download>` işe yaramıyordu: `download` özniteliği farklı
 * kaynaktan (CDN) gelen dosyalarda tarayıcı tarafından yok sayılır, dosya
 * inmek yerine yeni sekmede açılırdı. Burada dosya sunucudan geçirilip
 * Content-Disposition ile veriliyor, böylece gerçekten iniyor.
 *
 * Adres istekten alınmaz, havuzdaki kayıttan okunur.
 */
const IZINLI_SEMA = new Set(['http:', 'https:'])

function dosyaAdi(baslik: string, url: string): string {
  const uzanti = (url.split('?')[0].match(/\.([a-z0-9]{2,4})$/i)?.[1] ?? 'bin').toLowerCase()
  const ad = baslik
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'materyal'
  return `${ad}.${uzanti}`
}

export async function GET(req: NextRequest) {
  const guard = await requireReaderAccess()
  if (guard) return guard

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Materyal kimliği gerekli.' }, { status: 400 })

  try {
    const materyal = await getMaterialById(id)
    if (!materyal?.media_url) {
      return NextResponse.json({ error: 'Materyal veya dosya bulunamadı.' }, { status: 404 })
    }

    let hedef: URL
    try {
      hedef = new URL(materyal.media_url)
    } catch {
      return NextResponse.json({ error: 'Kayıttaki adres geçersiz.' }, { status: 422 })
    }
    if (!IZINLI_SEMA.has(hedef.protocol)) {
      return NextResponse.json({ error: 'Desteklenmeyen adres.' }, { status: 422 })
    }

    const kaynak = await fetch(hedef, { redirect: 'follow' })
    if (!kaynak.ok || !kaynak.body) {
      return NextResponse.json({ error: `Dosya alınamadı (${kaynak.status}).` }, { status: 502 })
    }

    const basliklar = new Headers({
      'Content-Type': kaynak.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(dosyaAdi(materyal.title ?? '', hedef.pathname))}`,
      'Cache-Control': 'private, no-store',
    })
    const uzunluk = kaynak.headers.get('content-length')
    if (uzunluk) basliklar.set('Content-Length', uzunluk)

    return new NextResponse(kaynak.body, { status: 200, headers: basliklar })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'İndirme başarısız.' },
      { status: 500 },
    )
  }
}
