import type { TelegramContentLink } from './telegramContentLinks'

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface TelegramPublicMetadata {
  title: string | null
  description: string | null
  authorName: string | null
  authorUrl: string | null
  thumbnailUrl: string | null
  source: string
}

const MAX_HTML_BYTES = 2_000_000
const PUBLIC_PAGE_HEADERS = {
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
  'User-Agent': 'Mozilla/5.0',
}

function decodeHtml(value: string) {
  const decoded = value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => {
      try { return String.fromCodePoint(Number.parseInt(hex, 16)) } catch { return '' }
    })
    .replace(/&#([0-9]+);/g, (_match, decimal: string) => {
      try { return String.fromCodePoint(Number.parseInt(decimal, 10)) } catch { return '' }
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function bounded(value: string | null | undefined, max: number) {
  const text = String(value ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  return text ? [...text].slice(0, max).join('') : null
}

function safeHttpsUrl(value: string | null | undefined) {
  try {
    const url = new URL(String(value ?? ''))
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString().slice(0, 2_000) : null
  } catch {
    return null
  }
}

function attributes(input: string) {
  const result = new Map<string, string>()
  const pattern = /([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g
  for (const match of input.matchAll(pattern)) result.set(match[1].toLocaleLowerCase('en-US'), decodeHtml(match[3]))
  return result
}

function metaContent(html: string, names: string[]) {
  const wanted = new Set(names.map((name) => name.toLocaleLowerCase('en-US')))
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = attributes(match[1])
    const name = (attrs.get('property') ?? attrs.get('name') ?? '').toLocaleLowerCase('en-US')
    const content = attrs.get('content')?.trim()
    if (wanted.has(name) && content) return content
  }
  return null
}

export function parseInstagramPublicMetadata(html: string): TelegramPublicMetadata | null {
  const ogTitle = metaContent(html, ['og:title', 'twitter:title'])
  const description = metaContent(html, ['og:description', 'description', 'twitter:description'])
  const titleMatch = ogTitle?.match(/^(.+?)\s+on Instagram:\s*["“](.+?)["”]\s*$/i)
  const profileTitleMatch = ogTitle?.match(/^(.+?)\s+\(@([a-z0-9._]+)\)\s+[•·-]\s+Instagram\b/i)
  const captionMatch = description?.match(/:\s*["“](.+?)["”](?:\.\s*)?$/)
  const title = titleMatch?.[2]?.trim()
    || captionMatch?.[1]?.trim()
    || (ogTitle && ogTitle.toLocaleLowerCase('en-US') !== 'instagram' ? ogTitle : null)
  if (!title && !description) return null
  return {
    title: bounded(title ?? description, 500),
    description: bounded(description, 2_000),
    authorName: bounded(titleMatch?.[1]?.trim() || profileTitleMatch?.[1]?.trim(), 200),
    authorUrl: null,
    thumbnailUrl: safeHttpsUrl(metaContent(html, ['og:image', 'twitter:image'])),
    source: 'Instagram herkese açık sayfa meta verisi',
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function firstUrl(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (Array.isArray(value)) return value.map(firstUrl).find(Boolean) ?? null
  const object = record(value)
  if (!object) return null
  return firstUrl(object.urlList) ?? firstUrl(object.url_list) ?? firstUrl(object.url)
}

export function parseTikTokPublicMetadata(html: string): TelegramPublicMetadata | null {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[1]).get('id') !== '__UNIVERSAL_DATA_FOR_REHYDRATION__') continue
    try {
      const payload = record(JSON.parse(match[2]))
      const scope = record(payload?.__DEFAULT_SCOPE__)
      const detail = record(scope?.['webapp.video-detail'])
      const itemInfo = record(detail?.itemInfo)
      const item = record(itemInfo?.itemStruct)
      if (!item) continue
      const description = stringValue(item.desc)
      const author = record(item.author)
      const username = stringValue(author?.uniqueId)
      const video = record(item.video)
      const imagePost = record(item.imagePost)
      const images = Array.isArray(imagePost?.images) ? imagePost.images : []
      const firstImage = record(images[0])
      const imageUrl = record(firstImage?.imageURL)
      return {
        title: bounded(description, 500),
        description: bounded(description, 2_000),
        authorName: bounded(username ? `@${username}` : stringValue(author?.nickname), 200),
        authorUrl: safeHttpsUrl(username ? `https://www.tiktok.com/@${username}` : null),
        thumbnailUrl: safeHttpsUrl(firstUrl(video?.cover) ?? firstUrl(imagePost?.cover) ?? firstUrl(imageUrl)),
        source: 'TikTok herkese açık sayfa meta verisi',
      }
    } catch {
      return null
    }
  }
  return null
}

export async function fetchTelegramPublicMetadata(link: TelegramContentLink, fetchImpl: FetchLike) {
  const response = await fetchImpl(link.canonicalUrl, {
    method: 'GET', headers: PUBLIC_PAGE_HEADERS, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`${link.platform} herkese açık sayfası alınamadı (HTTP ${response.status}).`)
  const contentType = response.headers.get('content-type')?.toLocaleLowerCase('en-US') ?? ''
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (!contentType.includes('text/html') || (contentLength > 0 && contentLength > MAX_HTML_BYTES)) {
    throw new Error(`${link.platform} herkese açık sayfası beklenen biçimde değil.`)
  }
  const html = (await response.text()).slice(0, MAX_HTML_BYTES)
  const metadata = link.platform === 'instagram'
    ? parseInstagramPublicMetadata(html)
    : parseTikTokPublicMetadata(html)
  if (!metadata) throw new Error(`${link.platform} herkese açık sayfasında başlık bulunamadı.`)
  return metadata
}
