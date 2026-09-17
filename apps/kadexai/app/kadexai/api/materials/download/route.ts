import { NextRequest, NextResponse } from 'next/server'
import { getMaterialById } from '@/lib/materials/store'
import { requireReaderAccess } from '../../kade-search/_guard'
import { fetchMaterial, materialTarget } from '@/lib/materials/fetch'

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
      hedef = materialTarget(materyal.media_url)
    } catch {
      return NextResponse.json({ error: 'Kayıttaki adres geçersiz.' }, { status: 422 })
    }
    // inline=1: önizleme oynatıcısı aynı kökten akış alır (CSP media-src 'self').
    const inline = req.nextUrl.searchParams.get('inline') === '1'
    const kaynak = await fetchMaterial(hedef.href, fetch, inline ? req.headers.get('range') : null)
    if (!kaynak.ok || !kaynak.body) {
      return NextResponse.json({ error: `Dosya alınamadı (${kaynak.status}).` }, { status: 502 })
    }

    const basliklar = new Headers({
      'Content-Type': kaynak.headers.get('content-type') || 'application/octet-stream',
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(dosyaAdi(materyal.title ?? '', hedef.pathname))}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "sandbox; default-src 'none'",
    })
    const uzunluk = kaynak.headers.get('content-length')
    if (uzunluk) basliklar.set('Content-Length', uzunluk)
    const aralik = kaynak.headers.get('content-range')
    if (inline) basliklar.set('Accept-Ranges', 'bytes')
    if (inline && kaynak.status === 206 && aralik) basliklar.set('Content-Range', aralik)

    return new NextResponse(kaynak.body, { status: inline && kaynak.status === 206 ? 206 : 200, headers: basliklar })
  } catch {
    return NextResponse.json(
      { error: 'İndirme başarısız. Kaynak dosyaya şu anda erişilemiyor.' },
      { status: 502 },
    )
  }
}
