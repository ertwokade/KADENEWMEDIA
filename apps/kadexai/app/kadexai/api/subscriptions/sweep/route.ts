import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { sweepExpiredEntitlements } from '@/lib/payments/lifecycle'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

function hasCronAccess(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('x-cron-secret')?.trim() === secret
    || request.headers.get('authorization')?.trim() === `Bearer ${secret}`
}

/**
 * Süresi dolan abonelikleri kapatır ve yenilenmeyenler için churn yazar.
 * Zamanlanmış iş olarak veya hesap sahibi tarafından elle çalıştırılabilir.
 */
export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' }

  if (!hasCronAccess(request)) {
    const user = await assertAuthenticatedUser()
    if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403, headers })
    }
  }

  try {
    return NextResponse.json(await sweepExpiredEntitlements(), { headers })
  } catch (error) {
    captureApiError(error, '/api/subscriptions/sweep')
    return NextResponse.json({ error: 'Süpürme tamamlanamadı.' }, { status: 503, headers })
  }
}
