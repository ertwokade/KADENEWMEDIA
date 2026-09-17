import { normalizeHashtagList } from './hashtags'

/** Sınırı aşan gönderi atılmaz; son cümle ya da kelime sınırında kısaltılır. */
function fitToLimit(text: string, limit: number) {
  if (text.length <= limit) return text
  const slice = text.slice(0, limit - 1)
  const sentenceEnd = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '))
  if (sentenceEnd > limit * 0.6) return slice.slice(0, sentenceEnd + 1)
  return `${slice.slice(0, slice.lastIndexOf(' ')).trimEnd()}…`
}

export function normalizeThread(value: Record<string, unknown>, platform: string, requested = 7) {
  const limit = platform === 'linkedin' ? 1300 : 280
  const hook = typeof value.hook === 'string' ? fitToLimit(value.hook.trim(), limit) : ''
  let posts = Array.isArray(value.posts) ? value.posts.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const content = typeof row.icerik === 'string' ? row.icerik.trim() : ''
    if (!content) return []
    return [{ icerik: fitToLimit(content, limit), tip: typeof row.tip === 'string' ? row.tip : 'bilgi' }]
  }) : []
  // Açılış gönderisi dizide yoksa hook ilk gönderi olur; son gönderideki "ilk mesaja dön" CTA'sı boşa düşmez.
  if (hook && posts[0]?.icerik !== hook) posts = [{ icerik: hook, tip: 'hook' }, ...posts]
  posts = posts.slice(0, Math.max(1, requested))
  if (!posts.length) throw new Error('Model geçerli bir thread döndürmedi. Lütfen yeniden dene.')
  return {
    hook: hook || posts[0].icerik,
    posts: posts.map((post, index) => ({ no: index + 1, ...post })),
    hashtags: normalizeHashtagList(value.hashtags, 20),
    requested,
  }
}

