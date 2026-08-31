import 'server-only'

import { callMeBotResponseQueued, whatsappConfiguration } from './whatsappConfig'

export { whatsappConfiguration }

const MAX_ATTEMPTS = 2

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendWhatsAppMessage(message: string) {
  const config = whatsappConfiguration()
  if (!config.configured) throw new Error(`WhatsApp yapılandırılmamış: ${config.missing.join(', ')}`)

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', config.phone)
  url.searchParams.set('text', message.slice(0, 1800))
  url.searchParams.set('apikey', config.apiKey)

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      })
      const providerMessage = (await response.text()).trim().slice(0, 500)

      if (!response.ok) {
        const error = new Error(`WhatsApp sağlayıcısı ${response.status} durumuyla yanıtladı.`)
        if (response.status < 500 && response.status !== 429) throw error
        lastError = error
      } else if (!callMeBotResponseQueued(providerMessage)) {
        throw new Error(`WhatsApp sağlayıcısı mesajı kabul etmedi: ${providerMessage || 'boş yanıt'}`)
      } else {
        return {
          provider: 'callmebot' as const,
          providerStatus: 'queued' as const,
          recipient: config.phone.slice(-4).padStart(config.phone.length, '*'),
        }
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_ATTEMPTS) break
    }

    await delay(500 * attempt)
  }

  throw lastError instanceof Error ? lastError : new Error('WhatsApp sağlayıcısına ulaşılamadı.')
}
