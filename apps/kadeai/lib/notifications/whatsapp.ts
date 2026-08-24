import 'server-only'

export function whatsappConfiguration() {
  const phone = process.env.WA_PHONE?.replace(/\D/g, '') ?? ''
  const apiKey = process.env.WA_APIKEY?.trim() ?? ''
  const missing: string[] = []
  if (!/^\d{10,15}$/.test(phone)) missing.push('WA_PHONE')
  if (!apiKey || apiKey.length > 256 || /[\r\n]/.test(apiKey)) missing.push('WA_APIKEY')
  return { configured: missing.length === 0, missing, phone, apiKey }
}

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
