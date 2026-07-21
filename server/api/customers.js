import { getSupabase, isValidUuid } from './_lib/supabase.js'
import { requirePermission } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { buildEntitlementsFromPackages, buildPackageObject, PACKAGE_DEFINITIONS } from './_lib/packages.js'

export default async function handler(req, res) {
  if (cors(req, res)) return

  const action = req.query?.action || ''
  const writeAction = req.method !== 'GET'
  if (!(await requirePermission(req, res, ['portalCustomers', 'crm'], { write: writeAction }))) return

  if (req.method === 'GET' && !action) return handleList(req, res)
  if (req.method === 'GET' && action === 'packages') return handlePackageDefinitions(req, res)
  if (req.method === 'POST' && action === 'add-package') return handleAddPackage(req, res)
  if (req.method === 'POST' && action === 'update-package') return handleUpdatePackage(req, res)
  if (req.method === 'POST' && action === 'remove-package') return handleRemovePackage(req, res)
  if (req.method === 'POST' && action === 'update-status') return handleUpdateStatus(req, res)
  if (req.method === 'DELETE') return handleDeleteCustomer(req, res)

  return res.status(405).json({ error: 'Method not allowed' })
}

function parseBody(req) {
  let b = req.body
  if (typeof b === 'string') { try { b = JSON.parse(b) } catch { b = {} } }
  return b || {}
}

const PACKAGE_STATUSES = new Set(['active', 'inactive', 'expired'])
const CUSTOMER_STATUSES = new Set(['active', 'inactive'])
const CUSTOM_ACCESS_KEYS = new Set([
  'hasConsultingPanelAccess', 'hasOrganizationKitAccess', 'hasKadeKitBusinessAccess',
  'hasKadeRadarAccess', 'hasAIKnowledgeCenterAccess', 'hasBigKitAccess',
  'hasQwenVideoAccess', 'maxSeats', 'consultingPlan', 'consultingStatus',
])

function cleanCustomPackage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const expiresAt = value.expiresAt ? new Date(value.expiresAt) : null
  if (expiresAt && Number.isNaN(expiresAt.getTime())) return null
  const price = value.price == null || value.price === '' ? null : Number(value.price)
  if (price != null && (!Number.isFinite(price) || price < 0 || price > 100_000_000)) return null
  const access = value.access && typeof value.access === 'object' && !Array.isArray(value.access)
    ? Object.fromEntries(Object.entries(value.access).filter(([key]) => CUSTOM_ACCESS_KEYS.has(key)))
    : {}
  return {
    name: typeof value.name === 'string' ? value.name.trim().slice(0, 120) : 'Özel Paket',
    consultingArea: typeof value.consultingArea === 'string' ? value.consultingArea.trim().slice(0, 80) : 'consulting',
    features: Array.isArray(value.features)
      ? value.features.filter((item) => typeof item === 'string').map((item) => item.trim().slice(0, 160)).filter(Boolean).slice(0, 40)
      : [],
    access,
    expiresAt,
    price,
  }
}

function packageRowToObject(p) {
  return {
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
  }
}

