import 'server-only'

export async function getBackendHealth() {
  const configured = process.env.KADE_FASTAPI_BASE_URL
  if (!configured) throw new Error('FastAPI adresi yapılandırılmamış.')
  const base = new URL(configured)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('FastAPI adresi geçersiz.')
  }
  const target = new URL('/health', `${base.toString().replace(/\/$/, '')}/`)
  const response = await fetch(target, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
    headers: process.env.KADE_BACKEND_TOKEN ? { Authorization: `Bearer ${process.env.KADE_BACKEND_TOKEN}` } : undefined,
  })
  if (!response.ok) throw new Error(`FastAPI health başarısız: ${response.status}`)
  return response.json() as Promise<{ status: string; version?: string; modules?: string[] }>
}

function backendBase() {
  const configured = process.env.KADE_FASTAPI_BASE_URL
  if (!configured) throw new Error('FastAPI adresi yapılandırılmamış.')
  const base = new URL(configured)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
    throw new Error('FastAPI adresi geçersiz.')
  }
  return base.toString().replace(/\/$/, '')
}

/** Backend'e kimlikli POST isteği atar. Uzun işler için timeout ayarlanabilir. */
export async function callBackend<T = unknown>(
  path: string,
  body: unknown,
  timeoutMs = 20_000,
): Promise<{ ok: boolean; status: number; data: T }> {
  const target = new URL(path.replace(/^\//, ''), `${backendBase()}/`)
  const response = await fetch(target, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.KADE_BACKEND_TOKEN ? { Authorization: `Bearer ${process.env.KADE_BACKEND_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = (await response.json().catch(() => ({}))) as T
  return { ok: response.ok, status: response.status, data }
}
