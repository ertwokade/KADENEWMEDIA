import 'server-only'

import { whatsappConfiguration } from './whatsappConfig'
import { deliverWhatsApp } from './whatsappDelivery'

export { whatsappConfiguration }

export async function sendWhatsAppMessage(message: string) {
  const config = whatsappConfiguration()
  if (!config.configured) throw new Error(`WhatsApp yapılandırılmamış: ${config.missing.join(', ')}`)

  return deliverWhatsApp(message, config)
}
