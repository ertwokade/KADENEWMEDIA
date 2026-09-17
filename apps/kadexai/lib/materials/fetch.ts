const HOSTS = ['str.arsivhub.com', 'arsivhub.com', 'i.ytimg.com', 'img.youtube.com']
const CDN_SUFFIXES = ['tiktokcdn.com', 'tiktokcdn-us.com', 'byteimg.com', 'ibytedtos.com', 'googlevideo.com']
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export function materialTarget(source: string): URL {
  const target = new URL(source)
  const host = target.hostname.toLowerCase()
  if (target.protocol !== 'https:' || target.username || target.password || (target.port && target.port !== '443')
    || !(HOSTS.includes(host) || CDN_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`)))) {
    throw new Error('Materyal kaynağı izinli bir HTTPS medya sunucusu değil.')
  }
  return target
}

/** Database rows originate in external feeds too; validate every redirect, not only the initial URL. */
export async function fetchMaterial(source: string, request: typeof fetch = fetch, range?: string | null): Promise<Response> {
  let target = materialTarget(source)
  // Zaman aşımı yalnız yanıt başlıklarına uygulanır; uzun video akışı 20 sn'de kesilmez.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  const headers: Record<string, string> = { accept: 'image/*,video/*,application/octet-stream;q=0.5', 'user-agent': 'KadexAI-Materials/1.0' }
  if (range && /^bytes=\d*-\d*$/.test(range)) headers.range = range
  try {
    for (let hop = 0; hop <= 3; hop++) {
      const response = await request(target, { redirect: 'manual', signal: controller.signal, headers })
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location')
        await response.body?.cancel()
        if (!location) throw new Error('Materyal yönlendirmesi geçersiz.')
        target = materialTarget(new URL(location, target).href)
        continue
      }
      if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error('Materyal kaynağı şu anda yanıt vermiyor.') }
      return response
    }
    throw new Error('Materyal kaynağı çok fazla yönlendirme yaptı.')
  } finally {
    clearTimeout(timer)
  }
}

export async function thumbnailBytes(response: Response, maxBytes = 8 * 1024 * 1024) {
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || ''
  const length = Number(response.headers.get('content-length') || 0)
  if (!IMAGE_TYPES.has(type) || length > maxBytes || !response.body) {
    await response.body?.cancel()
    throw new Error('Küçük resim türü veya boyutu desteklenmiyor.')
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) throw new Error('Küçük resim çok büyük.')
      chunks.push(value)
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error }
  finally { reader.releaseLock() }
  if (!size) throw new Error('Küçük resim boş.')
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return { bytes, type }
}
