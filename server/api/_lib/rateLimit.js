const requests = new Map();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = process.env.NODE_ENV === 'production' ? 5 : 50;

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function upstashRateLimit(key, windowSeconds, maxRequests) {
  const redis = getRedisConfig();
  if (!redis) return null;

  const response = await fetch(`${redis.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redis.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds],
      ['TTL', key],
    ]),
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit failed: ${response.status}`);
  }

  const result = await response.json();
  const count = Number(result?.[0]?.result || 0);
  const ttl = Number(result?.[2]?.result || windowSeconds);

  if (count > maxRequests) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil(ttl / 60)) };
  }

  return { allowed: true, remaining: Math.max(0, maxRequests - count) };
}

function inMemoryRateLimit(key, windowMs, maxRequests) {
  const now = Date.now();

  for (const [storedKey, value] of requests.entries()) {
    if (now - value.windowStart > windowMs) {
      requests.delete(storedKey);
    }
  }

  const entry = requests.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    requests.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((windowMs - (now - entry.windowStart)) / 60000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

export async function rateLimitCheck(req, options = {}) {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || options.max || DEFAULT_MAX_REQUESTS;
  const namespace = options.namespace || 'default';
  const key = `rate:${namespace}:${getIP(req)}`;

  if (getRedisConfig()) {
    try {
      const redisResult = await upstashRateLimit(key, Math.ceil(windowMs / 1000), maxRequests);
      if (redisResult) return redisResult;
    } catch (err) {
      console.error('Persistent rate limit error:', err.message);
      if (isProductionRuntime()) {
        // Redis configured but unreachable — fail closed to prevent brute force
        return { allowed: false, retryAfter: Math.ceil(windowMs / 60000), error: 'Rate limit backend unavailable' };
      }
    }
  } else if (isProductionRuntime()) {
    console.warn('UPSTASH_REDIS not configured — falling back to in-memory rate limiting');
  }

  return inMemoryRateLimit(key, windowMs, maxRequests);
}

