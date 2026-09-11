import { NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { type AdminNotificationChannel, sendAdminNotification } from '@/lib/notifications/adminDelivery'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' }
  const user = await assertAuthenticatedUser()
  if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403, headers })
  }

  let channel: AdminNotificationChannel | 'all' = 'all'
  try {
    const body = await request.json() as { channel?: unknown }
    if (body.channel === 'whatsapp' || body.channel === 'telegram' || body.channel === 'all') {
      channel = body.channel
    } else if (body.channel !== undefined) {
      return NextResponse.json({ error: 'Kanal whatsapp, telegram veya all olmalı.' }, { status: 400, headers })
    }
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400, headers })
  }

  try {
    const timestamp = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    const delivery = await sendAdminNotification(
      `✅ KadexAI bildirim testi\n${timestamp}`,
      channel === 'all' ? undefined : [channel],
    )
    return NextResponse.json({ sent: true, channels: delivery.channels, failed: delivery.failed }, { headers })
  } catch (error) {
    captureApiError(error, '/api/notifications/test')
    return NextResponse.json({
      error: 'Test bildirimi gönderilemedi.',
      reason: error instanceof Error ? error.message : String(error),
    }, { status: 503, headers })
  }
}
