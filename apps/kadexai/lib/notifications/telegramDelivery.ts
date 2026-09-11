import { maskTelegramChat } from './telegramConfig'

interface TelegramConfig {
  botToken: string
  chatIds: string[]
}

interface TelegramResponse {
  ok?: boolean
  description?: string
  result?: { message_id?: number }
  parameters?: { retry_after?: number }
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

  const endpoint = `https://api.telegram.org/bot${config.botToken}/sendMessage`
  const attempts = await Promise.allSettled(config.chatIds.map(async (chatId) => {
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
    if (!response.ok || payload.ok !== true || !payload.result?.message_id) {
      throw new Error(`Telegram gönderimi HTTP ${response.status} ile reddedildi (${maskTelegramChat(chatId)}).`)
    }
    return {
      recipient: maskTelegramChat(chatId),
      messageId: payload.result.message_id,
    }
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
