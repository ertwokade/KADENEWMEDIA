import { getSupabase, isValidUuid } from './_lib/supabase.js'
import { requirePermission } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const QUOTE_SERVICES = new Set(['Sosyal Medya Yönetimi', 'İçerik Üretimi', 'Reklam Yönetimi', 'Video Prodüksiyon', 'Web Sitesi', 'Danışmanlık', 'Social Media Management', 'Content Production', 'Ads Management', 'Video Production', 'Website', 'Consulting'])
const QUOTE_PLATFORMS = new Set(['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook', 'Google Ads'])
const QUOTE_PACKAGES = new Set(['', 'baslangic', 'buyume', 'ozel'])
const QUOTE_TIMELINES = new Set(['esnek', 'oncelikli'])

function clean(value, max = 300) {
  return String(value || '').trim().slice(0, max)
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mapQuote(q) {
  if (!q) return q
  return {
    _id: q.id,
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    company: q.company,
    services: q.services,
    platforms: q.platforms,
    monthlyBudget: q.monthly_budget,
    contentCount: q.content_count,
    videoCount: q.video_count,
    adManagement: q.ad_management,
    timeline: q.timeline,
    package: q.package,
    source: q.source,
    notes: q.notes,
    estimatedPrice: q.estimated_price,
    consentAt: q.consent_at,
    status: q.status,
    assignedTo: q.assigned_to,
    updatedBy: q.updated_by,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  }
}

function mapInvoice(inv) {
  if (!inv) return inv
  return {
    _id: inv.id,
    id: inv.id,
    clientName: inv.client_name,
    clientEmail: inv.client_email,
    amount: inv.amount,
    currency: inv.currency,
    dueDate: inv.due_date,
    description: inv.description,
    status: inv.status,
    createdBy: inv.created_by,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
    payments: (inv.payments || []).map((p) => ({
      _id: p.id, id: p.id, amount: p.amount, date: p.date, user: p.user,
    })),
  }
}

async function requireAdmin(req, res, permission = 'crm', options = {}) {
  return requirePermission(req, res, permission, options)
}

async function handleQuotes(req, res) {
  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'quotes', maxRequests: 10 })
    if (!rl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` })

    const {
      name, email, phone, company, services, platforms, monthlyBudget,
      contentCount, videoCount, adManagement, timeline, source, notes, consent, package: packageId,
    } = req.body || {}

    if (!clean(name, 120) || !clean(email, 254)) return res.status(400).json({ error: 'Ad ve e-posta zorunludur.' })
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' })
    if (consent !== true) return res.status(400).json({ error: 'Teklif talebi için KVKK onayı zorunludur.' })
    if (String(name).trim().length > 120 || String(email).trim().length > 254 || String(phone || '').length > 30 || String(company || '').length > 120) {
      return res.status(400).json({ error: 'İletişim alanlarından biri izin verilen uzunluğu aşıyor.' })
    }
    if (String(notes || '').length > 1200) return res.status(400).json({ error: 'Not alanı çok uzun (en fazla 1200 karakter).' })
    if (!Array.isArray(services) || services.length < 1 || services.length > 12 || services.some(item => !QUOTE_SERVICES.has(String(item)))) {
      return res.status(400).json({ error: 'Geçersiz hizmet seçimi.' })
    }
    if (!Array.isArray(platforms) || platforms.length < 1 || platforms.length > 12 || platforms.some(item => !QUOTE_PLATFORMS.has(String(item)))) {
      return res.status(400).json({ error: 'Geçersiz platform seçimi.' })
    }
    if (!QUOTE_PACKAGES.has(clean(packageId, 40))) return res.status(400).json({ error: 'Geçersiz paket seçimi.' })
    if (!QUOTE_TIMELINES.has(clean(timeline, 80))) return res.status(400).json({ error: 'Geçersiz takvim seçimi.' })

    const safeBudget = monthlyBudget === '' || monthlyBudget == null ? 0 : Number(monthlyBudget)
    const safeContentCount = contentCount === '' || contentCount == null ? 0 : Number(contentCount)
    const safeVideoCount = videoCount === '' || videoCount == null ? 0 : Number(videoCount)
    if (![safeBudget, safeContentCount, safeVideoCount].every(Number.isFinite) || safeBudget < 0 || safeBudget > 100000000 || safeContentCount < 0 || safeContentCount > 1000 || safeVideoCount < 0 || safeVideoCount > 1000) {
      return res.status(400).json({ error: 'Geçersiz kapsam veya bütçe değeri.' })
    }

    const supabase = getSupabase()
    const quote = {
      name: clean(name, 120),
      email: clean(email, 254).toLowerCase(),
      phone: clean(phone, 30),
      company: clean(company, 120),
      services: services.map(s => clean(s, 80)),
      platforms: platforms.map(s => clean(s, 80)),
      monthly_budget: safeBudget,
      content_count: safeContentCount,
      video_count: safeVideoCount,
      ad_management: !!adManagement,
      timeline: clean(timeline, 80),
      package: clean(packageId, 40),
      source: clean(source, 80) || 'online-quote',
      notes: clean(notes, 1200),
      consent_at: new Date().toISOString(),
      status: 'yeni',
    }

    const { data: insertedQuote, error: insertErr } = await supabase.from('kade_quotes').insert(quote).select().single()
    if (insertErr) throw insertErr

    const { error: msgErr } = await supabase.from('kade_messages').insert({
      name: insertedQuote.name,
      email: insertedQuote.email,
      phone: insertedQuote.phone || '-',
      company: insertedQuote.company || '-',
      service: (insertedQuote.services || []).join(', ') || 'Online Teklif',
      message: `Online teklif talebi\nKapsam: ${insertedQuote.package || 'Belirtilmedi'}\nPlatformlar: ${(insertedQuote.platforms || []).join(', ') || '-'}\nNot: ${insertedQuote.notes || '-'}`,
      source: insertedQuote.source,
      status: 'yeni',
      read: false,
    })
    if (msgErr) throw msgErr

    return res.status(201).json({ success: true, quote: mapQuote(insertedQuote) })
  }

  const user = await requireAdmin(req, res, 'quoteLeads', { write: req.method !== 'GET' })
  if (!user) return
  const supabase = getSupabase()

  if (req.method === 'GET') {
    const { data: quotes, error } = await supabase.from('kade_quotes').select('*').order('created_at', { ascending: false }).limit(250)
    if (error) throw error
    return res.status(200).json(quotes.map(mapQuote))
  }

  if (req.method === 'PUT') {
    const { id, status, assignedTo, notes, estimatedPrice } = req.body || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const updates = { updated_at: new Date().toISOString(), updated_by: user.username }
    if (status) updates.status = clean(status, 50)
    if (assignedTo !== undefined) updates.assigned_to = clean(assignedTo, 120)
    if (notes !== undefined) updates.notes = clean(notes, 1200)
    if (estimatedPrice !== undefined) {
      const price = Number(estimatedPrice)
      updates.estimated_price = Number.isFinite(price) && price >= 0 ? price : null
    }
    const { error } = await supabase.from('kade_quotes').update(updates).eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const { error } = await supabase.from('kade_quotes').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleInvoices(req, res, supabase) {
  const user = await requireAdmin(req, res, 'invoices', { write: req.method !== 'GET' })
  if (!user) return

  if (req.method === 'GET') {
    const { data: invoices, error } = await supabase
      .from('kade_invoices')
      .select('*, payments:kade_invoice_payments(*)')
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(300)
    if (error) throw error
    return res.status(200).json(invoices.map(mapInvoice))
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, amount, currency, dueDate, description } = req.body || {}
    if (!clientName || !amount) return res.status(400).json({ error: 'Müşteri adı ve tutar zorunludur' })
    const invoice = {
      client_name: clean(clientName, 120),
      client_email: clean(clientEmail, 254).toLowerCase(),
      amount: Number(amount) || 0,
      currency: clean(currency, 8) || 'TRY',
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      description: clean(description, 800),
      status: 'bekliyor',
      created_by: user.username,
    }
    const { data: insertedInvoice, error } = await supabase.from('kade_invoices').insert(invoice).select().single()
    if (error) throw error
    return res.status(201).json({ ...insertedInvoice, payments: [] })
  }

  if (req.method === 'PUT') {
    const { id, action, paymentAmount, status, ...rest } = req.body || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })

    if (action === 'record-payment') {
      const { error: paymentErr } = await supabase.from('kade_invoice_payments').insert({
        invoice_id: id,
        amount: Number(paymentAmount) || 0,
        date: new Date().toISOString(),
        user: user.username,
      })
      if (paymentErr) throw paymentErr

      const { error: statusErr } = await supabase
        .from('kade_invoices')
        .update({ status: status || 'odendi', updated_at: new Date().toISOString() })
        .eq('id', id)
      if (statusErr) throw statusErr
      return res.status(200).json({ success: true })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (status) updates.status = clean(status, 50)
    const fieldMap = { clientName: 'client_name', clientEmail: 'client_email', amount: 'amount', currency: 'currency', dueDate: 'due_date', description: 'description', status: 'status' }
    for (const key of ['clientName', 'clientEmail', 'amount', 'currency', 'dueDate', 'description', 'status']) {
      if (rest[key] !== undefined) {
        const col = fieldMap[key]
        updates[col] = key === 'amount' ? Number(rest[key]) || 0 : rest[key]
      }
    }
    if (updates.due_date) updates.due_date = new Date(updates.due_date).toISOString()
    const { error } = await supabase.from('kade_invoices').update(updates).eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const { error } = await supabase.from('kade_invoices').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleCustomerProfiles(req, res, supabase) {
  const user = await requireAdmin(req, res, 'customerProfiles')
  if (!user) return

  const [messagesRes, quotesRes, proposalsRes, subscriptionsRes, invoicesRes] = await Promise.all([
    supabase.from('kade_messages').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('kade_quotes').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('kade_proposals').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('kade_subscriptions').select('*').order('created_at', { ascending: false }).limit(250),
    supabase.from('kade_invoices').select('*').order('created_at', { ascending: false }).limit(300),
  ])
  for (const r of [messagesRes, quotesRes, proposalsRes, subscriptionsRes, invoicesRes]) {
    if (r.error) throw r.error
  }
  const messages = messagesRes.data || []
  const quotes = quotesRes.data || []
  const proposals = proposalsRes.data || []
  const subscriptions = subscriptionsRes.data || []
  const invoices = invoicesRes.data || []

  const map = new Map()
  const touch = (key, seed = {}) => {
    const normalized = clean(key || seed.email || seed.name || seed.company || 'bilinmeyen', 254).toLowerCase()
    if (!map.has(normalized)) {
      map.set(normalized, {
        key: normalized,
        name: seed.name || seed.client_name || seed.company || 'İsimsiz müşteri',
        email: seed.email || seed.client_email || '',
        company: seed.company || seed.client_company || '',
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
  proposals.forEach(item => touch(item.client_email || item.client_company || item.client_name, item).proposals.push(item))
  subscriptions.forEach(item => touch(item.client_email || item.client_company || item.client_name, item).subscriptions.push(item))
  invoices.forEach(item => touch(item.client_email || item.client_name, item).invoices.push(item))

  const profiles = Array.from(map.values()).map(profile => ({
    ...profile,
    totalValue: [
      ...profile.quotes.map(q => Number(q.estimated_price) || 0),
      ...profile.proposals.map(p => Number(p.total) || Number(p.total_amount) || 0),
      ...profile.subscriptions.map(s => Number(s.monthly_amount) || 0),
      ...profile.invoices.map(i => Number(i.amount) || 0),
    ].reduce((sum, val) => sum + val, 0),
    lastActivity: [...profile.messages, ...profile.quotes, ...profile.proposals, ...profile.subscriptions, ...profile.invoices]
      .map(i => i.updated_at || i.created_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null,
  })).sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))

  const q = clean(req.query?.q, 100)
  const filtered = q
    ? profiles.filter(p => new RegExp(escapeRegex(q), 'i').test(`${p.name} ${p.email} ${p.company}`))
    : profiles
  return res.status(200).json(filtered.slice(0, 200))
}

async function handleBackup(req, res, supabase) {
  const user = await requireAdmin(req, res, 'backup', { write: req.method !== 'GET' })
  if (!user) return

  const TABLES = {
    messages: 'kade_messages',
    quotes: 'kade_quotes',
    proposals: 'kade_proposals',
    tasks: 'kade_tasks',
    subscriptions: 'kade_subscriptions',
    surveys: 'kade_surveys',
    invoices: 'kade_invoices',
    referrals: 'kade_referrals',
    blogs: 'kade_blogs',
    partners: 'kade_partners',
    content: 'kade_site_content',
  }

  if (req.method === 'GET') {
    const counts = {}
    for (const [name, table] of Object.entries(TABLES)) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) throw error
      counts[name] = count || 0
    }
    return res.status(200).json({ generatedAt: new Date().toISOString(), generatedBy: user.username, collections: counts })
  }

  if (req.method === 'POST') {
    const data = {}
    for (const [name, table] of Object.entries(TABLES)) {
      const { data: rows, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1000)
      if (error) throw error
      data[name] = rows || []
    }
    const { error: insertErr } = await supabase.from('kade_backups').insert({
      generated_at: new Date().toISOString(),
      generated_by: user.username,
      collections: Object.fromEntries(Object.entries(data).map(([name, items]) => [name, items.length])),
    })
    if (insertErr) throw insertErr
    return res.status(200).json({ generatedAt: new Date().toISOString(), data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleClientErrors(req, res, supabase) {
  if (req.method === 'POST') {
    const rl = await rateLimitCheck(req, { namespace: 'client-errors', maxRequests: 30 })
    if (!rl.allowed) return res.status(204).end()
    const { message, stack, path, source } = req.body || {}
    const { error } = await supabase.from('kade_client_errors').insert({
      message: clean(message, 500),
      stack: clean(stack, 4000),
      path: clean(path, 300),
      source: clean(source, 80),
      user_agent: clean(req.headers['user-agent'], 300),
    })
    if (error) throw error
    return res.status(204).end()
  }

  const user = await requireAdmin(req, res, 'settings')
  if (!user) return
  const { data: errors, error } = await supabase.from('kade_client_errors').select('*').order('created_at', { ascending: false }).limit(100)
  if (error) throw error
  return res.status(200).json(errors)
}

async function handleEmailTemplates(req, res, supabase) {
  const user = await requireAdmin(req, res, 'emailTemplates', { write: req.method !== 'GET' })
  if (!user) return

  if (req.method === 'GET') {
    const { data: items, error } = await supabase.from('kade_email_templates').select('*').order('created_at', { ascending: true })
    if (error) throw error
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { isim, konu, metin } = req.body || {}
    if (!clean(isim, 200) || !clean(metin, 8000)) return res.status(400).json({ error: 'isim ve metin zorunludur' })
    const doc = {
      isim: clean(isim, 200),
      konu: clean(konu, 300),
      metin: clean(metin, 8000),
      created_by: user.username,
    }
    const { data: inserted, error } = await supabase.from('kade_email_templates').insert(doc).select().single()
    if (error) throw error
    return res.status(201).json(inserted)
  }

  if (req.method === 'PUT') {
    const { id, isim, konu, metin } = req.body || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const updates = { updated_at: new Date().toISOString() }
    if (isim !== undefined) updates.isim = clean(isim, 200)
    if (konu !== undefined) updates.konu = clean(konu, 300)
    if (metin !== undefined) updates.metin = clean(metin, 8000)
    const { error } = await supabase.from('kade_email_templates').update(updates).eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const { error } = await supabase.from('kade_email_templates').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleOnboarding(req, res, supabase) {
  const user = await requireAdmin(req, res, 'onboarding', { write: req.method !== 'GET' })
  if (!user) return

  if (req.method === 'GET') {
    const { data: items, error } = await supabase.from('kade_onboarding_forms').select('*').order('created_at', { ascending: false }).limit(300)
    if (error) throw error
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const body = req.body || {}
    const allowedMap = {
      clientName: 'client_name', clientEmail: 'client_email', clientCompany: 'client_company', socialAccounts: 'social_accounts',
      targetAudience: 'target_audience', competitors: 'competitors', brandVoice: 'brand_voice', monthlyBudget: 'monthly_budget',
      goals: 'goals', existingContent: 'existing_content', designPreferences: 'design_preferences', notes: 'notes',
    }
    if (!clean(body.clientName, 200) || !clean(body.clientEmail, 254)) {
      return res.status(400).json({ error: 'Müşteri adı ve e-posta zorunludur' })
    }
    if (!EMAIL_RE.test(body.clientEmail)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' })
    const doc = { created_by: user.username }
    for (const [k, col] of Object.entries(allowedMap)) doc[col] = clean(body[k], 2000)
    const { data: inserted, error } = await supabase.from('kade_onboarding_forms').insert(doc).select().single()
    if (error) throw error
    return res.status(201).json(inserted)
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const { error } = await supabase.from('kade_onboarding_forms').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handlePush(req, res, supabase) {
  if (req.method !== 'POST') {
    const user = await requireAdmin(req, res, 'settings')
    if (!user) return
    const { data: items, error } = await supabase.from('kade_push_subscriptions').select('*').order('created_at', { ascending: false }).limit(200)
    if (error) throw error
    return res.status(200).json(items)
  }

  const { endpoint, keys, permission } = req.body || {}
  const finalEndpoint = clean(endpoint, 800) || clean(req.headers['user-agent'], 300)
  const { error } = await supabase.from('kade_push_subscriptions').upsert(
    {
      endpoint: finalEndpoint,
      keys: keys && typeof keys === 'object' ? keys : {},
      permission: clean(permission, 40),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error
  return res.status(200).json({ success: true })
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const { resource } = req.query || {}

  try {
    if (resource === 'quotes') return handleQuotes(req, res)
    const supabase = getSupabase()
    if (resource === 'invoices') return handleInvoices(req, res, supabase)
    if (resource === 'customer-profiles') return handleCustomerProfiles(req, res, supabase)
    if (resource === 'backup') return handleBackup(req, res, supabase)
    if (resource === 'client-errors') return handleClientErrors(req, res, supabase)
    if (resource === 'push') return handlePush(req, res, supabase)
    if (resource === 'email-templates') return handleEmailTemplates(req, res, supabase)
    if (resource === 'onboarding') return handleOnboarding(req, res, supabase)

    return res.status(400).json({ error: 'resource parametresi gerekli' })
  } catch (err) {
    console.error('Ops API error:', err)
    return res.status(500).json({ error: 'Operasyon tamamlanamadı' })
  }
}
