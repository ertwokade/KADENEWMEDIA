import { ObjectId } from 'mongodb'
import { getDb, isValidObjectId } from './_lib/mongodb.js'
import { requireAuth } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value, max = 300) {
  return String(value || '').trim().slice(0, max)
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function requireAdmin(req, res) {
  const user = requireAuth(req)
  if (!user) {
    res.status(401).json({ error: 'Yetkisiz erişim' })
    return null
  }
  return user
}

async function handleQuotes(req, res, db) {
  const col = db.collection('quotes')

  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'quotes', maxRequests: 10 })
    if (!rl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` })

    const {
      name, email, phone, company, services, platforms, monthlyBudget,
      contentCount, videoCount, adManagement, timeline, source, estimatedPrice, notes,
    } = req.body || {}

    if (!clean(name, 120) || !clean(email, 254)) return res.status(400).json({ error: 'Ad ve e-posta zorunludur.' })
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' })

    const quote = {
      name: clean(name, 120),
      email: clean(email, 254).toLowerCase(),
      phone: clean(phone, 30),
      company: clean(company, 120),
      services: Array.isArray(services) ? services.slice(0, 12).map(s => clean(s, 80)) : [],
      platforms: Array.isArray(platforms) ? platforms.slice(0, 12).map(s => clean(s, 80)) : [],
      monthlyBudget: Number(monthlyBudget) || 0,
      contentCount: Number(contentCount) || 0,
      videoCount: Number(videoCount) || 0,
      adManagement: !!adManagement,
      timeline: clean(timeline, 80),
      source: clean(source, 80) || 'online-quote',
      estimatedPrice: Number(estimatedPrice) || 0,
      notes: clean(notes, 1200),
      status: 'yeni',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await col.insertOne(quote)
    quote._id = result.insertedId

    await db.collection('messages').insertOne({
      name: quote.name,
      email: quote.email,
      phone: quote.phone || '-',
      company: quote.company || '-',
      service: quote.services.join(', ') || 'Online Teklif',
      message: `Online teklif talebi\nTahmini fiyat: ₺${quote.estimatedPrice.toLocaleString('tr-TR')}\nPlatformlar: ${quote.platforms.join(', ') || '-'}\nNot: ${quote.notes || '-'}`,
      source: quote.source,
      status: 'yeni',
      read: false,
      createdAt: new Date(),
    })

    return res.status(201).json({ success: true, quote })
  }

  const user = requireAdmin(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const quotes = await col.find({}).sort({ createdAt: -1 }).limit(250).toArray()
    return res.status(200).json(quotes)
  }

  if (req.method === 'PUT') {
    const { id, status, assignedTo, notes } = req.body || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const updates = { updatedAt: new Date(), updatedBy: user.username }
    if (status) updates.status = clean(status, 50)
    if (assignedTo !== undefined) updates.assignedTo = clean(assignedTo, 120)
    if (notes !== undefined) updates.notes = clean(notes, 1200)
    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    await col.deleteOne({ _id: new ObjectId(id) })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleInvoices(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return

  const col = db.collection('invoices')

  if (req.method === 'GET') {
    const invoices = await col.find({}).sort({ dueDate: 1, createdAt: -1 }).limit(300).toArray()
    return res.status(200).json(invoices)
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, amount, currency, dueDate, description } = req.body || {}
    if (!clientName || !amount) return res.status(400).json({ error: 'Müşteri adı ve tutar zorunludur' })
    const invoice = {
      clientName: clean(clientName, 120),
      clientEmail: clean(clientEmail, 254).toLowerCase(),
      amount: Number(amount) || 0,
      currency: clean(currency, 8) || 'TRY',
      dueDate: dueDate ? new Date(dueDate) : null,
      description: clean(description, 800),
      status: 'bekliyor',
      payments: [],
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await col.insertOne(invoice)
    return res.status(201).json({ ...invoice, _id: result.insertedId })
  }

  if (req.method === 'PUT') {
    const { id, action, paymentAmount, status, ...rest } = req.body || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })

    if (action === 'record-payment') {
      const payment = { amount: Number(paymentAmount) || 0, date: new Date(), user: user.username }
      await col.updateOne(
        { _id: new ObjectId(id) },
        { $push: { payments: payment }, $set: { status: status || 'odendi', updatedAt: new Date() } }
      )
      return res.status(200).json({ success: true })
    }

    const updates = { updatedAt: new Date() }
    if (status) updates.status = clean(status, 50)
    for (const key of ['clientName', 'clientEmail', 'amount', 'currency', 'dueDate', 'description', 'status']) {
      if (rest[key] !== undefined) updates[key] = key === 'amount' ? Number(rest[key]) || 0 : rest[key]
    }
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate)
    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    await col.deleteOne({ _id: new ObjectId(id) })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleCustomerProfiles(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return

  const [messages, quotes, proposals, subscriptions, invoices] = await Promise.all([
    db.collection('messages').find({}).sort({ createdAt: -1 }).limit(400).toArray(),
    db.collection('quotes').find({}).sort({ createdAt: -1 }).limit(250).toArray(),
    db.collection('proposals').find({}).sort({ createdAt: -1 }).limit(250).toArray(),
    db.collection('subscriptions').find({}).sort({ createdAt: -1 }).limit(250).toArray(),
    db.collection('invoices').find({}).sort({ createdAt: -1 }).limit(300).toArray(),
  ])

  const map = new Map()
  const touch = (key, seed = {}) => {
    const normalized = clean(key || seed.email || seed.name || seed.company || 'bilinmeyen', 254).toLowerCase()
    if (!map.has(normalized)) {
      map.set(normalized, {
        key: normalized,
        name: seed.name || seed.clientName || seed.company || 'İsimsiz müşteri',
        email: seed.email || seed.clientEmail || '',
        company: seed.company || seed.clientCompany || '',
        messages: [],
        quotes: [],
        proposals: [],
        subscriptions: [],
        invoices: [],
      })
    }
    return map.get(normalized)
  }

  messages.forEach(item => touch(item.email || item.company || item.name, item).messages.push(item))
  quotes.forEach(item => touch(item.email || item.company || item.name, item).quotes.push(item))
  proposals.forEach(item => touch(item.clientEmail || item.clientCompany || item.clientName, item).proposals.push(item))
  subscriptions.forEach(item => touch(item.clientEmail || item.clientCompany || item.clientName, item).subscriptions.push(item))
  invoices.forEach(item => touch(item.clientEmail || item.clientName, item).invoices.push(item))

  const profiles = Array.from(map.values()).map(profile => ({
    ...profile,
    totalValue: [
      ...profile.quotes.map(q => Number(q.estimatedPrice) || 0),
      ...profile.proposals.map(p => Number(p.total) || Number(p.totalAmount) || 0),
      ...profile.subscriptions.map(s => Number(s.monthlyAmount) || 0),
      ...profile.invoices.map(i => Number(i.amount) || 0),
    ].reduce((sum, val) => sum + val, 0),
    lastActivity: [...profile.messages, ...profile.quotes, ...profile.proposals, ...profile.subscriptions, ...profile.invoices]
      .map(i => i.updatedAt || i.createdAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null,
  })).sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))

  const q = clean(req.query?.q, 100)
  const filtered = q
    ? profiles.filter(p => new RegExp(escapeRegex(q), 'i').test(`${p.name} ${p.email} ${p.company}`))
    : profiles
  return res.status(200).json(filtered.slice(0, 200))
}

async function handleBackup(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return

  const collections = ['messages', 'quotes', 'proposals', 'tasks', 'subscriptions', 'surveys', 'invoices', 'referrals', 'blogs', 'partners', 'content']
  if (req.method === 'GET') {
    const counts = {}
    for (const name of collections) counts[name] = await db.collection(name).countDocuments()
    return res.status(200).json({ generatedAt: new Date(), generatedBy: user.username, collections: counts })
  }

  if (req.method === 'POST') {
    const data = {}
    for (const name of collections) {
      data[name] = await db.collection(name).find({}).sort({ createdAt: -1 }).limit(1000).toArray()
    }
    await db.collection('backups').insertOne({
      generatedAt: new Date(),
      generatedBy: user.username,
      collections: Object.fromEntries(Object.entries(data).map(([name, items]) => [name, items.length])),
    })
    return res.status(200).json({ generatedAt: new Date(), data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleClientErrors(req, res, db) {
  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'client-errors', maxRequests: 30 })
    if (!rl.allowed) return res.status(204).end()
    const { message, stack, path, source } = req.body || {}
    await db.collection('client_errors').insertOne({
      message: clean(message, 500),
      stack: clean(stack, 4000),
      path: clean(path, 300),
      source: clean(source, 80),
      userAgent: clean(req.headers['user-agent'], 300),
      createdAt: new Date(),
    })
    return res.status(204).end()
  }

  const user = requireAdmin(req, res)
  if (!user) return
  const errors = await db.collection('client_errors').find({}).sort({ createdAt: -1 }).limit(100).toArray()
  return res.status(200).json(errors)
}

async function handleEmailTemplates(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return
  const col = db.collection('email_templates')

  if (req.method === 'GET') {
    const items = await col.find({}).sort({ createdAt: 1 }).toArray()
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { isim, konu, metin } = req.body || {}
    if (!clean(isim, 200) || !clean(metin, 8000)) return res.status(400).json({ error: 'isim ve metin zorunludur' })
    const doc = {
      isim: clean(isim, 200),
      konu: clean(konu, 300),
      metin: clean(metin, 8000),
      createdBy: user.username,
      createdAt: new Date(),
    }
    const result = await col.insertOne(doc)
    return res.status(201).json({ ...doc, _id: result.insertedId })
  }

  if (req.method === 'PUT') {
    const { id, isim, konu, metin } = req.body || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const updates = { updatedAt: new Date() }
    if (isim !== undefined) updates.isim = clean(isim, 200)
    if (konu !== undefined) updates.konu = clean(konu, 300)
    if (metin !== undefined) updates.metin = clean(metin, 8000)
    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    await col.deleteOne({ _id: new ObjectId(id) })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleOnboarding(req, res, db) {
  const user = requireAdmin(req, res)
  if (!user) return
  const col = db.collection('onboarding_forms')

  if (req.method === 'GET') {
    const items = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray()
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const allowed = [
      'clientName', 'clientEmail', 'clientCompany', 'socialAccounts',
      'targetAudience', 'competitors', 'brandVoice', 'monthlyBudget',
      'goals', 'existingContent', 'designPreferences', 'notes',
    ]
    if (!clean(body.clientName, 200) || !clean(body.clientEmail, 254)) {
      return res.status(400).json({ error: 'Müşteri adı ve e-posta zorunludur' })
    }
    if (!EMAIL_RE.test(body.clientEmail)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' })
    const doc = { createdBy: user.username, createdAt: new Date() }
    for (const k of allowed) doc[k] = clean(body[k], 2000)
    const result = await col.insertOne(doc)
    return res.status(201).json({ ...doc, _id: result.insertedId })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    await col.deleteOne({ _id: new ObjectId(id) })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handlePush(req, res, db) {
  if (req.method !== 'POST') {
    const user = requireAdmin(req, res)
    if (!user) return
    const items = await db.collection('push_subscriptions').find({}).sort({ createdAt: -1 }).limit(200).toArray()
    return res.status(200).json(items)
  }

  const { endpoint, keys, permission } = req.body || {}
  await db.collection('push_subscriptions').updateOne(
    { endpoint: clean(endpoint, 800) || clean(req.headers['user-agent'], 300) },
    {
      $set: {
        endpoint: clean(endpoint, 800),
        keys: keys && typeof keys === 'object' ? keys : {},
        permission: clean(permission, 40),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  )
  return res.status(200).json({ success: true })
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const db = await getDb()
  const { resource } = req.query || {}

  try {
    if (resource === 'quotes') return handleQuotes(req, res, db)
    if (resource === 'invoices') return handleInvoices(req, res, db)
    if (resource === 'customer-profiles') return handleCustomerProfiles(req, res, db)
    if (resource === 'backup') return handleBackup(req, res, db)
    if (resource === 'client-errors') return handleClientErrors(req, res, db)
    if (resource === 'push') return handlePush(req, res, db)
    if (resource === 'email-templates') return handleEmailTemplates(req, res, db)
    if (resource === 'onboarding') return handleOnboarding(req, res, db)

    return res.status(400).json({ error: 'resource parametresi gerekli' })
  } catch (err) {
    console.error('Ops API error:', err)
    return res.status(500).json({ error: 'Operasyon tamamlanamadı' })
  }
}
