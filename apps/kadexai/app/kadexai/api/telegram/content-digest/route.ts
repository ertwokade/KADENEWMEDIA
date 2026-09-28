import { NextRequest, NextResponse } from 'next/server'
import { assertAuthenticatedUser } from '@/lib/auth/server'
import { isAllowedOwnerUser, isSettingsOwnerUser } from '@/lib/featureAccess'
import { sendTelegramContentDigests, type TelegramDigestHour } from '@/lib/notifications/telegramContentDigest'
import { captureApiError } from '@/lib/observability/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

function hasCronAccess(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('x-cron-secret')?.trim() === secret
    || request.headers.get('authorization')?.trim() === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' }
  if (!hasCronAccess(request)) {
    const user = await assertAuthenticatedUser()
    if (!user || (!isAllowedOwnerUser(user) && !isSettingsOwnerUser(user))) {
      return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403, headers })
    }
  }
  const hour = request.nextUrl.searchParams.get('slot')
  if (hour !== '09' && hour !== '12') {
    return NextResponse.json({ error: 'Geçersiz özet saati.' }, { status: 400, headers })
  }
  try {
    const result = await sendTelegramContentDigests(hour as TelegramDigestHour)
    return NextResponse.json(result, { status: result.failed ? 503 : 200, headers })
  } catch (error) {
    captureApiError(error, '/api/telegram/content-digest')
    return NextResponse.json({ error: 'Telegram içerik özeti gönderilemedi.' }, { status: 503, headers })
  }
}
