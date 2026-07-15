import { cors } from './_lib/cors.js'
import { getActiveCustomerSession } from './customer-auth.js'
import { buildEntitlementsFromPackages } from './_lib/packages.js'

export default async function handler(req, res) {
  if (cors(req, res)) return

  const active = await getActiveCustomerSession(req)
  if (!active) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' })

  if (req.method === 'GET') {
    return handleGetProfile(req, res, active.customer)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGetProfile(req, res, customer) {
  try {
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
