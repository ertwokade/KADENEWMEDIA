import { NextRequest, NextResponse } from 'next/server'
import {
  claimWeeklyDigest,
  completeWeeklyDigest,
  releaseWeeklyDigest,
  weeklyDigestCandidates,
} from '@/lib/kade-search/store'
import {
  formatWeeklyDigest,
  selectWeeklyDigestTrends,
  weeklyDigestKey,
} from '@/lib/kade-search/weeklyDigest'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { failure, requireCollectorAccess } from '../_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function deliver(req: NextRequest) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard

  const whatsApp = whatsappConfiguration()
  if (!whatsApp.configured) {
    return NextResponse.json(
      { error: 'WhatsApp haftalık özeti yapılandırılmamış.', missing: whatsApp.missing },
      { status: 503 },
    )
  }

  let claimId: string | null = null
  const startedMs = Date.now()
  try {
    const trends = selectWeeklyDigestTrends(await weeklyDigestCandidates(), 4)
    const weekKey = weeklyDigestKey()
    const claim = await claimWeeklyDigest(weekKey)
    claimId = claim.id
    if (!claim.claimed) {
      return NextResponse.json({ sent: false, duplicate: true, week: weekKey })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
    const message = formatWeeklyDigest(trends, {
      dashboardUrl: `${siteUrl}/kadexai/dashboard/trend-radar`,
    })
    const delivery = await sendWhatsAppMessage(message)
    await completeWeeklyDigest(claim.id, trends.length, startedMs)
    return NextResponse.json({ sent: true, week: weekKey, items: trends.length, provider: delivery.provider })
  } catch (e) {
    if (claimId) await releaseWeeklyDigest(claimId).catch(() => undefined)
    return failure(e, 'Haftalık WhatsApp özeti gönderilemedi.')
  }
}

export async function GET(req: NextRequest) {
  return deliver(req)
}

export async function POST(req: NextRequest) {
  return deliver(req)
}
