import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getSupabase, isUniqueViolation } from './_lib/supabase.js'
import { cors } from './_lib/cors.js'
import { buildPackageObject } from './_lib/packages.js'
import { requireAdmin } from './_lib/auth.js'
import { validateShopierPayment } from './_lib/shopierCatalog.js'
import { reconcileShopierOrders } from './_lib/shopierReconciliation.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Shopier webhook doğrulama
// İmza = base64(hmac-sha256(random_nr + status + buyer_email + product_price, API_SECRET))
// API_SECRET = Shopier paneli → Mağaza Ayarları → API → "API Şifresi" (kısa değer)
// Production'da secret eksik/geçersizse webhook işlenmez.
function isJwt(s) { return typeof s === 'string' && s.startsWith('eyJ') }

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production'
}

export function verifyShopierSignature(body, apiSecret) {
  if (!apiSecret || isJwt(apiSecret)) {
    return false
  }
  const { random_nr, status, buyer_email, product_price, signature } = body
  if (!random_nr || !status || !buyer_email || !product_price || !signature) return false
  const data = String(random_nr || '') + String(status || '') + String(buyer_email || '') + String(product_price || '')
  const expected = crypto.createHmac('sha256', apiSecret).update(data).digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch { return false }
}

// Siparişi paket yetkisi vermeden önce atomik olarak rezerve et. Unique index,
// eşzamanlı webhook replay'lerinde yalnızca tek isteğin ilerlemesini sağlar.
export async function reserveShopierOrder(supabase, order) {
  const { error } = await supabase.from('kade_shopier_orders').insert(order)
  if (!error) return true
  if (isUniqueViolation(error)) return false
  throw error
}

