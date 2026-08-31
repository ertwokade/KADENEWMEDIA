import type { PaymentCheckout, PaymentProvider, VerifiedPaymentEvent } from './types'
import { verifyPaymentSignature } from './signature'

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock' as const
  constructor(private readonly secret: string, private readonly appUrl = 'http://127.0.0.1:3000/kadexai') {}

  async createCheckout(input: PaymentCheckout) {
    const target = new URL(`${this.appUrl.replace(/\/$/, '')}/dashboard/settings`)
    target.searchParams.set('mock_payment', input.orderId)
    return { checkoutUrl: target.toString(), externalId: `mock-${input.orderId}` }
  }

  verifyWebhook(rawBody: string, signature: string): VerifiedPaymentEvent {
    if (!this.secret || !verifyPaymentSignature(rawBody, signature, this.secret)) throw new Error('Geçersiz ödeme imzası.')
    const value = JSON.parse(rawBody) as Partial<VerifiedPaymentEvent>
    if (!value.eventId || !value.orderId || !['paid', 'failed', 'cancelled'].includes(value.status || '')) {
      throw new Error('Geçersiz ödeme olayı.')
    }
    return value as VerifiedPaymentEvent
  }
}
