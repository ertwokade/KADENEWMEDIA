export type TelegramContentPlatform = 'instagram' | 'tiktok'

export interface TelegramContentLink {
  platform: TelegramContentPlatform
  url: string
  canonicalUrl: string
  externalId: string | null
  needsResolution: boolean
}

const URL_PATTERN = /https:\/\/[^\s<>]+/iu
const TRAILING_PUNCTUATION = /[),.!?;:'"\]}]+$/u

function cleanUrl(input: string) {
  const match = String(input ?? '').match(URL_PATTERN)?.[0] ?? ''
  return match.replace(TRAILING_PUNCTUATION, '').slice(0, 2048)
}

function normalizedHost(value: string) {
  return value.toLocaleLowerCase('en-US').replace(/^www\./, '')
}

export function parseTelegramContentLink(input: string): TelegramContentLink | null {
  const raw = cleanUrl(input)
  if (!raw) return null

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port) return null

  const host = normalizedHost(parsed.hostname)
  if (host === 'instagram.com') {
    const match = parsed.pathname.match(/^\/(?:reel|reels)\/([A-Za-z0-9_-]{5,80})(?:\/|$)/)
    if (!match) return null
    const externalId = match[1]
    return {
      platform: 'instagram',
      url: raw,
      canonicalUrl: `https://www.instagram.com/reel/${externalId}/`,
      externalId,
      needsResolution: false,
    }
  }

  if (!['tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'].includes(host)) return null
  if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
    const shortCode = parsed.pathname.split('/').filter(Boolean)[0]
    if (!shortCode || !/^[A-Za-z0-9_-]{5,80}$/.test(shortCode)) return null
    return {
      platform: 'tiktok',
      url: raw,
      canonicalUrl: `https://${host}/${shortCode}/`,
      externalId: null,
      needsResolution: true,
    }
  }

  const match = parsed.pathname.match(/^\/@([^/]{1,80})\/video\/(\d{5,30})(?:\/|$)/)
  if (!match) return null
  let username: string
  try {
    username = encodeURIComponent(decodeURIComponent(match[1]).replace(/^@/, ''))
  } catch {
    return null
  }
  return {
    platform: 'tiktok',
    url: raw,
    canonicalUrl: `https://www.tiktok.com/@${username}/video/${match[2]}`,
    externalId: match[2],
    needsResolution: false,
  }
}

export function extractTelegramContentUrl(input: string) {
  return parseTelegramContentLink(input)?.url ?? null
}

export function parseTelegramContentPlatform(input: string): TelegramContentPlatform | null {
  const normalized = String(input ?? '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')
  if (/\b(?:instagram|insta|reels?|reel)\b/u.test(normalized)) return 'instagram'
  if (/\b(?:tiktok|tik tok)\b/u.test(normalized)) return 'tiktok'
  return null
}
