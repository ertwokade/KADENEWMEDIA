import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb } from './_lib/mongodb.js'
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

export async function reserveShopierOrder(collection, order) {
  try {
    await collection.insertOne(order)
    return true
  } catch (error) {
    if (error?.code === 11000) return false
    throw error
  }
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

  if (req.query?.action === 'reconcile') {
    if (!(await requireAdmin(req, res))) return
    const db = await getDb()
    const summary = await reconcileShopierOrders(db, { limit: req.body?.limit })
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
    const db = await getDb()
    await db.collection('shopier_orders').createIndex({ shopierOrderId: 1 }, { unique: true, sparse: true }).catch(() => {})

    // Siparişi paket yetkisi vermeden önce atomik olarak rezerve et. Unique index,
    // eşzamanlı webhook replay'lerinde yalnızca tek isteğin ilerlemesini sağlar.
    const reserved = await reserveShopierOrder(db.collection('shopier_orders'), {
      shopierOrderId: orderId,
      state: 'processing',
      email,
      productReference: String(product_reference || '').slice(0, 120),
      receivedAt: new Date(),
    })
    if (!reserved) return res.status(200).json({ success: true, duplicate: true })

    if (!paymentValidation.ok) {
      await db.collection('shopier_orders').updateOne(
        { shopierOrderId: orderId, state: 'processing' },
        { $set: { state: 'rejected', reason: paymentValidation.reason, updatedAt: new Date() } }
      )
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
      await db.collection('shopier_unknown_orders').insertOne({
        buyer_email: email,
        buyer_name: String(buyer_name || '').slice(0, 200),
        product_reference: String(product_reference || '').slice(0, 120),
        product_price: String(product_price || '').slice(0, 40),
        platform_order_id: orderId,
        receivedAt: new Date(),
      })
      await db.collection('shopier_orders').updateOne(
        { shopierOrderId: orderId },
        { $set: { state: 'ignored', reason: 'unknown_reference', updatedAt: new Date() } }
      )
      return res.status(200).json({ success: true, note: 'unknown_reference' })
    }

    // Müşteri bul ya da oluştur
    let customer = await db.collection('customers').findOne({ email })

    if (!customer) {
      // Yeni müşteri oluştur (şifresiz — müşteri sonradan şifresi sıfırlayabilir)
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10)
      const now = new Date()
      const result = await db.collection('customers').insertOne({
        name: buyer_name || email,
        email,
        phone: null,
        password: tempPassword,
        packages: [pkg],
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
        source: 'shopier',
      })
      customer = { _id: result.insertedId, name: buyer_name || email, email }
    } else {
      // Mevcut müşteriye paket ekle
      await db.collection('customers').updateOne(
        { email },
        { $push: { packages: pkg }, $set: { updatedAt: new Date() } }
      )
    }
    packageGranted = true

    // Rezerve edilen siparişi tamamla; tekrar insert ederek yarış penceresi açma.
    await db.collection('shopier_orders').updateOne(
      { shopierOrderId: orderId, state: 'processing' },
      { $set: {
        state: 'completed',
        customerId: customer._id.toString(),
        packageId: pkg.id,
        packageName: pkg.name,
        productReference: product_reference,
        price: pkg.price,
        currency: paymentValidation.product.currency,
        completedAt: new Date(),
      } }
    )

    return res.status(200).json({ success: true })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(200).json({ success: true, duplicate: true })
    }
    try {
      const db = await getDb()
      if (orderId) {
        if (packageGranted) {
          await db.collection('shopier_orders').updateOne(
            { shopierOrderId: orderId },
            { $set: { state: 'completed_with_record_error', updatedAt: new Date() } }
          )
        } else {
          await db.collection('shopier_orders').deleteOne({ shopierOrderId: orderId, state: 'processing' })
        }
      }
    } catch { /* keep the original failure response */ }
    console.error('Shopier webhook error:', err.message)
    return res.status(500).json({ error: 'Sunucu hatası' })
  }
}
