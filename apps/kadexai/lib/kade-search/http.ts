import 'server-only'

/**
 * Toplayicilarin ortak HTTP istemcisi: host bazli hiz sinirlama, kademeli
 * yeniden deneme, uyarlanabilir ceza carpani ve kisa omurlu bellek onbellegi.
 *
 * SQLite surumundeki disk onbelleginin yerini bellek onbellegi aldi; sunucusuz
 * ortamda kalici disk yok, ama ayni istek icinde tekrar eden cagrilari (or.
 * ayni sayfanin iki kez istenmesi) yine de tek istege indirger.
 */
import { sleep, stableHash } from './util'

const UAS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

// Bazi kaynaklar daha kati hiz siniri uygular; host bazli ek bekleme (ms)
const HOST_DELAYS: Record<string, number> = {
  'www.reddit.com': 2600,
  'old.reddit.com': 2600,
  'www.youtube.com': 2200,
  'trends.google.com': 1500,
  'www.instagram.com': 2000,
  'ads.tiktok.com': 1500,
}

const DEFAULT_DELAY_MS = 900
const TIMEOUT_MS = 20_000
const RETRIES = 3
const CACHE_TTL_MS = 45 * 60_000
const MAX_PENALTY = 6

const lastHitByHost = new Map<string, number>()
const penaltyByHost = new Map<string, number>()
const cache = new Map<string, { at: number; status: number; data: unknown }>()

function pickUA() {
  return UAS[Math.floor(Math.random() * UAS.length)]
}

function notePenalty(url: string) {
  try {
    const host = new URL(url).host
    penaltyByHost.set(host, Math.min((penaltyByHost.get(host) ?? 1) * 1.8, MAX_PENALTY))
  } catch {
    /* yoksay */
  }
}

function noteSuccess(host: string) {
  const p = penaltyByHost.get(host)
  if (p && p > 1) penaltyByHost.set(host, Math.max(1, p * 0.75))
}

/** Ayni host'a ard arda istek atarken bekle. */
async function throttle(url: string) {
  const host = new URL(url).host
  const last = lastHitByHost.get(host) ?? 0
  const base = Math.max(DEFAULT_DELAY_MS, HOST_DELAYS[host] ?? 0)
  const delay = base * (penaltyByHost.get(host) ?? 1)
  const wait = delay - (Date.now() - last)
  if (wait > 0) await sleep(wait + Math.random() * 250)
  lastHitByHost.set(host, Date.now())
}

export interface RequestOptions {
  headers?: Record<string, string>
  method?: string
  body?: unknown
  as?: 'json' | 'text'
  ttlMs?: number
  noCache?: boolean
  label?: string
}

export type RequestResult<T> =
  | { ok: true; data: T; cached: boolean; status: number }
  | { ok: false; error: string; status?: number }

export async function request<T = unknown>(url: string, opts: RequestOptions = {}): Promise<RequestResult<T>> {
  const { headers = {}, method = 'GET', body, as = 'text', noCache = false, label = '' } = opts
  const ttl = opts.ttlMs ?? CACHE_TTL_MS
  const key = stableHash(method, url, JSON.stringify(body ?? ''), as)

  if (!noCache) {
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < ttl) {
      return { ok: true, data: hit.data as T, cached: true, status: hit.status }
    }
  }

  let lastErr = 'bilinmeyen hata'
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      await throttle(url)
      const res = await fetch(url, {
        method,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        headers: {
          'user-agent': pickUA(),
          'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          accept: as === 'json' ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,*/*',
          ...headers,
        },
      })

      if (!res.ok) {
        lastErr = `HTTP ${res.status}`
        // 4xx'te tekrar denemek anlamsiz (429 haric)
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { ok: false, error: lastErr, status: res.status }
        }
        if (res.status === 429) notePenalty(url)
        throw new Error(lastErr)
      }

      const data = (as === 'json' ? await res.json() : await res.text()) as T
      if (!noCache) {
        cache.set(key, { at: Date.now(), status: res.status, data })
        if (cache.size > 400) {
          const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at).slice(0, 100)
          for (const [k] of oldest) cache.delete(k)
        }
      }
      noteSuccess(new URL(url).host)
      return { ok: true, data, cached: false, status: res.status }
    } catch (e) {
      const err = e as Error
      lastErr = err.name === 'TimeoutError' || err.name === 'AbortError' ? 'zaman asimi' : err.message
      notePenalty(url)
      void label
      // Hiz sinirinda kisa bekleme ise yaramaz; kademeli olarak uzun bekle
      if (attempt < RETRIES) await sleep(1500 * Math.pow(2.5, attempt - 1) + Math.random() * 600)
    }
  }
  return { ok: false, error: lastErr }
}

export const getJson = <T = unknown>(url: string, opts: RequestOptions = {}) =>
  request<T>(url, { ...opts, as: 'json' })

export const getText = (url: string, opts: RequestOptions = {}) =>
  request<string>(url, { ...opts, as: 'text' })

/** HTML icinden `var ytInitialData = {...};` tarzi JSON bloklarini cikarir. */
export function extractJsonAfter(html: string, marker: string): unknown {
  const idx = html.indexOf(marker)
  if (idx === -1) return null
  const i = html.indexOf('{', idx)
  if (i === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let j = i; j < html.length; j++) {
    const ch = html[j]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** Basit HTML etiket temizleyici. */
export function stripTags(html = ''): string {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
