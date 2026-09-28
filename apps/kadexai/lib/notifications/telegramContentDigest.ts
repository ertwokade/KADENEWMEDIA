import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramBotReply } from './telegram'
import { TELEGRAM_MAIN_KEYBOARD } from './telegramBot'
import { telegramConfiguration } from './telegramConfig'
import { formatTelegramContentList } from './telegramContentPresentation'
import { telegramGroupIsActive } from './telegramGroupAccess'
import { telegramUserIsAuthorized } from './telegramUserAccess'
import { listTelegramContent, refreshTelegramContent, telegramContentChatIds } from './telegramSavedContent'

export type TelegramDigestHour = '09' | '12'

function istanbulDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function telegramDigestScheduleKey(hour: TelegramDigestHour, now = new Date()) {
  return `${istanbulDate(now)}T${hour}:00+03:00`
}

function safeError(error: unknown) {
  return String(error instanceof Error ? error.message : error).replace(/\s+/g, ' ').trim().slice(0, 500)
}

async function reserveDelivery(chatId: string, scheduleKey: string) {
  const { error } = await createAdminClient().from('telegram_content_digest_deliveries').insert({
    chat_id: chatId, schedule_key: scheduleKey, status: 'sending',
  })
  if (!error) return true
  if (error.code === '23505') return false
  throw new Error('Telegram içerik özeti teslim kaydı oluşturulamadı.')
}

async function finishDelivery(chatId: string, scheduleKey: string, status: 'sent' | 'failed' | 'skipped', itemCount: number, error?: unknown) {
  await createAdminClient().from('telegram_content_digest_deliveries').update({
    status,
    item_count: itemCount,
    error_message: error ? safeError(error) : null,
    finished_at: new Date().toISOString(),
  }).eq('chat_id', chatId).eq('schedule_key', scheduleKey)
}

export async function sendTelegramContentDigests(hour: TelegramDigestHour, now = new Date()) {
  const config = telegramConfiguration()
  if (!config.configured) throw new Error(`Telegram yapılandırılmamış: ${config.missing.join(', ')}`)
  const scheduleKey = telegramDigestScheduleKey(hour, now)
  const chatIds = await telegramContentChatIds()
  const result = { scheduleKey, chats: chatIds.length, sent: 0, skipped: 0, failed: 0, items: 0 }

  for (const chatId of chatIds) {
    const privateAllowed = config.chatIds.includes(chatId) || await telegramUserIsAuthorized(chatId)
    const groupAllowed = chatId.startsWith('-') && await telegramGroupIsActive(chatId)
    if (!privateAllowed && !groupAllowed) {
      result.skipped += 1
      continue
    }
    if (!await reserveDelivery(chatId, scheduleKey)) {
      result.skipped += 1
      continue
    }

    try {
      await refreshTelegramContent(chatId, 12)
      const rows = await listTelegramContent({ chatId, sort: 'performance', limit: 8 })
      if (!rows.length) {
        await finishDelivery(chatId, scheduleKey, 'skipped', 0)
        result.skipped += 1
        continue
      }
      const title = hour === '09'
        ? '☀️ 09:00 kayıtlı içerik özeti'
        : '🕛 12:00 kayıtlı içerik özeti'
      const message = formatTelegramContentList(rows, { title, sort: 'performance', limit: 8 })
      await sendTelegramBotReply(chatId, message, TELEGRAM_MAIN_KEYBOARD, groupAllowed ? [chatId] : [])
      await finishDelivery(chatId, scheduleKey, 'sent', rows.length)
      result.sent += 1
      result.items += rows.length
    } catch (error) {
      await finishDelivery(chatId, scheduleKey, 'failed', 0, error)
      result.failed += 1
    }
  }
  return result
}
