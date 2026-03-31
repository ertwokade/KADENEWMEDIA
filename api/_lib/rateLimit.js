// In-memory rate limiter for serverless environments
// Note: resets on cold start — for persistent rate limiting use Redis/Upstash

const requests = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // max requests per IP per window

function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function rateLimitCheck(req) {
  const ip = getIP(req);
  const now = Date.now();

  // Clean old entries
  for (const [key, value] of requests.entries()) {
    if (now - value.windowStart > WINDOW_MS) {
      requests.delete(key);
    }
  }

  const entry = requests.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requests.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000 / 60);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}
