import { getSupabase, isValidUuid } from './_lib/supabase.js'
import { requirePermission } from './_lib/auth.js'
import { cors } from './_lib/cors.js'
import { logActivity } from './notifications.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STATUSES = ['yeni', 'iletisime-gecildi', 'teklif', 'kazandi', 'odendi', 'kaybedildi']

function cleanText(value, max = 200) {
  return String(value || '').trim().slice(0, max)
}

function mapReferral(r) {
  if (!r) return r
  return {
    _id: r.id,
    id: r.id,
    referrerName: r.referrer_name,
    referrerEmail: r.referrer_email,
    referrerPhone: r.referrer_phone,
    leadName: r.lead_name,
    leadEmail: r.lead_email,
    leadPhone: r.lead_phone,
    leadCompany: r.lead_company,
    service: r.service,
    notes: r.notes,
    reward: r.reward,
    status: r.status,
    source: r.source,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export default async function handler(req, res) {
  if (cors(req, res)) return

  const supabase = getSupabase()

  if (req.method === 'GET') {
    if (!(await requirePermission(req, res, 'referrals'))) return

    const { status } = req.query || {}
    let query = supabase.from('kade_referrals').select('*').order('created_at', { ascending: false }).limit(250)
    if (status && status !== 'all') query = query.eq('status', status)
    const { data: referrals, error } = await query
    if (error) throw error
    return res.status(200).json(referrals.map(mapReferral))
  }

  if (req.method === 'POST') {
    const user = await requirePermission(req, res, 'referrals', { write: true })
    if (!user) return

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
      referrer_name: cleanText(referrerName, 120),
      referrer_email: cleanText(referrerEmail, 254).toLowerCase(),
      referrer_phone: cleanText(referrerPhone, 30),
      lead_name: cleanText(leadName, 120),
      lead_email: cleanText(leadEmail, 254).toLowerCase(),
      lead_phone: cleanText(leadPhone, 30),
      lead_company: cleanText(leadCompany, 120),
      service: cleanText(service, 120),
      notes: cleanText(notes, 1000),
      reward: 0,
      status: 'yeni',
      source: 'referral-program',
    }

    const { data: created, error } = await supabase.from('kade_referrals').insert(referral).select().single()
    if (error) throw error

    const { error: msgError } = await supabase.from('kade_messages').insert({
      name: created.lead_name,
      email: created.lead_email || created.referrer_email,
      phone: created.lead_phone || created.referrer_phone || '-',
      company: created.lead_company || '-',
      service: created.service || 'Referral Programı',
      message: `Referral lead: ${created.lead_name}\nÖneren: ${created.referrer_name} (${created.referrer_email})\nNot: ${created.notes || '-'}`,
      source: 'referral-program',
      status: 'yeni',
      read: false,
    })
    if (msgError) throw msgError

    logActivity({
      action: 'Yeni referral lead',
      detail: `${created.referrer_name} -> ${created.lead_name}`,
      type: 'message',
      icon: '↗',
      user: user.username,
    }).catch(() => {})

    return res.status(201).json({ success: true, referral: mapReferral(created) })
  }

  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'referrals', { write: true })
    if (!user) return

    const { id, status, reward, notes } = req.body || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Geçersiz durum' })

    const updates = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (reward !== undefined) updates.reward = Number(reward) || 0
    if (notes !== undefined) updates.notes = cleanText(notes, 1000)

    const { data, error } = await supabase.from('kade_referrals').update(updates).eq('id', id).select()
    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ error: 'Referral kaydı bulunamadı' })

    logActivity({
      action: 'Referral güncellendi',
      detail: `${id} ${status || ''}`,
      type: 'update',
      icon: '↗',
      user: user.username,
    }).catch(() => {})

    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    if (!(await requirePermission(req, res, 'referrals', { write: true }))) return

    const { id } = req.query || {}
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' })
    const { error } = await supabase.from('kade_referrals').delete().eq('id', id)
    if (error) throw error
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
