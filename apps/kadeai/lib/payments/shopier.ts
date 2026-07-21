import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

/**
 * Shopier klasik ödeme API'si yardımcıları.
 *
 * Akış: sunucu, imzalı bir FORM üretir; tarayıcı bu formu Shopier'e POST eder.
 * Katalogda kayıtlı ürün gerekmez — `total_order_value` her sipariş için
 * dinamik verilir. Bu yüzden "15 dk geçerli kişiye özel fiyat" mümkündür.
 *
 * İmza (Shopier dokümanı):
 *   signature = base64( HMAC_SHA256( random_nr + platform_order_id +
 *                                    total_order_value + currency, API_SECRET ) )
 */

const SHOPIER_ACTION_URL = 'https://www.shopier.com/ShowProductForApiV2'

export interface ShopierCredentials {
  apiKey: string
  apiSecret: string
}

export interface ShopierBuyer {
  name: string
  surname?: string
  email: string
  phone?: string
}

export interface ShopierFormInput {
  orderId: string
  /** Toplam tutar, TL cinsinden ondalıklı string (ör. "999.00"). */
  totalOrderValue: string
  productName: string
  buyer: ShopierBuyer
  /** 0 = TL. */
  currency?: 0
}

export interface ShopierForm {
  actionUrl: string
  fields: Record<string, string>
}

function shopierSignature(
  randomNr: string,
  orderId: string,
  totalOrderValue: string,
  currency: number,
  apiSecret: string,
): string {
  const data = `${randomNr}${orderId}${totalOrderValue}${currency}`
  return createHmac('sha256', apiSecret).update(data, 'utf8').digest('base64')
}

/** TL major → Shopier'in beklediği ondalıklı string (ör. 99900 kuruş → "999.00"). */
export function minorToDecimalString(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2)
}

/** İmzalı Shopier formunu üretir (saf fonksiyon — test edilebilir). */
export function buildShopierForm(input: ShopierFormInput, creds: ShopierCredentials): ShopierForm {
  const currency = input.currency ?? 0
  const randomNr = String(randomInt(100000, 1_000_000))
  const signature = shopierSignature(
    randomNr,
    input.orderId,
    input.totalOrderValue,
    currency,
    creds.apiSecret,
  )

  const fields: Record<string, string> = {
    API_key: creds.apiKey,
    website_index: '1',
    platform_order_id: input.orderId,
    product_name: input.productName,
    product_type: '1', // 1 = downloadable/virtual
    buyer_name: input.buyer.name,
    buyer_surname: input.buyer.surname ?? '-',
    buyer_email: input.buyer.email,
    buyer_phone: input.buyer.phone ?? '',
    buyer_account_age: '0',
    buyer_id_nr: input.orderId.replace(/[^0-9]/g, '').slice(0, 11) || '0',
    billing_address: '-',
    billing_city: '-',
    billing_country: 'Türkiye',
    billing_postcode: '00000',
    shipping_address: '-',
    shipping_city: '-',
    shipping_country: 'Türkiye',
    shipping_postcode: '00000',
    total_order_value: input.totalOrderValue,
    currency: String(currency),
    platform: '0',
    is_in_frame: '0',
    current_language: '0', // 0 = TR
    modul_version: '1.0.4',
    random_nr: randomNr,
    signature,
  }

  return { actionUrl: SHOPIER_ACTION_URL, fields }
}

// —— Callback doğrulama ——————————————————————————————————————————————————

export interface ShopierCallback {
  orderId: string
  status: 'paid' | 'failed'
  paymentId?: string
}

/**
 * Shopier callback gövdesini (form-encoded) doğrular ve normalize eder.
 * İmza doğrulanmazsa hata fırlatır.
 */
export function verifyShopierCallback(rawBody: string, apiSecret: string): ShopierCallback {
  const params = new URLSearchParams(rawBody)
  const randomNr = params.get('random_nr') ?? ''
  const orderId = params.get('platform_order_id') ?? ''
  const status = params.get('status') ?? ''
  const installment = params.get('installment') ?? '0'
  const received = params.get('signature') ?? ''

  if (!orderId || !received) {
    throw new Error('Shopier callback: eksik alan.')
  }

  // Shopier callback imzası: base64( HMAC_SHA256( random_nr + platform_order_id, secret ) )
  const expected = createHmac('sha256', apiSecret)
    .update(`${randomNr}${orderId}`, 'utf8')
    .digest('base64')

  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('Shopier callback: imza doğrulanamadı.')
  }

  void installment
  return {
    orderId,
    status: status === 'success' ? 'paid' : 'failed',
    paymentId: params.get('payment_id') ?? undefined,
  }
}
