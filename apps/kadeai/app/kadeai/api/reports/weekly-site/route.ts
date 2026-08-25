import { NextRequest, NextResponse } from 'next/server'
import { auditPublicSite, formatWeeklySiteReport, weeklySiteReportKey } from '@/lib/reports/weeklySiteReport'
import { claimWeeklySiteReport, completeWeeklySiteReport, releaseWeeklySiteReport } from '@/lib/kade-search/store'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { failure, requireCollectorAccess } from '../../kade-search/_guard'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function deliver(req: NextRequest) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard
  const whatsApp = whatsappConfiguration()
  if (!whatsApp.configured) return NextResponse.json({ error: 'WhatsApp raporu yapılandırılmamış.', missing: whatsApp.missing }, { status: 503 })

  const started = Date.now()
  let claimId: string | null = null
  try {
    const key = weeklySiteReportKey()
    const claim = await claimWeeklySiteReport(key)
    claimId = claim.id
    if (!claim.claimed) return NextResponse.json({ sent: false, duplicate: true, week: key })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
    const audit = await auditPublicSite(siteUrl)
    const delivery = await sendWhatsAppMessage(formatWeeklySiteReport(audit, `${siteUrl}/kadeai/dashboard`))
    await completeWeeklySiteReport(claim.id, audit.pages.length, started)
    return NextResponse.json({ sent: true, provider: delivery.provider, audit })
  } catch (error) {
    if (claimId) await releaseWeeklySiteReport(claimId).catch(() => undefined)
    return failure(error, 'Haftalık site raporu gönderilemedi.')
  }
}

export async function GET(req: NextRequest) { return deliver(req) }
export async function POST(req: NextRequest) { return deliver(req) }
