import { getDb, isValidObjectId } from './_lib/mongodb.js'
import { requirePermission } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { ObjectId } from 'mongodb'
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

async function handleList(req, res) {
  try {
    const db = await getDb()
    const customers = await db.collection('customers')
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray()
    return res.status(200).json(customers.map(c => ({
      ...c,
      _id: c._id.toString(),
      entitlements: buildEntitlementsFromPackages(c.packages || []),
    })))
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

  if (!isValidObjectId(customerId)) return res.status(400).json({ error: 'Geçerli müşteri ID gerekli' })

  let pkg
  if (reference && reference !== 'custom') {
    pkg = buildPackageObject(reference, { source: 'admin' })
    if (!pkg) return res.status(400).json({ error: 'Geçersiz paket referansı' })
  } else if (customPackage) {
    const clean = cleanCustomPackage(customPackage)
    if (!clean) return res.status(400).json({ error: 'Özel paket bilgisi geçersiz' })
    pkg = {
      id: `custom-${Date.now()}`,
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
    const db = await getDb()
    await db.collection('customers').updateOne(
      { _id: new ObjectId(customerId) },
      { $push: { packages: pkg }, $set: { updatedAt: new Date() } }
    )
    return res.status(200).json({ success: true, package: pkg })
  } catch (err) {
    console.error('Add package error:', err.message)
    return res.status(500).json({ error: 'Paket eklenirken hata oluştu' })
  }
}

async function handleUpdatePackage(req, res) {
  const { customerId, packageId, status } = parseBody(req)
  if (!isValidObjectId(customerId) || typeof packageId !== 'string' || packageId.length > 160 || !PACKAGE_STATUSES.has(status)) {
    return res.status(400).json({ error: 'customerId, packageId veya durum geçersiz' })
  }

  try {
    const db = await getDb()
    await db.collection('customers').updateOne(
      { _id: new ObjectId(customerId), 'packages.id': packageId },
      { $set: { 'packages.$.status': status, updatedAt: new Date() } }
    )
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Paket güncellenemedi' })
  }
}

async function handleRemovePackage(req, res) {
  const { customerId, packageId } = parseBody(req)
  if (!isValidObjectId(customerId) || typeof packageId !== 'string' || packageId.length > 160) {
    return res.status(400).json({ error: 'customerId veya packageId geçersiz' })
  }

  try {
    const db = await getDb()
    await db.collection('customers').updateOne(
      { _id: new ObjectId(customerId) },
      { $pull: { packages: { id: packageId } }, $set: { updatedAt: new Date() } }
    )
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Paket kaldırılamadı' })
  }
}

async function handleUpdateStatus(req, res) {
  const { customerId, status } = parseBody(req)
  if (!isValidObjectId(customerId) || !CUSTOMER_STATUSES.has(status)) {
    return res.status(400).json({ error: 'customerId veya status geçersiz' })
  }

  try {
    const db = await getDb()
    await db.collection('customers').updateOne(
      { _id: new ObjectId(customerId) },
      { $set: { status, updatedAt: new Date() } }
    )
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Durum güncellenemedi' })
  }
}

async function handleDeleteCustomer(req, res) {
  const { customerId } = parseBody(req)
  if (!isValidObjectId(customerId)) return res.status(400).json({ error: 'Geçerli customerId gerekli' })

  try {
    const db = await getDb()
    await db.collection('customers').deleteOne({ _id: new ObjectId(customerId) })
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Müşteri silinemedi' })
  }
}
