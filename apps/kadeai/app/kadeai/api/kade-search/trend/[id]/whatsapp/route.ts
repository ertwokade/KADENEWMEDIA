import { NextResponse } from 'next/server'
import { getTrendDetail } from '@/lib/kade-search/store'
import { formatSelectedTrend } from '@/lib/kade-search/dailyDigest'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'
import { failure, requireCollectorAccess } from '../../../_guard'

export const dynamic = 'force-dynamic'

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireCollectorAccess(req)
  if (guard) return guard

  const whatsApp = whatsappConfiguration()
  if (!whatsApp.configured) {
    return NextResponse.json(
      { error: 'WhatsApp gönderimi yapılandırılmamış.', missing: whatsApp.missing },
      { status: 503 },
    )
  }

  try {
    const { id } = await ctx.params
    const trend = await getTrendDetail(id)
    if (!trend) return NextResponse.json({ error: 'Trend bulunamadı.' }, { status: 404 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kadenewmedia.com'
    const message = formatSelectedTrend(trend, `${siteUrl}/kadeai/dashboard/trend-radar`)
    const delivery = await sendWhatsAppMessage(message)
    return NextResponse.json({ sent: true, provider: delivery.provider })
  } catch (e) {
    return failure(e, 'Seçilen içerik WhatsApp’a gönderilemedi.')
  }
}
