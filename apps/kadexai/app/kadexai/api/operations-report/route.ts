import { NextResponse } from 'next/server'
import { failure, requireCollectorAccess } from '../kade-search/_guard'
import { formatOperationsReport, normalizeOperationsReport } from '@/lib/notifications/operationsReport'
import { sendWhatsAppMessage, whatsappConfiguration } from '@/lib/notifications/whatsapp'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const guard = await requireCollectorAccess(request)
  if (guard) return guard

  const whatsApp = whatsappConfiguration()
  if (!whatsApp.configured) {
    return NextResponse.json(
      { error: 'WhatsApp operasyon raporu yapılandırılmamış.', missing: whatsApp.missing },
      { status: 503 },
    )
  }

  try {
    const report = normalizeOperationsReport(await request.json())
    if (!report.message) {
      return NextResponse.json({ error: 'Raporlanacak işlem bulunamadı.' }, { status: 400 })
    }
    const delivery = await sendWhatsAppMessage(formatOperationsReport(report))
    return NextResponse.json({ sent: true, provider: delivery.provider })
  } catch (error) {
    return failure(error, 'Operasyon raporu WhatsApp’a gönderilemedi.')
  }
}
