import 'server-only'

/**
 * arsivhub.com toplayicisi.
 *
 * Site kendi video/foto sitemap'lerini yayinliyor (robots.txt bunlari isaret
 * ediyor), bu yuzden HTML kazimaya gerek yok: sitemap zaten baslik, aciklama,
 * kapak, medya adresi, sure, yayin tarihi ve izlenme sayisini yapisal olarak
 * veriyor. Yeni icerik eklendikce sitemap guncellendigi icin ayni ucu tekrar
 * okumak veriyi tazelemeye yetiyor.
 */
import type { MaterialItem, MaterialKind } from './types'

const BASE = 'https://arsivhub.com'
const SITEMAPS: Array<{ url: string; kind: MaterialKind }> = [
  { url: `${BASE}/video-sitemap.xml`, kind: 'video' },
  { url: `${BASE}/photo-sitemap.xml`, kind: 'photo' },
]

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

function tag(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`<(?:[a-z]+:)?${name}[^>]*>([\\s\\S]*?)</(?:[a-z]+:)?${name}>`, 'i'))
  return match ? decode(match[1]) : undefined
}

/** `<image:loc>` gibi ad alani onekli etiketler: onceki yardimci `<loc>` ile
 *  karisiyordu (sayfa adresi de <loc>), bu yuzden onek zorunlu tutuluyor. */
function nsTag(block: string, ns: string, name: string): string | undefined {
  const match = block.match(new RegExp(`<${ns}:${name}[^>]*>([\\s\\S]*?)</${ns}:${name}>`, 'i'))
  return match ? decode(match[1]) : undefined
}

/** Foto kayitlarinda etiket, license adresinin son parcasinda geliyor. */
function tagsFromLicense(block: string): string[] {
  const license = nsTag(block, 'image', 'license')
  const slug = license?.match(/\/tag\/([^/?#]+)/i)?.[1]
  return slug ? [decodeURIComponent(slug)] : []
}

function number(value?: string) {
  if (!value) return null
  const parsed = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

/** Sayfa adresinin sonundaki "--a1074208" eki kaynagin kendi kimligi. */
function externalIdFrom(pageUrl: string) {
  const match = pageUrl.match(/--([a-z0-9]+)\/?$/i)
  return match ? match[1] : pageUrl.split('/').filter(Boolean).pop() || null
}

export function normalizeTitle(value: string) {
  return value.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function parseSitemap(xml: string, kind: MaterialKind): MaterialItem[] {
  const items: MaterialItem[] = []
  for (const block of xml.split(/<url>/i).slice(1)) {
    const pageUrl = tag(block, 'loc')
    if (!pageUrl) continue
    const title = nsTag(block, 'video', 'title') || nsTag(block, 'image', 'title') || tag(block, 'caption') || ''
    if (!title) continue
    const externalId = externalIdFrom(pageUrl)
    items.push({
      id: `arsivhub:${kind}:${externalId ?? pageUrl}`,
      source: 'arsivhub',
      kind,
      externalId,
      title,
      description: nsTag(block, 'video', 'description') ?? nsTag(block, 'image', 'caption') ?? null,
      pageUrl,
      mediaUrl: nsTag(block, 'video', 'content_loc') ?? nsTag(block, 'image', 'loc') ?? null,
      thumbnail: nsTag(block, 'video', 'thumbnail_loc') ?? nsTag(block, 'image', 'loc') ?? null,
      durationSec: number(nsTag(block, 'video', 'duration')),
      width: null,
      height: null,
      viewCount: number(nsTag(block, 'video', 'view_count')),
      tags: tagsFromLicense(block),
      publishedAt: nsTag(block, 'video', 'publication_date') ?? tag(block, 'lastmod') ?? null,
    })
  }
  return items
}

export async function collectArsivhub(signal?: AbortSignal): Promise<MaterialItem[]> {
  const collected: MaterialItem[] = []
  for (const sitemap of SITEMAPS) {
    const response = await fetch(sitemap.url, {
      signal,
      cache: 'no-store',
      headers: { 'user-agent': 'KadeAI-Materials/1.0 (+https://kadenewmedia.com)' },
    })
    /* Foto sitemap'i henuz yoksa video tarafi calismaya devam etsin. */
    if (!response.ok) continue
    collected.push(...parseSitemap(await response.text(), sitemap.kind))
  }
  /* Ayni kayit iki sitemap'te birden gecerse sonuncusu kalir. */
  const unique = new Map(collected.map((item) => [item.id, item]))
  return [...unique.values()]
}
