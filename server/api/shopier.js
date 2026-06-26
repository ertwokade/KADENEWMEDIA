import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb } from './_lib/mongodb.js'
import { cors } from './_lib/cors.js'
import { buildPackageObject } from './_lib/packages.js'

// Shopier webhook doğrulama
// İmza = base64(hmac-sha256(random_nr + status + buyer_email + product_price, API_SECRET))
// API_SECRET = Shopier paneli → Mağaza Ayarları → API → "API Şifresi" (kısa değer)
// Ayarlanmamışsa veya JWT formatındaysa imza atlanır
function isJwt(s) { return typeof s === 'string' && s.startsWith('eyJ') }

function verifyShopierSignature(body, apiSecret) {
  if (!apiSecret || isJwt(apiSecret)) {
    console.log('ℹ️  Shopier: SHOPIER_API_SECRET ayarlı değil veya JWT — imza doğrulama atlandı')
    return true
  }
  const { random_nr, status, buyer_email, product_price, signature } = body
  if (!signature) return false
  const data = String(random_nr || '') + String(status || '') + String(buyer_email || '') + String(product_price || '')
  const expected = crypto.createHmac('sha256', apiSecret).update(data).digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch { return false }
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

  const body = parseBody(req)
  const apiSecret = process.env.SHOPIER_API_SECRET

  // İmza kontrolü (sadece production'da zorunlu)
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    if (!verifyShopierSignature(body, apiSecret)) {
      console.warn('Shopier webhook: geçersiz imza', { body })
      return res.status(403).json({ error: 'Geçersiz imza' })
    }
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

  try {
    const db = await getDb()

    // Paket nesnesini oluştur
    const pkg = buildPackageObject(product_reference, {
      source: 'shopier',
      shopierOrderId: platform_order_id || null,
      price: product_price ? parseFloat(product_price) : null,
    })

    if (!pkg) {
      // Bilinmeyen ürün — yine de kaydı tut (admin görebilsin)
      console.warn(`Shopier webhook: bilinmeyen product_reference: ${product_reference}`)
      await db.collection('shopier_unknown_orders').insertOne({
        buyer_email: email,
        buyer_name,
        product_reference,
        product_price,
        platform_order_id,
        receivedAt: new Date(),
        rawBody: body,
      })
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
      console.log(`✅ Shopier: yeni müşteri oluşturuldu ${email}`)
    } else {
      // Mevcut müşteriye paket ekle
      await db.collection('customers').updateOne(
        { email },
        { $push: { packages: pkg }, $set: { updatedAt: new Date() } }
      )
      console.log(`✅ Shopier: paket eklendi ${email} → ${pkg.name}`)
    }

    // Shopier sipariş kaydı tut
    await db.collection('shopier_orders').insertOne({
      customerId: customer._id.toString(),
      email,
      packageId: pkg.id,
      packageName: pkg.name,
      productReference: product_reference,
      price: pkg.price,
      shopierOrderId: platform_order_id,
      receivedAt: new Date(),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Shopier webhook error:', err.message)
    return res.status(500).json({ error: 'Sunucu hatası' })
  }
}
