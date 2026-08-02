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

export interface DistributedRateLimitOptions {
  identity: string
  minuteLimit?: number
  dailyLimit?: number
  cost?: number
  idempotencyKey?: string
  now?: number
}

export interface DistributedRateLimitResult {
  allowed: boolean
  status: 200 | 409 | 429 | 503
  reason: 'ok' | 'duplicate' | 'minute_limit' | 'daily_limit' | 'backend_unavailable'
  remaining: number
  resetIn: number
}

const distributedStore = new Map<string, RateLimitEntry>()
const idempotencyStore = new Map<string, number>()

const DISTRIBUTED_LIMIT_SCRIPT = `
local minute = tonumber(redis.call('GET', KEYS[1]) or '0')
local daily = tonumber(redis.call('GET', KEYS[2]) or '0')
local cost = tonumber(ARGV[1])
if KEYS[3] ~= '' and redis.call('EXISTS', KEYS[3]) == 1 then return {2, minute, daily} end
if minute + cost > tonumber(ARGV[2]) then return {3, minute, daily} end
if daily + cost > tonumber(ARGV[3]) then return {4, minute, daily} end
minute = redis.call('INCRBY', KEYS[1], cost)
if minute == cost then redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4])) end
daily = redis.call('INCRBY', KEYS[2], cost)
if daily == cost then redis.call('EXPIRE', KEYS[2], tonumber(ARGV[5])) end
if KEYS[3] ~= '' then redis.call('SET', KEYS[3], '1', 'EX', tonumber(ARGV[6]), 'NX') end
return {1, minute, daily}
`.trim()

function boundedInteger(value: number | undefined, fallback: number, max: number) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(1, Math.floor(parsed))) : fallback
}

function localDistributedRateLimit(scope: string, options: DistributedRateLimitOptions): DistributedRateLimitResult {
  const now = options.now ?? Date.now()
  const minuteLimit = boundedInteger(options.minuteLimit, 30, 10_000)
  const dailyLimit = boundedInteger(options.dailyLimit, 500, 1_000_000)
  const cost = boundedInteger(options.cost, 1, 100)
  const identity = stableSegment(options.identity.trim().toLocaleLowerCase('en-US'))
  const minuteBucket = Math.floor(now / 60_000)
  const dayBucket = Math.floor(now / 86_400_000)
  const minuteKey = `${scope}:minute:${identity}:${minuteBucket}`
  const dailyKey = `${scope}:day:${identity}:${dayBucket}`
  const idemKey = options.idempotencyKey
    ? `${scope}:idem:${identity}:${stableSegment(options.idempotencyKey)}`
    : ''

  for (const [key, expiresAt] of idempotencyStore) {
    if (expiresAt <= now) idempotencyStore.delete(key)
  }
  if (idemKey && (idempotencyStore.get(idemKey) ?? 0) > now) {
    return { allowed: false, status: 409, reason: 'duplicate', remaining: 0, resetIn: 86_400_000 }
  }

  const minute = distributedStore.get(minuteKey)
  const daily = distributedStore.get(dailyKey)
  const minuteCount = minute && minute.resetAt > now ? minute.count : 0
  const dailyCount = daily && daily.resetAt > now ? daily.count : 0
  if (minuteCount + cost > minuteLimit) {
    return { allowed: false, status: 429, reason: 'minute_limit', remaining: 0, resetIn: minute?.resetAt ? minute.resetAt - now : 60_000 }
  }
  if (dailyCount + cost > dailyLimit) {
    return { allowed: false, status: 429, reason: 'daily_limit', remaining: 0, resetIn: daily?.resetAt ? daily.resetAt - now : 86_400_000 }
  }

  distributedStore.set(minuteKey, { count: minuteCount + cost, resetAt: (minuteBucket + 1) * 60_000 })
  distributedStore.set(dailyKey, { count: dailyCount + cost, resetAt: (dayBucket + 1) * 86_400_000 })
  if (idemKey) idempotencyStore.set(idemKey, now + 86_400_000)
  return {
    allowed: true,
    status: 200,
    reason: 'ok',
    remaining: Math.max(0, Math.min(minuteLimit - minuteCount - cost, dailyLimit - dailyCount - cost)),
    resetIn: (minuteBucket + 1) * 60_000 - now,
  }
}

