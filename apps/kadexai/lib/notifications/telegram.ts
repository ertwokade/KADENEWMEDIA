import 'server-only'

import { telegramConfiguration } from './telegramConfig'
import { deliverTelegram } from './telegramDelivery'

export { telegramConfiguration }

export async function sendTelegramMessage(message: string) {
  const config = telegramConfiguration()
  if (!config.configured) throw new Error(`Telegram yapılandırılmamış: ${config.missing.join(', ')}`)
  return deliverTelegram(message, config)
}
