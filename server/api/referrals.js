import { ObjectId } from 'mongodb'
import { getDb, isValidObjectId } from './_lib/mongodb.js'
import { requireAuth } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { rateLimitCheck } from './_lib/rateLimit.js'
import { logActivity } from './notifications.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STATUSES = ['yeni', 'iletisime-gecildi', 'teklif', 'kazandi', 'odendi', 'kaybedildi']

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max)
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const db = await getDb()
  const collection = db.collection('referrals')

  if (req.method === 'GET') {
    const user = requireAuth(req)
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' })

    const { status } = req.query || {}
    const filter = status && status !== 'all' ? { status } : {}
    const referrals = await collection.find(filter).sort({ createdAt: -1 }).limit(250).toArray()
    return res.status(200).json(referrals)
  }

  if (req.method === 'POST') {
    const rl = rateLimitCheck(req)
    if (!rl.allowed) {
      return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` })
    }

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }

    const {
      referrerName,
      referrerEmail,
      referrerPhone,
      leadName,
      leadEmail,
      leadPhone,
      leadCompany,
      service,
      notes,
    } = body || {}

    if (!cleanText(referrerName, 120) || !cleanText(referrerEmail, 254) || !cleanText(leadName, 120)) {
      return res.status(400).json({ error: 'Adınız, e-postanız ve önerilen kişi adı zorunludur.' })
    }
    if (!EMAIL_RE.test(referrerEmail)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' })
    if (leadEmail && !EMAIL_RE.test(leadEmail)) return res.status(400).json({ error: 'Önerilen kişinin e-postası geçerli değil.' })

    const referral = {
      referrerName: cleanText(referrerName, 120),
      referrerEmail: cleanText(referrerEmail, 254).toLowerCase(),
      referrerPhone: cleanText(referrerPhone, 30),
      leadName: cleanText(leadName, 120),
      leadEmail: cleanText(leadEmail, 254).toLowerCase(),
      leadPhone: cleanText(leadPhone, 30),
      leadCompany: cleanText(leadCompany, 120),
      service: cleanText(service, 120),
      notes: cleanText(notes, 1000),
      reward: 0,
      status: 'yeni',
      source: 'referral-program',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(referral)
    referral._id = result.insertedId

    await db.collection('messages').insertOne({
      name: referral.leadName,
      email: referral.leadEmail || referral.referrerEmail,
      phone: referral.leadPhone || referral.referrerPhone || '-',
      company: referral.leadCompany || '-',
      service: referral.service || 'Referral Programı',
      message: `Referral lead: ${referral.leadName}\nÖneren: ${referral.referrerName} (${referral.referrerEmail})\nNot: ${referral.notes || '-'}`,
      source: 'referral-program',
      status: 'yeni',
      read: false,
      createdAt: new Date(),
    })

    logActivity(db, {
      action: 'Yeni referral lead',
      detail: `${referral.referrerName} -> ${referral.leadName}`,
      type: 'message',
      icon: '↗',
      user: 'sistem',
    }).catch(() => {})

    return res.status(201).json({ success: true, referral })
  }

  if (req.method === 'PUT') {
    const user = requireAuth(req)
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' })

    const { id, status, reward, notes } = req.body || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Geçersiz durum' })

    const updates = { updatedAt: new Date() }
    if (status) updates.status = status
    if (reward !== undefined) updates.reward = Number(reward) || 0
    if (notes !== undefined) updates.notes = cleanText(notes, 1000)

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates })
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Referral kaydı bulunamadı' })

    logActivity(db, {
      action: 'Referral güncellendi',
      detail: `${id} ${status || ''}`,
      type: 'update',
      icon: '↗',
      user: user.username,
    }).catch(() => {})

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const user = requireAuth(req)
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' })

    const { id } = req.query || {}
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    await collection.deleteOne({ _id: new ObjectId(id) })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