export function countedDistributedRateLimit(
  options: DistributedRateLimitOptions,
  minuteCount: number,
  dailyCount: number
): DistributedRateLimitResult {
  const minuteLimit = boundedInteger(options.minuteLimit, 30, 10_000)
  const dailyLimit = boundedInteger(options.dailyLimit, 500, 1_000_000)
  const cost = boundedInteger(options.cost, 1, 100)
  const safeMinuteCount = Math.max(0, Math.floor(minuteCount || 0))
  const safeDailyCount = Math.max(0, Math.floor(dailyCount || 0))

  if (safeMinuteCount + cost > minuteLimit) {
    return { allowed: false, status: 429, reason: 'minute_limit', remaining: 0, resetIn: 60_000 }
  }
  if (safeDailyCount + cost > dailyLimit) {
    return { allowed: false, status: 429, reason: 'daily_limit', remaining: 0, resetIn: 86_400_000 }
  }

  return {
    allowed: true,
    status: 200,
    reason: 'ok',
    remaining: Math.max(0, Math.min(minuteLimit - safeMinuteCount - cost, dailyLimit - safeDailyCount - cost)),
    resetIn: 60_000,
  }
}

export async function distributedRateLimit(
  scope: string,
  options: DistributedRateLimitOptions
): Promise<DistributedRateLimitResult> {
  if (process.env.NODE_ENV !== 'production') return localDistributedRateLimit(scope, options)

  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return { allowed: false, status: 503, reason: 'backend_unavailable', remaining: 0, resetIn: 60_000 }
  }

  const now = options.now ?? Date.now()
  const minuteLimit = boundedInteger(options.minuteLimit, 30, 10_000)
  const dailyLimit = boundedInteger(options.dailyLimit, 500, 1_000_000)
  const cost = boundedInteger(options.cost, 1, 100)
  const identity = stableSegment(options.identity.trim().toLocaleLowerCase('en-US'))
  const minuteBucket = Math.floor(now / 60_000)
  const dayBucket = Math.floor(now / 86_400_000)
  const prefix = `kade:${scope}:${identity}`
  const idempotencyKey = options.idempotencyKey
    ? `${prefix}:idem:${stableSegment(options.idempotencyKey)}`
    : ''

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        'EVAL', DISTRIBUTED_LIMIT_SCRIPT, '3',
        `${prefix}:minute:${minuteBucket}`,
        `${prefix}:day:${dayBucket}`,
        idempotencyKey,
        String(cost), String(minuteLimit), String(dailyLimit), '120', '172800', '86400',
      ]),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`rate-limit backend returned ${response.status}`)
    const payload = await response.json() as { result?: number[] }
    const [code, minuteCount = 0, dailyCount = 0] = payload.result || []
    if (code === 1) {
      return {
        allowed: true, status: 200, reason: 'ok',
        remaining: Math.max(0, Math.min(minuteLimit - minuteCount, dailyLimit - dailyCount)),
        resetIn: (minuteBucket + 1) * 60_000 - now,
      }
    }
    if (code === 2) return { allowed: false, status: 409, reason: 'duplicate', remaining: 0, resetIn: 86_400_000 }
    if (code === 3) return { allowed: false, status: 429, reason: 'minute_limit', remaining: 0, resetIn: (minuteBucket + 1) * 60_000 - now }
    if (code === 4) return { allowed: false, status: 429, reason: 'daily_limit', remaining: 0, resetIn: (dayBucket + 1) * 86_400_000 - now }
    throw new Error('rate-limit backend returned an invalid result')
  } catch {
    return { allowed: false, status: 503, reason: 'backend_unavailable', remaining: 0, resetIn: 60_000 }
  }
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
