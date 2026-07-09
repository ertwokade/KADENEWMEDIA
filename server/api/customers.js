import { getDb } from './_lib/mongodb.js'
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

  if (!customerId) return res.status(400).json({ error: 'Müşteri ID gerekli' })

  let pkg
  if (reference && reference !== 'custom') {
    pkg = buildPackageObject(reference, { source: 'admin' })
    if (!pkg) return res.status(400).json({ error: 'Geçersiz paket referansı' })
  } else if (customPackage) {
    // Özel paket tanımı
    pkg = {
      id: `custom-${Date.now()}`,
      reference: 'custom',
      name: customPackage.name || 'Özel Paket',
      consultingArea: customPackage.consultingArea || 'consulting',
      features: Array.isArray(customPackage.features) ? customPackage.features : [],
      access: customPackage.access && typeof customPackage.access === 'object' ? customPackage.access : {},
      purchasedAt: new Date(),
      expiresAt: customPackage.expiresAt ? new Date(customPackage.expiresAt) : null,
      status: 'active',
      source: 'admin',
      shopierOrderId: null,
      price: customPackage.price || null,
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
  if (!customerId || !packageId) return res.status(400).json({ error: 'customerId ve packageId gerekli' })

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
  if (!customerId || !packageId) return res.status(400).json({ error: 'customerId ve packageId gerekli' })

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
  if (!customerId || !status) return res.status(400).json({ error: 'customerId ve status gerekli' })

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
  if (!customerId) return res.status(400).json({ error: 'customerId gerekli' })

  try {
    const db = await getDb()
    await db.collection('customers').deleteOne({ _id: new ObjectId(customerId) })
    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: 'Müşteri silinemedi' })
  }
}
