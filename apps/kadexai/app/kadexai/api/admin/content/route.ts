import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { CONTENT_DEFAULTS, getContent, saveContent, type ContentKey } from '@/lib/cms/content'
import { recordAuditEvent } from '@/lib/audit/server'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** Hangi CMS anahtarı hangi kamuya açık yolu besliyor (revalidate için). */
const CONTENT_PATHS: Record<ContentKey, string> = {
  'kadexai-demo': '/kadexai-demo',
}

async function owner() {
  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) return null
  return user
}

function parseKey(request: NextRequest): ContentKey | null {
  const key = new URL(request.url).searchParams.get('key') || 'kadexai-demo'
  return key in CONTENT_DEFAULTS ? key as ContentKey : null
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-content-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  const key = parseKey(request)
  if (!key) return NextResponse.json({ error: 'Bilinmeyen içerik anahtarı.' }, { status: 400, headers })

  try {
    return NextResponse.json({
      key,
      content: await getContent(key),
      defaults: CONTENT_DEFAULTS[key],
      keys: Object.keys(CONTENT_DEFAULTS),
    }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/content#get')
    return NextResponse.json({ error: 'İçerik okunamadı.' }, { status: 503, headers })
  }
}

export async function PUT(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-content-write'), 20, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  const key = parseKey(request)
  if (!key) return NextResponse.json({ error: 'Bilinmeyen içerik anahtarı.' }, { status: 400, headers })

  try {
    const body = await request.json() as { content?: unknown }
    // saveContent şemayı varsayılanlara göre süzer; bilinmeyen alan yazılmaz.
    const content = await saveContent(key, body.content, user.id)
    // Kamuya açık sayfa ISR ile yayınlanıyor; değişiklik hemen görünsün.
    try { revalidatePath(CONTENT_PATHS[key]) } catch { /* önbellek yenilenemedi; ISR süresi devrede */ }
    void recordAuditEvent({
      actorUserId: user.id,
      action: 'cms.updated',
      resourceType: 'kadexai_content_block',
      resourceId: key,
    })
    return NextResponse.json({ key, content }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/content#put')
    const message = error instanceof Error ? error.message : 'İçerik kaydedilemedi.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