async function handleList(req, res) {
  try {
    const supabase = getSupabase()
    const { data: customers, error } = await supabase
      .from('kade_customers')
      .select('id, name, email, phone, status, source, session_version, consent_at, last_login_at, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const { data: allPackages, error: pkgError } = await supabase
      .from('kade_customer_packages')
      .select('*')
      .in('customer_id', customers.map((c) => c.id).length ? customers.map((c) => c.id) : ['00000000-0000-0000-0000-000000000000'])
    if (pkgError) throw pkgError

    const packagesByCustomer = new Map()
    for (const row of allPackages || []) {
      const list = packagesByCustomer.get(row.customer_id) || []
      list.push(packageRowToObject(row))
      packagesByCustomer.set(row.customer_id, list)
    }

    return res.status(200).json(customers.map((c) => {
      const packages = packagesByCustomer.get(c.id) || []
      return {
        ...c,
        _id: c.id,
        packages,
        entitlements: buildEntitlementsFromPackages(packages),
      }
    }))
  } catch (err) {
    console.error('Customers list error:', err.message)
    return res.status(500).json({ error: 'Müşteriler yüklenemedi' })
  }
}

function handlePackageDefinitions(req, res) {
  const defs = Object.entries(PACKAGE_DEFINITIONS).map(([reference, def]) => ({
    reference,
    name: def.name,
    consultingArea: def.consultingArea,
    features: def.features,
    durationDays: def.durationDays,
    price: def.price ?? null,
    publicFree: Boolean(def.publicFree),
    access: def.access || {},
  }))
  return res.status(200).json(defs)
}

async function handleAddPackage(req, res) {
  const { customerId, reference, customPackage } = parseBody(req)

  if (!isValidUuid(customerId)) return res.status(400).json({ error: 'Geçerli müşteri ID gerekli' })

  let pkg
  if (reference && reference !== 'custom') {
    pkg = buildPackageObject(reference, { source: 'admin' })
    if (!pkg) return res.status(400).json({ error: 'Geçersiz paket referansı' })
  } else if (customPackage) {
    const clean = cleanCustomPackage(customPackage)
    if (!clean) return res.status(400).json({ error: 'Özel paket bilgisi geçersiz' })
    pkg = {
      reference: 'custom',
      name: clean.name,
      consultingArea: clean.consultingArea,
      features: clean.features,
      access: clean.access,
      purchasedAt: new Date(),
      expiresAt: clean.expiresAt,
      status: 'active',
      source: 'admin',
      shopierOrderId: null,
      price: clean.price,
    }
  } else {
    return res.status(400).json({ error: 'Paket referansı veya özel paket bilgisi gerekli' })
  }

  try {
    const supabase = getSupabase()
    const { data: created, error } = await supabase.from('kade_customer_packages').insert({
      customer_id: customerId,
      reference: pkg.reference,
      name: pkg.name,
      consulting_area: pkg.consultingArea,
      features: pkg.features,
      access: pkg.access,
      status: pkg.status,
      source: pkg.source,
      shopier_order_id: pkg.shopierOrderId,
      price: pkg.price,
      currency: pkg.currency || null,
      purchased_at: pkg.purchasedAt instanceof Date ? pkg.purchasedAt.toISOString() : pkg.purchasedAt,
      expires_at: pkg.expiresAt instanceof Date ? pkg.expiresAt.toISOString() : pkg.expiresAt,
    }).select().single()
    if (error) throw error

    return res.status(200).json({ success: true, package: packageRowToObject(created) })
  } catch (err) {
    console.error('Add package error:', err.message)
    return res.status(500).json({ error: 'Paket eklenirken hata oluştu' })
  }
}

async function handleUpdatePackage(req, res) {
  const { customerId, packageId, status } = parseBody(req)
  if (!isValidUuid(customerId) || !isValidUuid(packageId) || !PACKAGE_STATUSES.has(status)) {
    return res.status(400).json({ error: 'customerId, packageId veya durum geçersiz' })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('kade_customer_packages')
      .update({ status })
      .eq('id', packageId)
      .eq('customer_id', customerId)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Paket güncellenemedi' })
  }
}

async function handleRemovePackage(req, res) {
  const { customerId, packageId } = parseBody(req)
  if (!isValidUuid(customerId) || !isValidUuid(packageId)) {
    return res.status(400).json({ error: 'customerId veya packageId geçersiz' })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('kade_customer_packages')
      .delete()
      .eq('id', packageId)
      .eq('customer_id', customerId)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Paket kaldırılamadı' })
  }
}

async function handleUpdateStatus(req, res) {
  const { customerId, status } = parseBody(req)
  if (!isValidUuid(customerId) || !CUSTOMER_STATUSES.has(status)) {
    return res.status(400).json({ error: 'customerId veya status geçersiz' })
  }

  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('kade_customers').update({ status }).eq('id', customerId)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Durum güncellenemedi' })
  }
}

async function handleDeleteCustomer(req, res) {
  const { customerId } = parseBody(req)
  if (!isValidUuid(customerId)) return res.status(400).json({ error: 'Geçerli customerId gerekli' })

  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('kade_customers').delete().eq('id', customerId)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Müşteri silinemedi' })
  }
}
