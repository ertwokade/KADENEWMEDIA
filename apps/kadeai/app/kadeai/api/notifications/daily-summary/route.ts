import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { sendDailyOperationSummary } from '@/lib/notifications/operationFeed'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

function hasCronAccess(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('x-cron-secret')?.trim() === secret
    || request.headers.get('authorization')?.trim() === `Bearer ${secret}`
}

/** Gün sonu işlem özetini WhatsApp'a gönderir. Cron veya sahip tetikler. */
export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' }

  if (!hasCronAccess(request)) {
    const user = await assertAuthenticatedUser()
    if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403, headers })
    }
  }

  try {
    return NextResponse.json(await sendDailyOperationSummary(), { headers })
  } catch (error) {
    captureApiError(error, '/api/notifications/daily-summary')
    // Uç yalnız sahibe açık; sağlayıcının gerçek yanıtını gizlemek teşhisi
    // imkânsız kılıyordu. Mesaj metni sır içermez (anahtar URL'de kalır).
    return NextResponse.json({
      error: 'Özet gönderilemedi.',
      reason: error instanceof Error ? error.message : String(error),
    }, { status: 503, headers })
  }
}
