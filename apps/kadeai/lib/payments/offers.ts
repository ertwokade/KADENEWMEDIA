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
/** Tek sayfada dönülen kullanıcı sayısı; Supabase üst sınırı 1000. */
const USER_PAGE_SIZE = 1000
/** Tarama tavanı — sonsuz döngüye ve aşırı sorguya karşı. */
const MAX_USER_PAGES = 20

/**
 * E-postaya göre kullanıcı bulur.
 *
 * `listUsers()` parametresiz çağrıldığında YALNIZCA ilk sayfayı (varsayılan 50
 * kayıt) döner. Kullanıcı sayısı bunu aştığında 51. kullanıcı için teklif
 * oluşturmak "hesap bulunamadi" hatasına düşüyordu; sayfalar sırayla taranıyor.
 */
async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USER_PAGE_SIZE })
    if (error) throw new Error('Kullanici sorgulanamadi.')
    const users = data?.users ?? []
    const match = users.find((user) => (user.email || '').toLowerCase() === email)
    if (match) return match
    if (users.length < USER_PAGE_SIZE) return null
  }
  return null
}

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

  const matchedUser = await findUserByEmail(admin, email)
  if (!matchedUser) {
    throw new Error('Bu e-posta ile kayitli bir KadeAI hesabi bulunamadi. Musteri once hesap olusturmali, sonra tekrar deneyin.')
  }

  // Fiyat kilidi güvenlik sınırıdır: custom checkout her zaman en fazla
  // 15 dakika yaşar. Admin istemcisi daha uzun bir değer gönderse bile
  // sunucu bu süreyi genişletmez.
  const requestedValidity = Number(input.validityMinutes)
  const validityMinutes = Math.min(
    Math.max(Number.isFinite(requestedValidity) && requestedValidity > 0 ? requestedValidity : 15, 5),
    15,
  )
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
  if (insertError) throw new Error('Teklif kaydedilemedi.')

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
