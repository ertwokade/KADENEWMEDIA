import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { getCurrentPlan } from '@/lib/entitlement'
import { getUserUsageSummary } from '@/lib/usage/ledger'
import { isTokenQuotaEnforced } from '@/lib/payments/limits'
import { getRateLimitKey, rateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

/** Kullanıcının kendi AI kullanımı ve kalan kotası. */
export async function GET(request: NextRequest) {
  const limit = rateLimit(getRateLimitKey(request, 'usage-read'), 30, 60_000)
  const headers = { ...rateLimitHeaders(limit), 'Cache-Control': 'private, no-store' }
  if (!limit.allowed) return NextResponse.json({ error: 'Çok fazla istek.' }, { status: 429, headers })

  const user = await assertAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401, headers })

  try {
    const plan = await getCurrentPlan()
    const usage = await getUserUsageSummary(user.id, plan.tier)
    return NextResponse.json({
      plan,
      usage,
      quotaEnforced: isTokenQuotaEnforced(),
      // Defter okunamadıysa kota zorlanmaz; kullanıcı yanlış bilgilendirilmesin.
      available: usage !== null,
    }, { headers })
  } catch (error) {
    captureApiError(error, '/api/usage#get')
    return NextResponse.json({ error: 'Kullanım verisi okunamadı.' }, { status: 503, headers })
  }
}
