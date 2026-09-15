import 'server-only'

import { telegramConfiguration } from './telegramConfig'
import {
  answerTelegramCallback,
  deliverTelegram,
  deliverTelegramToAllowedChat,
  type TelegramReplyMarkup,
} from './telegramDelivery'

export { telegramConfiguration }

export async function sendTelegramMessage(message: string) {
  const config = telegramConfiguration()
  if (!config.configured) throw new Error(`Telegram yapılandırılmamış: ${config.missing.join(', ')}`)
  return deliverTelegram(message, config)
}

export async function sendTelegramBotReply(
  chatId: string,
  message: string,
  replyMarkup?: TelegramReplyMarkup,
  additionalAllowedChatIds: string[] = [],
) {
  const config = telegramConfiguration()
  if (!config.configured) throw new Error(`Telegram yapılandırılmamış: ${config.missing.join(', ')}`)
  return deliverTelegramToAllowedChat(message, chatId, {
    ...config,
    chatIds: [...new Set([...config.chatIds, ...additionalAllowedChatIds])],
  }, { replyMarkup })
}

export async function acknowledgeTelegramButton(callbackQueryId: string) {
  const config = telegramConfiguration()
  if (!config.configured) throw new Error(`Telegram yapılandırılmamış: ${config.missing.join(', ')}`)
  return answerTelegramCallback(callbackQueryId, config.botToken)
}
