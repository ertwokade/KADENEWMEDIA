import { getDb } from './_lib/mongodb.js'
import { cors } from './_lib/cors.js'
import { getCustomerSession } from './customer-auth.js'
import { ObjectId } from 'mongodb'
import { buildEntitlementsFromPackages, buildPackageObject, getPackageByReference, isPackageCurrentlyActive } from './_lib/packages.js'

export default async function handler(req, res) {
  if (cors(req, res)) return

  const session = getCustomerSession(req)
  if (!session) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' })

  if (req.method === 'GET') {
    return handleGetProfile(req, res, session)
  }

  if (req.method === 'POST' && req.query?.action === 'claim-free-package') {
    return handleClaimFreePackage(req, res, session)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

function parseBody(req) {
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  return body || {}
}

async function handleGetProfile(req, res, session) {
  try {
    const db = await getDb()
    const customer = await db.collection('customers').findOne(
      { _id: new ObjectId(session.id) },
      { projection: { password: 0 } }
    )

    if (!customer) return res.status(404).json({ error: 'Müşteri bulunamadı' })

    const packages = customer.packages || []
    const activePackages = packages.filter(p => p.status === 'active')

    // Danışmanlık alanlarını paketlerden çıkar (benzersiz)
    const consultingAreas = [...new Set(
      activePackages
        .filter(p => p.reference !== 'kade-organizasyon-kiti-test')
        .map(p => p.consultingArea)
        .filter(Boolean)
    )]

    // Özellikleri tüm aktif paketlerden topla (benzersiz)
    const features = [...new Set(
      activePackages.flatMap(p => p.features || [])
    )]

    return res.status(200).json({
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
        lastLoginAt: customer.lastLoginAt,
      },
      consultingAreas,
      features,
      packages,
      entitlements: buildEntitlementsFromPackages(packages),
    })
  } catch (err) {
    console.error('Customer portal error:', err.message)
    return res.status(500).json({ error: 'Veriler yüklenirken bir hata oluştu' })
  }
}

async function handleClaimFreePackage(req, res, session) {
  const { reference } = parseBody(req)
  const def = getPackageByReference(reference)

  if (!reference || !def?.publicFree) {
    return res.status(400).json({ error: 'Bu paket ücretsiz test satın alımına açık değil' })
  }

  try {
    const db = await getDb()
    const customer = await db.collection('customers').findOne(
      { _id: new ObjectId(session.id) },
      { projection: { password: 0 } }
    )

    if (!customer) return res.status(404).json({ error: 'Müşteri bulunamadı' })

    const packages = customer.packages || []
    const existing = packages.find(pkg => pkg.reference === reference && isPackageCurrentlyActive(pkg))

    if (existing) {
      return res.status(200).json({
        success: true,
        alreadyOwned: true,
        package: existing,
        packages,
        entitlements: buildEntitlementsFromPackages(packages),
      })
    }

    const pkg = buildPackageObject(reference, { source: 'free-test' })
    await db.collection('customers').updateOne(
      { _id: new ObjectId(session.id) },
      { $push: { packages: pkg }, $set: { updatedAt: new Date() } }
    )

    const nextPackages = [...packages, pkg]
    return res.status(200).json({
      success: true,
      package: pkg,
      packages: nextPackages,
      entitlements: buildEntitlementsFromPackages(nextPackages),
    })
  } catch (err) {
    console.error('Free package claim error:', err.message)
    return res.status(500).json({ error: 'Paket eklenirken hata oluştu' })
  }
}
