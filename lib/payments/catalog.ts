import type { PaymentProduct } from './types'

const PRODUCTS: Readonly<Record<string, PaymentProduct>> = Object.freeze({
  'sandbox-credit': Object.freeze({ id: 'sandbox-credit', name: 'KADE AI Sandbox Kredisi', amountMinor: 10000, currency: 'TRY' }),
})

export function getPaymentProduct(productId: string) {
  return PRODUCTS[productId]
}
