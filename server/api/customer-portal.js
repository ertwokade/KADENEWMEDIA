import { getDb } from './_lib/mongodb.js'
import { cors } from './_lib/cors.js'
import { getCustomerSession } from './customer-auth.js'
import { ObjectId } from 'mongodb'

export default async function handler(req, res) {
  if (cors(req, res)) return

  const session = getCustomerSession(req)
  if (!session) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' })

  if (req.method === 'GET') {
    return handleGetProfile(req, res, session)
  }

  return res.status(405).json({ error: 'Method not allowed' })
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
      activePackages.map(p => p.consultingArea).filter(Boolean)
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
    })
  } catch (err) {
    console.error('Customer portal error:', err.message)
    return res.status(500).json({ error: 'Veriler yüklenirken bir hata oluştu' })
  }
}