function parseBody(req) {
  let b = req.body
  if (typeof b === 'string') {
    // URL-encoded form data
    try {
      const params = new URLSearchParams(b)
      b = Object.fromEntries(params.entries())
    } catch {
      try { b = JSON.parse(b) } catch { b = {} }
    }
  }
  return b || {}
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  // GET isteği → Shopier'in URL doğrulama kontrolü
  if (req.method === 'GET') {
    return res.status(200).send('OK')
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getSupabase()

  if (req.query?.action === 'reconcile') {
    if (!(await requireAdmin(req, res))) return
    const summary = await reconcileShopierOrders(supabase, { limit: req.body?.limit })
    return res.status(200).json({ success: true, summary })
  }

  const body = parseBody(req)
  const apiSecret = process.env.SHOPIER_API_SECRET

  // İmza kontrolü production'da zorunlu; development'ta secret varsa yine doğrulanır.
  const hasUsableSecret = Boolean(apiSecret && !isJwt(apiSecret))
  if (isProductionRuntime() || hasUsableSecret) {
    if (!hasUsableSecret || !verifyShopierSignature(body, apiSecret)) {
      console.warn('Shopier webhook: geçersiz veya eksik imza')
      return res.status(403).json({ error: 'Geçersiz imza' })
    }
  } else {
    console.warn('Shopier webhook: development ortamında imza doğrulama atlandı')
  }

  const { buyer_email, buyer_name, product_reference, product_price, status: paymentStatus, platform_order_id } = body

  // Sadece başarılı ödemeleri işle (status=1)
  if (String(paymentStatus) !== '1') {
    console.log('Shopier webhook: ödeme beklemede veya başarısız, status=', paymentStatus)
    return res.status(200).json({ success: true, skipped: true })
  }

  if (!buyer_email) {
    return res.status(400).json({ error: 'buyer_email eksik' })
  }

  const email = buyer_email.toLowerCase().trim()
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'buyer_email geçersiz' })
  }

  const orderId = platform_order_id ? String(platform_order_id).trim().slice(0, 120) : ''
  if (!orderId || !/^[A-Za-z0-9._:-]{1,120}$/.test(orderId)) {
    return res.status(400).json({ error: 'platform_order_id eksik veya geçersiz' })
  }

  let packageGranted = false
  const paymentValidation = validateShopierPayment(body)

  try {
    const reserved = await reserveShopierOrder(supabase, {
      shopier_order_id: orderId,
      state: 'processing',
      email,
      product_reference: String(product_reference || '').slice(0, 120),
    })
    if (!reserved) return res.status(200).json({ success: true, duplicate: true })

    if (!paymentValidation.ok) {
      const { error } = await supabase
        .from('kade_shopier_orders')
        .update({ state: 'rejected', reason: paymentValidation.reason, updated_at: new Date().toISOString() })
        .eq('shopier_order_id', orderId)
        .eq('state', 'processing')
      if (error) throw error
      return res.status(200).json({ success: true, rejected: true, reason: paymentValidation.reason })
    }

    // Paket nesnesini oluştur
    const pkg = buildPackageObject(paymentValidation.product.internalPackageId, {
      source: 'shopier',
      shopierOrderId: orderId,
      price: paymentValidation.product.unitAmountMinor / 100,
      currency: paymentValidation.product.currency,
    })

    if (!pkg) {
      // Bilinmeyen ürün — yine de kaydı tut (admin görebilsin)
      console.warn(`Shopier webhook: bilinmeyen product_reference: ${product_reference}`)
      const { error: unknownError } = await supabase.from('kade_shopier_unknown_orders').insert({
        buyer_email: email,
        buyer_name: String(buyer_name || '').slice(0, 200),
        product_reference: String(product_reference || '').slice(0, 120),
        product_price: String(product_price || '').slice(0, 40),
        platform_order_id: orderId,
      })
      if (unknownError) throw unknownError
      const { error: updateError } = await supabase
        .from('kade_shopier_orders')
        .update({ state: 'ignored', reason: 'unknown_reference', updated_at: new Date().toISOString() })
        .eq('shopier_order_id', orderId)
      if (updateError) throw updateError
      return res.status(200).json({ success: true, note: 'unknown_reference' })
    }

    // Müşteri bul ya da oluştur
    let { data: customer, error: findError } = await supabase
      .from('kade_customers')
      .select('id, name, email')
      .eq('email', email)
      .maybeSingle()
    if (findError) throw findError

    if (!customer) {
      // Yeni müşteri oluştur (şifresiz — müşteri sonradan şifresi sıfırlayabilir)
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)
      const { data: created, error: createError } = await supabase.from('kade_customers').insert({
        name: buyer_name || email,
        email,
        phone: null,
        password_hash: tempPassword,
        status: 'active',
        source: 'shopier',
        last_login_at: null,
      }).select('id, name, email').single()
      if (createError) throw createError
      customer = created
    }

    const { error: pkgInsertError } = await supabase.from('kade_customer_packages').insert({
      customer_id: customer.id,
      reference: pkg.reference,
      name: pkg.name,
      consulting_area: pkg.consultingArea,
      features: pkg.features,
      access: pkg.access,
      status: pkg.status,
      source: pkg.source,
      shopier_order_id: pkg.shopierOrderId,
      price: pkg.price,
      currency: pkg.currency || paymentValidation.product.currency || null,
      purchased_at: pkg.purchasedAt instanceof Date ? pkg.purchasedAt.toISOString() : pkg.purchasedAt,
      expires_at: pkg.expiresAt instanceof Date ? pkg.expiresAt.toISOString() : pkg.expiresAt,
    })
    if (pkgInsertError) throw pkgInsertError
    packageGranted = true

    // Rezerve edilen siparişi tamamla; tekrar insert ederek yarış penceresi açma.
    const { error: completeError } = await supabase
      .from('kade_shopier_orders')
      .update({
        state: 'completed',
        customer_id: customer.id,
        package_id: pkg.id,
        package_name: pkg.name,
        product_reference: String(product_reference || ''),
        price: pkg.price,
        currency: paymentValidation.product.currency,
        completed_at: new Date().toISOString(),
      })
      .eq('shopier_order_id', orderId)
      .eq('state', 'processing')
    if (completeError) throw completeError

    return res.status(200).json({ success: true })
  } catch (err) {
    if (isUniqueViolation(err)) {
      return res.status(200).json({ success: true, duplicate: true })
    }
    try {
      if (orderId) {
        if (packageGranted) {
          await supabase
            .from('kade_shopier_orders')
            .update({ state: 'completed_with_record_error', updated_at: new Date().toISOString() })
            .eq('shopier_order_id', orderId)
        } else {
          await supabase
            .from('kade_shopier_orders')
            .delete()
            .eq('shopier_order_id', orderId)
            .eq('state', 'processing')
        }
      }
    } catch { /* keep the original failure response */ }
    console.error('Shopier webhook error:', err.message)
    return res.status(500).json({ error: 'Sunucu hatası' })
  }
}
