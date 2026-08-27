import { NextRequest, NextResponse } from 'next/server'
import { getPublishedLegalDocument, getRequiredCheckoutDocuments } from '@/lib/legal/server'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

/**
 * Yayınlanmış yasal metinler. `?slug=` verilirse tek metnin gövdesi,
 * verilmezse ödeme öncesi onay gereken metinlerin listesi döner.
 */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'legal-read'), 60, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'public, max-age=300' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const slug = new URL(request.url).searchParams.get('slug')?.trim()

  try {
    if (slug) {
      const document = await getPublishedLegalDocument(slug)
      if (!document) return NextResponse.json({ error: 'Metin bulunamadı.' }, { status: 404, headers })
      return NextResponse.json({
        slug: document.slug,
        title: document.title,
        version: document.version,
        body: document.body,
        publishedAt: document.published_at,
      }, { headers })
    }
    return NextResponse.json({ checkoutDocuments: await getRequiredCheckoutDocuments() }, { headers })
  } catch (error) {
    captureApiError(error, '/api/legal#get')
    return NextResponse.json({ error: 'Yasal metinler okunamadı.' }, { status: 503, headers })
  }
}
