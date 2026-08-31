import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { getLegalStatus, getPublishedLegalDocument, saveLegalDocument } from '@/lib/legal/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordAuditEvent } from '@/lib/audit/server'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

async function owner() {
  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) return null
  return user
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-legal-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  const slug = new URL(request.url).searchParams.get('slug')?.trim()

  try {
    if (slug) {
      // Taslak gövdeyi de sahibe göster (düzenleyebilmesi için).
      const admin = createAdminClient()
      const { data } = await admin.from('legal_documents').select('*').eq('slug', slug).maybeSingle()
      return NextResponse.json({ document: data ?? null, published: await getPublishedLegalDocument(slug) }, { headers })
    }
    return NextResponse.json({ documents: await getLegalStatus() }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/legal#get')
    return NextResponse.json({ error: 'Yasal metinler okunamadı.' }, { status: 503, headers })
  }
}

export async function PUT(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-legal-write'), 20, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  try {
    const body = await request.json() as {
      slug?: string
      title?: string
      body?: string
      status?: 'draft' | 'published'
      requiresCheckoutConsent?: boolean
    }
    const document = await saveLegalDocument({
      slug: String(body.slug || ''),
      title: body.title,
      body: body.body,
      status: body.status,
      requiresCheckoutConsent: body.requiresCheckoutConsent,
      updatedBy: user.id,
    })
    try { revalidatePath(`/kadexai/legal/${document.slug}`) } catch { /* ISR süresi devrede */ }
    void recordAuditEvent({
      actorUserId: user.id,
      action: document.status === 'published' ? 'legal_document.published' : 'legal_document.saved',
      resourceType: 'legal_document',
      resourceId: document.slug,
      metadata: { version: document.version, status: document.status },
    })
    return NextResponse.json({ document }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/legal#put')
    const message = error instanceof Error ? error.message : 'Yasal metin kaydedilemedi.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
