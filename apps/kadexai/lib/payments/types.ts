export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export type PlanTier = 'baslangic' | 'pro' | 'sinirsiz'
export type BillingPeriod = 'weekly' | 'monthly' | 'yearly'

export interface PaymentProduct {
  id: string
  name: string
  amountMinor: number
  currency: 'TRY'
  /** Paket meta verisi (dinamik/kişiye özel teklifler için opsiyonel). */
  tier?: PlanTier
  period?: BillingPeriod
  /** true: KadexAI kendi API anahtarlarıyla sunar. false: kullanıcı kendi anahtarını girer. */
  apiIncluded?: boolean
  /** Erişilecek özellik anahtarları (featureAccess ile eşleşir). */
  features?: readonly string[]
}

export interface PaymentCheckout {
  orderId: string
  product: PaymentProduct
  callbackUrl: string
  customerEmail?: string
}

export interface VerifiedPaymentEvent {
  eventId: string
  orderId: string
  status: PaymentStatus
}

export interface PaymentProvider {
  readonly name: 'mock' | 'shopier'
  createCheckout(input: PaymentCheckout): Promise<{ checkoutUrl: string; externalId: string }>
  verifyWebhook(rawBody: string, signature: string): VerifiedPaymentEvent
}

export interface PaymentEventStore {
  has(eventId: string): Promise<boolean>
  record(event: VerifiedPaymentEvent): Promise<void>
  updateOrder(event: VerifiedPaymentEvent): Promise<void>
}
