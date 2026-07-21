import bcrypt from 'bcryptjs'
import { getSupabase, isValidUuid, isUniqueViolation } from './_lib/supabase.js'
import { createToken, verifyToken, getCookie, sessionVersionMatches } from './_lib/auth.js'
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
  if (!session || !isValidUuid(session.id)) return null

  const supabase = getSupabase()
  const { data: customer, error } = await supabase
    .from('kade_customers')
    .select('id, name, email, phone, status, source, session_version, consent_at, last_login_at, created_at, updated_at')
    .eq('id', session.id)
    .neq('status', 'inactive')
    .maybeSingle()
  if (error) throw error
  if (!customer) return null
  if (!sessionVersionMatches(session.sessionVersion, customer.session_version)) return null

  const { data: packageRows, error: pkgError } = await supabase
    .from('kade_customer_packages')
    .select('*')
    .eq('customer_id', customer.id)
  if (pkgError) throw pkgError

  customer.packages = (packageRows || []).map((p) => ({
    id: p.id,
    reference: p.reference,
    name: p.name,
    consultingArea: p.consulting_area,
    features: p.features || [],
    access: p.access || {},
    purchasedAt: p.purchased_at,
    expiresAt: p.expires_at,
    status: p.status,
    source: p.source,
    shopierOrderId: p.shopier_order_id,
    price: p.price,
    currency: p.currency,
  }))

  return {
    session: {
      ...session,
      id: customer.id,
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

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Ad, e-posta ve şifre gerekli' })
  }
  if (consent !== true) return res.status(400).json({ error: 'Aydınlatma metni onayı gereklidir' })

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({ error: 'Ad en az 2, en fazla 100 karakter olmalı' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (email.length > 254 || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin' })
  }

  if (password.length < 12 || password.length > 128) {
    return res.status(400).json({ error: 'Şifre 12–128 karakter arasında olmalı' })
  }
  if (phone != null && (typeof phone !== 'string' || phone.trim().length > 30)) {
    return res.status(400).json({ error: 'Telefon numarası geçersiz' })
  }

  try {
    const supabase = getSupabase()
    const now = new Date().toISOString()

    const { data: created, error } = await supabase.from('kade_customers').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      password_hash: await bcrypt.hash(password, 10),
      status: 'active',
      source: 'manual',
      last_login_at: null,
      consent_at: now,
      session_version: 0,
    }).select('id, name, email').single()

    if (error) {
      if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı' })
      throw error
    }

    const token = createToken({
      id: created.id,
      name: created.name,
      email: created.email,
      role: 'customer',
      sessionVersion: 0,
    })

    setCustomerCookie(req, res, token)

    return res.status(201).json({
      customer: { id: created.id, name: created.name, email: created.email },
    })
  } catch (err) {
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

  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 128) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' })
  }

  try {
    const supabase = getSupabase()
    const { data: customer, error: findError } = await supabase
      .from('kade_customers')
      .select('id, name, email, password_hash, status, session_version')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    if (findError) throw findError

    if (!customer) {
      return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı' })
    }

    if (customer.status === 'inactive') {
      return res.status(403).json({ error: 'Hesabınız askıya alınmış. Lütfen destek ile iletişime geçin.' })
    }

    const valid = await bcrypt.compare(password, customer.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'E-posta adresi veya şifre hatalı' })
    }

    const { error: updateError } = await supabase
      .from('kade_customers')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', customer.id)
    if (updateError) throw updateError

    const token = createToken({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      role: 'customer',
      sessionVersion: Number(customer.session_version || 0),
    })

    setCustomerCookie(req, res, token)

    return res.status(200).json({
      customer: { id: customer.id, name: customer.name, email: customer.email },
    })
  } catch (err) {
    console.error('Customer login error:', err.message)
    return res.status(500).json({ error: 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.' })
  }
}
