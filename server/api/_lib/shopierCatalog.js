import { getPackageByReference } from './packages.js'

const DEFAULT_CURRENCY = 'TRY'

export function parseMoneyToMinor(value) {
  const normalized = String(value ?? '').trim()
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(minor) ? minor : null
}

function enabledReferences(env) {
  return new Set(
    String(env.SHOPIER_ENABLED_PRODUCTS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  )
}

export function getShopierProduct(reference, env = process.env) {
  const normalizedReference = String(reference || '').trim()
  const definition = getPackageByReference(normalizedReference)
  if (!definition || !Number.isFinite(definition.price) || definition.price <= 0) return null

  const unitAmountMinor = Math.round(definition.price * 100)
  return Object.freeze({
    internalPackageId: normalizedReference,
    providerProductId: normalizedReference,
    currency: DEFAULT_CURRENCY,
    unitAmountMinor,
    entitlement: Object.freeze({ ...(definition.access || {}) }),
    quota: null,
    durationDays: definition.durationDays ?? null,
    enabled: enabledReferences(env).has(normalizedReference),
  })
}

export function validateShopierPayment(body, env = process.env) {
  const product = getShopierProduct(body?.product_reference, env)
  if (!product) return { ok: false, reason: 'unknown_product', product: null }
  if (!product.enabled) return { ok: false, reason: 'product_disabled', product }

  const amountMinor = parseMoneyToMinor(body?.product_price)
  if (amountMinor === null || amountMinor !== product.unitAmountMinor) {
    return { ok: false, reason: 'amount_mismatch', product }
  }

  const currency = String(body?.currency || body?.product_currency || env.SHOPIER_WEBHOOK_CURRENCY || '')
    .trim()
    .toUpperCase()
  if (!currency || currency !== product.currency) {
    return { ok: false, reason: 'currency_mismatch', product }
  }

  return { ok: true, product, amountMinor, currency }
}
