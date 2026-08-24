import 'server-only'

import { whatsappConfiguration } from './whatsappConfig'

export { whatsappConfiguration }

export async function sendWhatsAppMessage(message: string) {
  const config = whatsappConfiguration()
  if (!config.configured) throw new Error(`WhatsApp yapılandırılmamış: ${config.missing.join(', ')}`)

  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', config.phone)
  url.searchParams.set('text', message.slice(0, 1800))
  url.searchParams.set('apikey', config.apiKey)

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`WhatsApp sağlayıcısı ${response.status} durumuyla yanıtladı.`)
  return { provider: 'callmebot' as const, recipient: config.phone.slice(-4).padStart(config.phone.length, '*') }
}
