const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

const ROUTE_BODY_LIMITS = {
  chat: 64 * 1024,
  media: 3 * 1024 * 1024,
  shopier: 128 * 1024,
}

export function estimateRequestBodyBytes(req) {
  const declared = Number(req.headers?.['content-length'])
  if (Number.isFinite(declared) && declared >= 0) return declared

  const body = req.body
  if (body == null) return 0
  try {
    return Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body), 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

export function validateRequestBodySize(req, res, route) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(String(req.method || 'GET').toUpperCase())) return true
  const maxBytes = ROUTE_BODY_LIMITS[route] || DEFAULT_MAX_BODY_BYTES
  if (estimateRequestBodyBytes(req) <= maxBytes) return true
  res.status(413).json({ error: 'İstek gövdesi izin verilen sınırı aşıyor' })
  return false
}

export { DEFAULT_MAX_BODY_BYTES, ROUTE_BODY_LIMITS }
