import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { getDb, isValidObjectId } from './_lib/mongodb.js'
import { createToken, verifyToken, createCsrfToken, getCookie } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'

const CUSTOMER_COOKIE = 'kade_customer_session'
const SESSION_MAX_AGE = 8 * 60 * 60

function shouldUseSecureCookie(req) {
  const proto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim()
  if (proto) return proto === 'https'
  const host = String(req.headers?.host || '').split(':')[0].toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
}

function appendSetCookie(res, cookie) {
  const existing = res.getHeader?.('Set-Cookie')
  if (!existing) res.setHeader('Set-Cookie', cookie)
  else if (Array.isArray(existing)) res.setHeader('Set-Cookie', [...existing, cookie])
  else res.setHeader('Set-Cookie', [existing, cookie])
}

function setCustomerCookie(req, res, token) {
  const parts = [
    `${CUSTOMER_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE}`,
    'SameSite=Strict',
    'HttpOnly',
  ]
  if (shouldUseSecureCookie(req)) parts.push('Secure')
  appendSetCookie(res, parts.join('; '))
}

function clearCustomerCookie(req, res) {
  const parts = [`${CUSTOMER_COOKIE}=`, 'Path=/', 'Max-Age=0', 'SameSite=Strict', 'HttpOnly']
  if (shouldUseSecureCookie(req)) parts.push('Secure')
  appendSetCookie(res, parts.join('; '))
}

export function getCustomerSession(req) {
  const token = getCookie(req, CUSTOMER_COOKIE)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'customer') return null
  return payload
}

export async function getActiveCustomerSession(req) {
  const session = getCustomerSession(req)
  if (!session || !isValidObjectId(session.id)) return null

  const db = await getDb()
  const customer = await db.collection('customers').findOne(
    { _id: new ObjectId(session.id), status: { $ne: 'inactive' } },
    { projection: { password: 0 } }
  )
  if (!customer) return null

  return {
    session: {
      ...session,
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
    },
    customer,
  }
}

function parseBody(req) {
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  return body || {}
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const action = req.query?.action || 'login'

  if (req.method === 'GET' && action === 'session') {
    const active = await getActiveCustomerSession(req)
    if (!active) return res.status(200).json({ authenticated: false })
    return res.status(200).json({ authenticated: true, customer: { id: active.session.id, name: active.session.name, email: active.session.email } })
  }

  if (req.method === 'POST' && action === 'logout') {
    clearCustomerCookie(req, res)
    return res.status(200).json({ success: true })
  }

  if (req.method === 'POST' && action === 'register') {
    return handleRegister(req, res)
  }

  if (req.method === 'POST' && (!action || action === 'login')) {
    return handleLogin(req, res)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// ========== KAYIT ==========
async function handleRegister(req, res) {
  const rl = await rateLimitCheck(req, { namespace: 'customer-register', windowMs: 60 * 60 * 1000, maxRequests: 10 })
  if (!rl.allowed) {
    return res.status(429).json({ error: `Çok fazla kayıt denemesi. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.` })
  }

  const { name, email, password, phone, consent } = parseBody(req)

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Ad, e-posta ve şifre gerekli' })
  }
  if (consent !== true) return res.status(400).json({ error: 'Aydınlatma metni onayı gereklidir' })

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Ad en az 2, en fazla 100 karakter olmalı' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin' })
  }

  if (typeof password !== 'string' || password.length < 12) {
    return res.status(400).json({ error: 'Şifre en az 12 karakter olmalı' })
  }

  try {
    const db = await getDb()
    await db.collection('customers').createIndex({ email: 1 }, { unique: true }).catch(() => {})
    const existing = await db.collection('customers').findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const now = new Date()

    const result = await db.collection('customers').insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      password: hashedPassword,
      packages: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      consentAt: now,
    })

    const token = createToken({
      id: result.insertedId.toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'customer',
    })

    setCustomerCookie(req, res, token)

    return res.status(201).json({
      customer: { id: result.insertedId.toString(), name: name.trim(), email: email.toLowerCase().trim() },
    })
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' })
    }
    console.error('Customer register error:', err.message)
    return res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' })
  }
}

// ========== GİRİŞ ==========
async function handleLogin(req, res) {
  const rl = await rateLimitCheck(req, { namespace: 'customer-login', windowMs: 15 * 60 * 1000, maxRequests: 10 })
  if (!rl.allowed) {
    return res.status(429).json({ error: `Çok fazla giriş denemesi. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.` })
  }

  const { email, password } = parseBody(req)

  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' })
  }

  try {
    const db = await getDb()
    const customer = await db.collection('customers').findOne({ email: email.toLowerCase().trim() })

    if (!customer) {
      return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı' })
    }

    if (customer.status === 'inactive') {
      return res.status(403).json({ error: 'Hesabınız askıya alınmış. Lütfen destek ile iletişime geçin.' })
    }

    const valid = await bcrypt.compare(password, customer.password)
    if (!valid) {
      return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı' })
    }

    await db.collection('customers').updateOne(
      { _id: customer._id },
      { $set: { lastLoginAt: new Date() } }
    )

    const token = createToken({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      role: 'customer',
    })

    setCustomerCookie(req, res, token)

    return res.status(200).json({
      customer: { id: customer._id.toString(), name: customer.name, email: customer.email },
    })
  } catch (err) {
    console.error('Customer login error:', err.message)
    return res.status(500).json({ error: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.' })
  }
}
