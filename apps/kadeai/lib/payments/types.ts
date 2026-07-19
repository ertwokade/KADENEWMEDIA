export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled'

export interface PaymentProduct {
  id: string
  name: string
  amountMinor: number
  currency: 'TRY'
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
