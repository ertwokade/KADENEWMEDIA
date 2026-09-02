import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { canUseOwnProviderKeys } from '@/lib/payments/access'
import {
  deleteUserProviderKey,
  isUserKeyProvider,
  listUserProviderKeyStatus,
  saveUserProviderKey,
} from '@/lib/ai/userProviderKeys'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { recordAuditEvent } from '@/lib/audit/server'

export const dynamic = 'force-dynamic'

function headers(request: NextRequest, action: string) {
  const limit = rateLimit(getRateLimitKey(request, `provider-keys-${action}`), action === 'read' ? 30 : 10, 60_000)
  return { limit, values: { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' } }
}

export async function GET(request: NextRequest) {
  const { limit, values } = headers(request, 'read')
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: values })
  try {
    const user = await assertAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers: values })
    const [keys, byokPlan] = await Promise.all([
      listUserProviderKeyStatus(user.id),
      canUseOwnProviderKeys(),
    ])
    return NextResponse.json({ keys, byokPlan }, { headers: values })
  } catch (error) {
    captureApiError(error, '/api/provider-keys#get')
    return NextResponse.json({ error: 'API anahtarı durumu okunamadı.' }, { status: 503, headers: values })
  }
}

export async function PUT(request: NextRequest) {
  const { limit, values } = headers(request, 'write')
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: values })
  try {
    const user = await assertAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers: values })
    if (!(await canUseOwnProviderKeys())) {
      return NextResponse.json({ error: 'Kendi anahtarını girmek için etkin bir paket gerekli.' }, { status: 403, headers: values })
    }
    const body = await request.json() as { provider?: unknown; key?: unknown }
    if (!isUserKeyProvider(body.provider) || typeof body.key !== 'string') {
      return NextResponse.json({ error: 'Geçersiz sağlayıcı veya anahtar.' }, { status: 400, headers: values })
    }
    await saveUserProviderKey(user.id, body.provider, body.key)
    void recordAuditEvent({ actorUserId: user.id, action: 'provider_key.saved', resourceType: 'provider_key', resourceId: body.provider })
    return NextResponse.json({ ok: true }, { headers: values })
  } catch (error) {
    captureApiError(error, '/api/provider-keys#put')
    const message = error instanceof Error ? error.message : 'API anahtarı kaydedilemedi.'
    return NextResponse.json({ error: message }, { status: 400, headers: values })
  }
}

export async function DELETE(request: NextRequest) {
  const { limit, values } = headers(request, 'delete')
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers: values })
  try {
    const user = await assertAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers: values })
    const provider = request.nextUrl.searchParams.get('provider')
    if (!isUserKeyProvider(provider)) {
      return NextResponse.json({ error: 'Geçersiz sağlayıcı.' }, { status: 400, headers: values })
    }
    await deleteUserProviderKey(user.id, provider)
    void recordAuditEvent({ actorUserId: user.id, action: 'provider_key.deleted', resourceType: 'provider_key', resourceId: provider })
    return NextResponse.json({ ok: true }, { headers: values })
  } catch (error) {
    captureApiError(error, '/api/provider-keys#delete')
    return NextResponse.json({ error: 'API anahtarı silinemedi.' }, { status: 400, headers: values })
  }
}
