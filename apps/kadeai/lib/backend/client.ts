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
