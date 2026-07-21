import 'server-only'

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentProduct } from './catalog'
import { getPaymentProvider } from './server'

export interface CreateDynamicOfferInput {
  productId: string
  customAmountMinor: number
  customerEmail: string
  currency?: 'TRY'
  validityMinutes?: number
}

export interface DynamicOfferResult {
  orderId: string
  checkoutUrl: string
  expiresAt: string
  amountMinor: number
  customerEmail: string
}

/**
 * Kisiye ozel / anlasmaya varilmis tekliflerde admin tarafindan tetiklenir.
 *
 * Mevcut katalogdaki bir urunun (tier/period/apiIncluded) yetki tanimini
 * korur; yalnizca odenecek tutari (amount_minor) ozel olarak gunceller.
 * Boylece grantEntitlementForOrder() degismeden calisir - yetki, urunun
 * kendi tier/period/features tanimindan gelir, odenen tutardan degil.
 *
 * Not: Musterinin zaten bir KadeAI hesabi olmasi gerekir (odeme sirasinda
 * giris yapmis olmali). Hesabi olmayan yeni bir aday icin bu fonksiyon
 * acik bir hata doner; guest/magic-link checkout ayri bir gelistirme.
 */
export async function createDynamicOffer(input: CreateDynamicOfferInput): Promise<DynamicOfferResult> {
  const product = getPaymentProduct(input.productId)
  if (!product) {
    throw new Error('Gecersiz paket. Teklif gecerli bir katalog urunune (or. pro-yearly-api) baglanmali.')
  }

  const amountMinor = Math.round(Number(input.customAmountMinor))
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Gecersiz tutar.')
  }

  const email = String(input.customerEmail || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Gecersiz e-posta.')
  }

  const admin = createAdminClient()

  const { data: userList, error: userLookupError } = await admin.auth.admin.listUsers()
  if (userLookupError) throw new Error('Kullanici sorgulanamadi.')
  const matchedUser = userList.users.find((u) => (u.email || '').toLowerCase() === email)
  if (!matchedUser) {
    throw new Error('Bu e-posta ile kayitli bir KadeAI hesabi bulunamadi. Musteri once hesap olusturmali, sonra tekrar deneyin.')
  }

  const validityMinutes = Math.min(Math.max(Number(input.validityMinutes) || 1440, 5), 10080)
  const expiresAt = new Date(Date.now() + validityMinutes * 60_000).toISOString()
  const orderId = randomUUID()
  const provider = getPaymentProvider()

  const { error: insertError } = await admin.from('payment_orders').insert({
    id: orderId,
    user_id: matchedUser.id,
    provider: provider.name,
    product_id: product.id,
    amount_minor: amountMinor,
    currency: input.currency || product.currency,
    status: 'pending',
    idempotency_key: `custom-offer-${orderId}`,
    analytics_consent: false,
    expires_at: expiresAt,
  })
  if (insertError) throw new Error(`Teklif kaydedilemedi: ${insertError.message}`)

  const callbackUrl = new URL(
    '/kadeai/api/payments/webhook',
    process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com',
  ).toString()

  let checkout
  try {
    checkout = await provider.createCheckout({
      orderId,
      product: { ...product, amountMinor },
      callbackUrl,
      customerEmail: email,
    })
  } catch (checkoutError) {
    await admin.from('payment_orders').delete().eq('id', orderId)
    throw checkoutError
  }

  const { error: updateError } = await admin
    .from('payment_orders')
    .update({ external_id: checkout.externalId, checkout_url: checkout.checkoutUrl })
    .eq('id', orderId)
  if (updateError) throw new Error('Odeme linki kaydedilemedi.')

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com/kadeai').replace(/\/$/, '')
  const absoluteCheckoutUrl = checkout.checkoutUrl.startsWith('http')
    ? checkout.checkoutUrl
    : `${appUrl}${checkout.checkoutUrl}`

  return {
    orderId,
    checkoutUrl: absoluteCheckoutUrl,
    expiresAt,
    amountMinor,
    customerEmail: email,
  }
}
