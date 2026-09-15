import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { captureApiError } from '@/lib/observability/server'
import { acknowledgeTelegramButton, sendTelegramBotReply } from '@/lib/notifications/telegram'
import { telegramWebhookConfiguration } from '@/lib/notifications/telegramConfig'
import { executeTelegramCommand } from '@/lib/notifications/telegramCommands'
import { parseTelegramBotUpdate, TELEGRAM_MAIN_KEYBOARD } from '@/lib/notifications/telegramBot'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const seenUpdates = new Set<number>()

function sameSecret(provided: string, expected: string) {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

function alreadySeen(updateId: number) {
  if (seenUpdates.has(updateId)) return true
  seenUpdates.add(updateId)
  if (seenUpdates.size > 1_000) seenUpdates.delete(seenUpdates.values().next().value as number)
  return false
}

export async function POST(request: Request) {
  const config = telegramWebhookConfiguration()
  if (!config.configured) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const providedSecret = request.headers.get('x-telegram-bot-api-secret-token') ?? ''
  if (!sameSecret(providedSecret, config.webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const length = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(length) && length > 64 * 1024) {
    return NextResponse.json({ ok: false }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const action = parseTelegramBotUpdate(payload)
  if (!action || !config.chatIds.includes(action.chatId) || alreadySeen(action.updateId)) {
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    if (action.callbackQueryId) {
      await acknowledgeTelegramButton(action.callbackQueryId).catch(() => undefined)
    }
    const message = await executeTelegramCommand(action.command)
    await sendTelegramBotReply(action.chatId, message, TELEGRAM_MAIN_KEYBOARD)
  } catch (error) {
    captureApiError(error, '/api/telegram/webhook')
    await sendTelegramBotReply(
      action.chatId,
      '⚠️ KadeX bu komutu şu anda tamamlayamadı. Sistem kaydı alındı; biraz sonra yeniden deneyebilirsin.',
      TELEGRAM_MAIN_KEYBOARD,
    ).catch(() => undefined)
  }

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
