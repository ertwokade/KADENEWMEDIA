import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import {
  listAllQuoteRequests,
  QUOTE_STATUSES,
  QuoteValidationError,
  updateQuoteRequest,
  type QuoteStatus,
} from '@/lib/quotes/kadeaiQuotes'
import { createDynamicOffer } from '@/lib/payments/offers'
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
  const limit = rateLimit(getRateLimitKey(request, 'admin-quotes-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  const requested = new URL(request.url).searchParams.get('status')
  const status = requested && (QUOTE_STATUSES as readonly string[]).includes(requested) ? requested as QuoteStatus : null

  try {
    return NextResponse.json({ quotes: await listAllQuoteRequests(status), statuses: QUOTE_STATUSES }, { headers })
  } catch (error) {
    captureApiError(error, '/api/admin/quotes#get')
    return NextResponse.json({ error: 'Teklif talepleri okunamadı.' }, { status: 503, headers })
  }
}

/**
 * Pipeline güncellemesi ve §16 "Ödeme Oluştur".
 *
 * `action: 'create-payment'` teklifi 15 dakikalık özel Shopier siparişine
 * çevirir; kullanıcı bunu Paketler sayfasında "Size Özel Teklif" olarak görür.
 */
export async function PATCH(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'admin-quotes-write'), 20, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await owner()
  if (!user) return NextResponse.json({ error: 'Bu alan yalnızca hesap sahibine açıktır.' }, { status: 403, headers })

  try {
    const body = await request.json() as {
      id?: string
      action?: 'update' | 'create-payment'
      status?: QuoteStatus
      adminNote?: string | null
      productId?: string
      amountMinor?: number
      customerEmail?: string
    }

    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'Teklif kimliği gerekli.' }, { status: 400, headers })

    if (body.action === 'create-payment') {
      const offer = await createDynamicOffer({
        productId: String(body.productId || ''),
        customerEmail: String(body.customerEmail || ''),
        customAmountMinor: Number(body.amountMinor),
        validityMinutes: 15,
      })
      const quote = await updateQuoteRequest({
        id,
        status: 'payment_pending',
        paymentOrderId: offer.orderId,
        updatedBy: user.id,
      })
      void recordAuditEvent({
        actorUserId: user.id,
        action: 'quote_request.payment_created',
        resourceType: 'kadeai_quote_request',
        resourceId: id,
        metadata: { amountMinor: offer.amountMinor, validityMinutes: 15 },
      })
      return NextResponse.json({ quote, offer }, { headers })
    }

    const quote = await updateQuoteRequest({
      id,
      status: body.status,
      adminNote: body.adminNote,
      updatedBy: user.id,
    })
    void recordAuditEvent({
      actorUserId: user.id,
      action: 'quote_request.updated',
      resourceType: 'kadeai_quote_request',
      resourceId: id,
      metadata: { status: quote.status },
    })
    return NextResponse.json({ quote }, { headers })
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers })
    }
    captureApiError(error, '/api/admin/quotes#patch')
    const message = error instanceof Error ? error.message : 'İşlem tamamlanamadı.'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}
