import 'server-only'

import { MockPaymentProvider } from './mockProvider'
import { ShopierPaymentProvider } from './shopierProvider'
import type { PaymentProvider } from './types'

export function getPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_PROVIDER || 'disabled'
  if (mode === 'mock') {
    if (process.env.NODE_ENV === 'production' && process.env.PAYMENT_SANDBOX_ENABLED !== '1') {
      throw new Error('Mock ödeme sağlayıcısı production ortamında devre dışıdır.')
    }
    return new MockPaymentProvider(
      process.env.PAYMENT_WEBHOOK_SECRET || '',
      process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000/kadeai'
    )
  }
  if (mode === 'shopier') return new ShopierPaymentProvider()
  throw new Error('Ödeme sağlayıcısı yapılandırılmamış.')
}
