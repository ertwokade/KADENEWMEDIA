import { NextRequest, NextResponse } from 'next/server'
import {
  claimDailyDigest,
  completeDailyDigest,
  dailyDigestCandidates,
  releaseDailyDigest,
} from '@/lib/kade-search/store'
import {
  dailyDigestKey,
  formatDailyDigest,
  selectDailyDigestTrends,
} from '@/lib/kade-search/dailyDigest'
import { adminNotificationConfiguration, sendAdminNotification } from '@/lib/notifications/adminDelivery'
import { failure, requireCollectorAccess } from '../_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function deliver(req: NextRequest) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard

  const notifications = adminNotificationConfiguration()
  if (!notifications.configured) {
    return NextResponse.json(
      { error: 'Yönetim bildirimi yapılandırılmamış.' },
      { status: 503 },
    )
  }

  let claimId: string | null = null
  const startedMs = Date.now()
  try {
    const trends = selectDailyDigestTrends(await dailyDigestCandidates(), 20)
    const dayKey = dailyDigestKey()
    const claim = await claimDailyDigest(dayKey)
    claimId = claim.id
    if (!claim.claimed) {
      return NextResponse.json({ sent: false, duplicate: true, day: dayKey })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
    const message = formatDailyDigest(trends, {
      dashboardUrl: `${siteUrl}/kadexai/dashboard/kade-search`,
    })
    const delivery = await sendAdminNotification(message)
    await completeDailyDigest(claim.id, trends.length, startedMs)
    return NextResponse.json({ sent: true, day: dayKey, items: trends.length, provider: delivery.provider, channels: delivery.channels })
  } catch (e) {
    if (claimId) await releaseDailyDigest(claimId).catch(() => undefined)
    return failure(e, 'Günlük yönetim özeti gönderilemedi.')
  }
}

export async function GET(req: NextRequest) {
  return deliver(req)
}

export async function POST(req: NextRequest) {
  return deliver(req)
}
