import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getDb } from './_lib/mongodb.js'
import { getDefaultPermissions, requireAdmin } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
}

function timingSafeEqualString(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export default async function handler(req, res) {
  if (cors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (isProductionRuntime() && process.env.SEED_ENDPOINT_ENABLED !== 'true') {
    return res.status(404).json({ error: 'Not found' })
  }

  const limit = await rateLimitCheck(req, { namespace: 'seed', windowMs: 60 * 60 * 1000, maxRequests: 3 })
  if (!limit.allowed) return res.status(429).json({ error: 'Too many requests' })

  const seedSecret = process.env.SEED_SECRET
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedSecret || !adminPassword) return res.status(503).json({ error: 'Seed configuration is incomplete' })
  if (!timingSafeEqualString(req.body?.secret, seedSecret)) return res.status(403).json({ error: 'Forbidden' })

  const db = await getDb()
  const users = db.collection('users')
  const userCount = await users.countDocuments()
  if (userCount > 0 && !(await requireAdmin(req, res))) return

  await users.createIndex({ username: 1 }, { unique: true })
  const existingAdmin = await users.findOne({ username: 'kade' })
  if (!existingAdmin) {
    await users.insertOne({
      username: 'kade',
      password: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
      permissions: getDefaultPermissions('admin'),
      createdAt: new Date(),
    })
  }

  return res.status(200).json({
    seeded: { admin: existingAdmin ? 'existing' : 'created' },
    note: 'No demo customers, partners, posts, metrics, or public content were inserted.',
  })
}
