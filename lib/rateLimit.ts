interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let lastPruneAt = 0

function pruneExpired(now: number) {
  if (now - lastPruneAt < 60_000) return
  lastPruneAt = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

function stableSegment(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  pruneExpired(now)
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetIn: windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now }
}

export function getRateLimitKey(req: Request, scope = 'general', identity = ''): string {
  const forwarded =
    req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for') ||
    'unknown'
  const ip = forwarded.split(',')[0].trim().slice(0, 64) || 'unknown'
  const suffix = identity ? `:${stableSegment(identity.trim().toLocaleLowerCase('en-US'))}` : ''
  return `${scope}:${stableSegment(ip)}${suffix}`
}

export function rateLimitHeaders(result: { remaining: number; resetIn: number }) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'Retry-After': String(Math.max(1, Math.ceil(result.resetIn / 1000))),
  }
}
