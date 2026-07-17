import 'server-only'

import { createHash } from 'node:crypto'
import { renderEmail } from './templates'
import type { EmailProvider, EmailTemplate } from './types'

class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend'

  async send(message: ReturnType<typeof renderEmail>, idempotencyKey: string) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM
    if (!apiKey || !from) throw new Error('Resend yapılandırması eksik.')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey.slice(0, 256),
        'User-Agent': 'KADE-AI/1.0',
      },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    })
    if (!response.ok) throw new Error(`E-posta sağlayıcısı isteği başarısız: ${response.status}`)
    const data = await response.json() as { id?: string }
    if (!data.id) throw new Error('E-posta sağlayıcısı geçersiz yanıt verdi.')
    return { id: data.id }
  }
}

class LogEmailProvider implements EmailProvider {
  readonly name = 'log'
  async send(message: ReturnType<typeof renderEmail>, idempotencyKey: string) {
    const id = createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 16)
    console.info(`[email:mock] template-only id=${id} recipient=[redacted] subject=${message.subject}`)
    return { id: `log-${id}` }
  }
}

function provider(): EmailProvider {
  const mode = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === 'production' ? 'disabled' : 'log')
  if (mode === 'resend') return new ResendEmailProvider()
  if (mode === 'log' && process.env.NODE_ENV !== 'production') return new LogEmailProvider()
  throw new Error('E-posta gönderimi devre dışı veya yapılandırılmamış.')
}

export async function sendTransactionalEmail(to: string, template: EmailTemplate, idempotencyKey: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || to.length > 254) throw new Error('Geçersiz alıcı adresi.')
  if (!/^[A-Za-z0-9._:-]{8,256}$/.test(idempotencyKey)) throw new Error('Geçersiz idempotency anahtarı.')
  return provider().send(renderEmail(to, template), idempotencyKey)
}
