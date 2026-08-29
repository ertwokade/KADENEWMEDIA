import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { createQuoteRequest, listOwnQuoteRequests, QuoteValidationError, validateQuoteInput } from '@/lib/quotes/kadeaiQuotes'
import { recordAuditEvent } from '@/lib/audit/server'
import { notifyOperation } from '@/lib/notifications/operationFeed'
import { captureApiError } from '@/lib/observability/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

/** Kullanıcının kendi teklif talepleri. */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'quotes-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    return NextResponse.json({ quotes: await listOwnQuoteRequests(user.id) }, { headers })
  } catch (error) {
    captureApiError(error, '/api/quotes#get')
    return NextResponse.json({ error: 'Teklif talepleri okunamadı.' }, { status: 503, headers })
  }
}

/** Yeni teklif talebi. Spam'i sınırlamak için saatte 5 istek. */
export async function POST(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'quotes-create'), 5, 3_600_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Çok fazla teklif talebi gönderdin. Bir süre sonra tekrar dene.' }, { status: 429, headers })
  }

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    const input = validateQuoteInput(await request.json())
    const quote = await createQuoteRequest(user.id, input)
    // Audit metadata'sına kişisel veri yazılmaz; yalnız kayıt kimliği.
    void recordAuditEvent({
      actorUserId: user.id,
      action: 'quote_request.created',
      resourceType: 'kadeai_quote_request',
      resourceId: quote.id,
      metadata: { apiNeeded: quote.api_needed },
    })
    void notifyOperation({
      kind: 'quote_requested',
      title: `${quote.first_name} ${quote.last_name}${quote.company ? ` · ${quote.company}` : ''}`,
      detail: `${quote.email}${quote.team_size ? ` · ${quote.team_size} kişi` : ''}${quote.api_needed ? ' · API istiyor' : ''}`,
      userId: user.id,
    })
    return NextResponse.json({ quote }, { status: 201, headers })
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers })
    }
    captureApiError(error, '/api/quotes#post')
    return NextResponse.json({ error: 'Teklif talebi gönderilemedi.' }, { status: 503, headers })
  }
}
