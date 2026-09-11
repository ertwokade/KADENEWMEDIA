import { callMeBotResponseQueued } from './whatsappConfig'

/** One attempt only: a lost response may already have queued the message.
 * Do not replay non-idempotent delivery or expose provider bodies/credential URLs.
 */
export async function deliverWhatsApp(
  message: string,
  config: { phone: string; apiKey: string },
  fetcher: typeof fetch = fetch,
) {
  if (!message.trim()) throw new Error('WhatsApp mesajı boş olamaz.')
  const url = new URL('https://api.callmebot.com/whatsapp.php')
  url.searchParams.set('phone', config.phone)
  url.searchParams.set('text', [...message].slice(0, 1800).join(''))
  url.searchParams.set('apikey', config.apiKey)
  let response: Response
  let body: string
  try {
    response = await fetcher(url, { method: 'GET', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(20_000) })
    body = await response.text()
  } catch {
    throw new Error('WhatsApp sağlayıcısının yanıtı alınamadı. Teslim durumu belirsiz; mükerrer mesajı önlemek için otomatik tekrar yapılmadı.')
  }
  if (response.status === 429) throw new Error('WhatsApp sağlayıcısının gönderim sınırına ulaşıldı. Daha sonra tekrar dene.')
  if (!response.ok) throw new Error(`WhatsApp sağlayıcısı HTTP ${response.status} hatası verdi.`)
  if (!callMeBotResponseQueued(body)) {
    throw new Error('WhatsApp sağlayıcısı kuyruğa alma onayı vermedi. Numara/anahtar eşleşmesini ve CallMeBot etkinleştirmesini kontrol et.')
  }
  return {
    provider: 'callmebot' as const,
    providerStatus: 'queued' as const,
    recipient: config.phone.slice(-4).padStart(config.phone.length, '*'),
  }
}
