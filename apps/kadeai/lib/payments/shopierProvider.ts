import type { PaymentCheckout, PaymentProvider, VerifiedPaymentEvent } from './types'
import { verifyShopierCallback } from './shopier'

/**
 * Shopier ödeme sağlayıcısı.
 *
 * createCheckout: kullanıcıyı, imzalı Shopier formunu otomatik POST eden
 * dahili yönlendirme sayfasına gönderir (`/api/payments/shopier/redirect`).
 * Form, sipariş bilgisinden sunucu tarafında üretilir (bkz. redirect route).
 *
 * verifyWebhook: Shopier callback'ini HMAC imzasıyla doğrular.
 *
 * Gerekli env: SHOPIER_API_KEY, SHOPIER_API_SECRET
 */
export class ShopierPaymentProvider implements PaymentProvider {
  readonly name = 'shopier' as const

  private secret(): string {
    const secret = process.env.SHOPIER_API_SECRET?.trim()
    if (!secret) throw new Error('SHOPIER_API_SECRET tanımlı değil.')
    return secret
  }

  async createCheckout(input: PaymentCheckout): Promise<{ checkoutUrl: string; externalId: string }> {
    const apiKey = process.env.SHOPIER_API_KEY?.trim()
    if (!apiKey || !process.env.SHOPIER_API_SECRET?.trim()) {
      throw new Error('Shopier kimlik bilgileri (SHOPIER_API_KEY/SECRET) eksik.')
    }
    // Gerçek imzalı form, sipariş id'sinden yönlendirme sayfasında üretilir.
    // Böylece imza/random_nr sunucuda kalır, istemciye sızmaz.
    const checkoutUrl = `/api/payments/shopier/redirect?order=${encodeURIComponent(input.orderId)}`
    return { checkoutUrl, externalId: input.orderId }
  }

  verifyWebhook(rawBody: string, _signature: string): VerifiedPaymentEvent {
    void _signature // Shopier imzası gövde içindedir
    const callback = verifyShopierCallback(rawBody, this.secret())
    return {
      // Idempotency: payment_id varsa onu, yoksa order+status kullan
      eventId: callback.paymentId
        ? `shopier_${callback.paymentId}`
        : `shopier_${callback.orderId}_${callback.status}`,
      orderId: callback.orderId,
      status: callback.status,
    }
  }
}
