import { maskTelegramChat } from './telegramConfig'

interface TelegramConfig {
  botToken: string
  chatIds: string[]
}

interface TelegramResponse {
  ok?: boolean
  description?: string
  result?: { message_id?: number } | boolean
  parameters?: { retry_after?: number }
}

export interface TelegramReplyMarkup {
  inline_keyboard: Array<Array<{
    text: string
    callback_data: string
  }>>
}

interface TelegramMessageOptions {
  replyMarkup?: TelegramReplyMarkup
}

async function deliverOneTelegram(
  text: string,
  chatId: string,
  botToken: string,
  options: TelegramMessageOptions,
  fetcher: typeof fetch,
) {
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`
  let response: Response
  let payload: TelegramResponse
  try {
    response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        link_preview_options: { is_disabled: true },
        protect_content: true,
        ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    })
    payload = await response.json() as TelegramResponse
  } catch {
    throw new Error(`Telegram yanıtı alınamadı (${maskTelegramChat(chatId)}); teslim durumu belirsiz ve otomatik tekrar yapılmadı.`)
  }

  if (response.status === 429) {
    const wait = payload.parameters?.retry_after
    throw new Error(`Telegram gönderim sınırına ulaşıldı${wait ? `; ${wait} saniye sonra yeniden denenebilir` : ''} (${maskTelegramChat(chatId)}).`)
  }
  const result = typeof payload.result === 'object' ? payload.result : undefined
  if (!response.ok || payload.ok !== true || !result?.message_id) {
    throw new Error(`Telegram gönderimi HTTP ${response.status} ile reddedildi (${maskTelegramChat(chatId)}).`)
  }
  return {
    recipient: maskTelegramChat(chatId),
    messageId: result.message_id,
  }
}

/**
 * Telegram Bot API'ye her alıcı için yalnız bir kez istek gönderir.
 * Ağ yanıtı kaybolursa Telegram mesajı kabul etmiş olabilir; bu nedenle
 * otomatik tekrar mükerrer yönetim bildirimi doğurabilir ve yapılmaz.
 */
export async function deliverTelegram(
  message: string,
  config: TelegramConfig,
  fetcher: typeof fetch = fetch,
) {
  const text = [...message.trim()].slice(0, 4096).join('')
  if (!text) throw new Error('Telegram mesajı boş olamaz.')
  if (config.chatIds.length === 0) throw new Error('Telegram alıcı listesi boş olamaz.')

  const attempts = await Promise.allSettled(config.chatIds.map(async (chatId) => {
    return deliverOneTelegram(text, chatId, config.botToken, {}, fetcher)
  }))

  const delivered = attempts
    .filter((attempt): attempt is PromiseFulfilledResult<{ recipient: string; messageId: number }> => attempt.status === 'fulfilled')
    .map((attempt) => attempt.value)
  const failures = attempts
    .filter((attempt): attempt is PromiseRejectedResult => attempt.status === 'rejected')
    .map((attempt) => attempt.reason instanceof Error ? attempt.reason.message : 'Telegram gönderimi başarısız.')

  if (delivered.length === 0) throw new Error(failures.join(' '))
  return {
    provider: 'telegram' as const,
    providerStatus: failures.length ? 'partial' as const : 'sent' as const,
    delivered,
    failures,
  }
}

export async function deliverTelegramToAllowedChat(
  message: string,
  chatId: string,
  config: TelegramConfig,
  options: TelegramMessageOptions = {},
  fetcher: typeof fetch = fetch,
) {
  if (!config.chatIds.includes(chatId)) throw new Error('Telegram hedefi izin listesinde değil.')
  const text = [...message.trim()].slice(0, 4096).join('')
  if (!text) throw new Error('Telegram mesajı boş olamaz.')
  return deliverOneTelegram(text, chatId, config.botToken, options, fetcher)
}

export async function answerTelegramCallback(
  callbackQueryId: string,
  botToken: string,
  fetcher: typeof fetch = fetch,
) {
  const endpoint = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`
  let response: Response
  let payload: TelegramResponse
  try {
    response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    })
    payload = await response.json() as TelegramResponse
  } catch {
    throw new Error('Telegram düğme onayı alınamadı.')
  }
  if (!response.ok || payload.ok !== true) throw new Error('Telegram düğme onayı reddedildi.')
}
