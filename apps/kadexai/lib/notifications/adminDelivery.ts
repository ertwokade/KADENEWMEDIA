import 'server-only'

import { sendTelegramMessage, telegramConfiguration } from './telegram'
import { sendWhatsAppMessage, whatsappConfiguration } from './whatsapp'

export type AdminNotificationChannel = 'whatsapp' | 'telegram'

function selectedChannels(): AdminNotificationChannel[] {
  const requested = (process.env.KADE_NOTIFICATION_CHANNELS || 'whatsapp,telegram')
    .split(',')
    .map((value) => value.trim().toLowerCase())
  return [...new Set(requested.filter(
    (value): value is AdminNotificationChannel => value === 'whatsapp' || value === 'telegram',
  ))]
}

export function adminNotificationConfiguration() {
  const selected = selectedChannels()
  const whatsapp = whatsappConfiguration()
  const telegram = telegramConfiguration()
  const available = selected.filter((channel) => (
    channel === 'whatsapp' ? whatsapp.configured : telegram.configured
  ))

  return {
    configured: available.length > 0,
    selected,
    available,
    whatsapp,
    telegram,
  }
}

export async function sendAdminNotification(
  message: string,
  only?: AdminNotificationChannel[],
) {
  const config = adminNotificationConfiguration()
  const channels = (only ?? config.selected).filter((channel) => (
    channel === 'whatsapp' ? config.whatsapp.configured : config.telegram.configured
  ))
  if (channels.length === 0) {
    throw new Error('Yönetim bildirimi yapılandırılmamış: WhatsApp veya Telegram ayarlarını tamamla.')
  }

  const attempts = await Promise.allSettled(channels.map(async (channel) => {
    if (channel === 'telegram') return sendTelegramMessage(message)
    return sendWhatsAppMessage(message)
  }))
  const sent = attempts.flatMap((attempt, index) => (
    attempt.status === 'fulfilled' ? [channels[index]] : []
  ))
  const failed = attempts.flatMap((attempt, index) => (
    attempt.status === 'rejected' ? [{
      channel: channels[index],
      reason: attempt.reason instanceof Error ? attempt.reason.message : 'Bildirim gönderilemedi.',
    }] : []
  ))

  if (sent.length === 0) {
    throw new Error(failed.map((failure) => `${failure.channel}: ${failure.reason}`).join(' '))
  }
  return {
    provider: sent.length > 1 ? 'multi' as const : sent[0],
    channels: sent,
    failed,
  }
}
