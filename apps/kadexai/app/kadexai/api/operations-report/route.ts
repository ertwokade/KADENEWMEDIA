import { NextResponse } from 'next/server'
import { failure, requireCollectorAccess } from '../kade-search/_guard'
import { formatOperationsReport, normalizeOperationsReport } from '@/lib/notifications/operationsReport'
import { adminNotificationConfiguration, sendAdminNotification } from '@/lib/notifications/adminDelivery'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const guard = await requireCollectorAccess(request)
  if (guard) return guard

  const notifications = adminNotificationConfiguration()
  if (!notifications.configured) {
    return NextResponse.json(
      { error: 'Yönetim bildirimi yapılandırılmamış.' },
      { status: 503 },
    )
  }

  try {
    const report = normalizeOperationsReport(await request.json())
    if (!report.message) {
      return NextResponse.json({ error: 'Raporlanacak işlem bulunamadı.' }, { status: 400 })
    }
    const delivery = await sendAdminNotification(formatOperationsReport(report))
    return NextResponse.json({ sent: true, provider: delivery.provider, channels: delivery.channels })
  } catch (error) {
    return failure(error, 'Operasyon raporu gönderilemedi.')
  }
}
