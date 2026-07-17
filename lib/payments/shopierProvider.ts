import type { PaymentCheckout, PaymentProvider, VerifiedPaymentEvent } from './types'

/**
 * Provider boundary for Shopier. The merchant-specific request/callback contract
 * must be reviewed against the account's current Shopier API document before
 * enabling it. It deliberately refuses real transactions in this repository.
 */
export class ShopierPaymentProvider implements PaymentProvider {
  readonly name = 'shopier' as const

  async createCheckout(input: PaymentCheckout): Promise<{ checkoutUrl: string; externalId: string }> {
    void input
    throw new Error('Shopier gerçek ödeme adaptörü merchant sözleşmesi doğrulanana kadar devre dışıdır.')
  }

  verifyWebhook(rawBody: string, signature: string): VerifiedPaymentEvent {
    void rawBody
    void signature
    throw new Error('Shopier callback doğrulaması merchant sözleşmesi doğrulanana kadar devre dışıdır.')
  }
}
