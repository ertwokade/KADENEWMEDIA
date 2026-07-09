import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

// Route: /api/client?resource=subscriptions|surveys

function makeTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cleanHeader(str, max = 200) {
  return String(str || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

// ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
async function handleSubscriptions(req, res, db, user) {
  const col = db.collection('subscriptions');

  if (req.method === 'GET') {
    const { id, status, dueThisMont } = req.query;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const item = await col.findOne({ _id: new ObjectId(id) });
      if (!item) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      return res.json(item);
    }
    const filter = {};
    if (status) filter.status = status;
    if (dueThisMont === 'true') {
      const now = new Date();
      filter.nextRenewalDate = { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    }
    const items = await col.find(filter).sort({ nextRenewalDate: 1 }).toArray();
    const today = new Date();
    return res.json(items.map(item => item.nextRenewalDate
      ? { ...item, daysUntilRenewal: Math.ceil((new Date(item.nextRenewalDate) - today) / 86400000) }
      : item
    ));
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, clientPhone, clientCompany, services, monthlyAmount, currency, startDate, notes, contactMessageId } = req.body;
    if (!clientName || !monthlyAmount) return res.status(400).json({ error: 'Müşteri adı ve aylık tutar zorunludur' });
    const start = startDate ? new Date(startDate) : new Date();
    const nextRenewal = new Date(start);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    const subscription = {
      clientName: String(clientName).slice(0, 100),
      clientEmail: String(clientEmail || '').slice(0, 200),
      clientPhone: String(clientPhone || '').slice(0, 20),
      clientCompany: String(clientCompany || '').slice(0, 100),
      services: Array.isArray(services) ? services.slice(0, 10).map(s => String(s).slice(0, 100)) : [],
      monthlyAmount: Number(monthlyAmount) || 0,
      currency: String(currency || 'TRY').slice(0, 5),
      startDate: start,
      nextRenewalDate: nextRenewal,
      notes: String(notes || '').slice(0, 500),
      contactMessageId: contactMessageId ? String(contactMessageId).slice(0, 50) : null,
      status: 'aktif',
      paymentHistory: [],
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await col.insertOne(subscription);
    subscription._id = result.insertedId;
    return res.status(201).json(subscription);
  }

  if (req.method === 'PUT') {
    const { id, action, ...updates } = req.body;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    if (action === 'record-payment') {
      const { amount, date, note } = updates;
      const payment = { amount: Number(amount) || 0, date: date ? new Date(date) : new Date(), note: String(note || '').slice(0, 200), recordedBy: user.username };
      const sub = await col.findOne({ _id: new ObjectId(id) });
      if (!sub) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      const nextRenewal = new Date(sub.nextRenewalDate || new Date());
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      await col.updateOne({ _id: new ObjectId(id) }, { $push: { paymentHistory: payment }, $set: { nextRenewalDate: nextRenewal, updatedAt: new Date() } });
      return res.json({ success: true, nextRenewalDate: nextRenewal });
    }
    const allowed = ['clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'services', 'monthlyAmount', 'currency', 'status', 'notes', 'nextRenewalDate'];
    const safeUpdates = {};
    for (const key of allowed) { if (updates[key] !== undefined) safeUpdates[key] = updates[key]; }
    safeUpdates.updatedAt = new Date();
    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: safeUpdates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Abonelik bulunamadı' });
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── SURVEYS ────────────────────────────────────────────────────────────────
async function handleSurveys(req, res, db, user) {
  const col = db.collection('surveys');

  if (req.method === 'GET') {
    const { token, stats } = req.query;
    if (token) {
      const item = await col.findOne({ token: String(token) });
      return item ? res.json(item) : res.status(404).json({ error: 'Bulunamadı' });
    }
    if (stats === 'true') {
      const all = await col.find({ completedAt: { $exists: true } }).toArray();
      if (all.length === 0) return res.json({ avgScore: 0, npsScore: 0, total: 0, categories: {} });
      const avgScore = all.reduce((s, i) => s + i.score, 0) / all.length;
      const promoters = all.filter(i => i.score >= 9).length;
      const detractors = all.filter(i => i.score <= 6).length;
      return res.json({
        avgScore: Math.round(avgScore * 10) / 10,
        npsScore: Math.round(((promoters - detractors) / all.length) * 100),
        total: all.length,
        categories: {
          destekci: all.filter(i => i.category === 'destekci').length,
          pasif: all.filter(i => i.category === 'pasif').length,
          kizgin: all.filter(i => i.category === 'kizgin').length,
        },
      });
    }
    return res.json(await col.find({}).sort({ createdAt: -1 }).limit(100).toArray());
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, clientCompany, projectName } = req.body;
    if (!clientName || !clientEmail) return res.status(400).json({ error: 'Müşteri adı ve e-posta zorunludur' });
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const survey = {
      clientName: String(clientName).slice(0, 100),
      clientEmail: String(clientEmail).slice(0, 200),
      clientCompany: String(clientCompany || '').slice(0, 100),
      projectName: String(projectName || '').slice(0, 100),
      token,
      score: null, category: null, comment: null,
      sentBy: user.username,
      createdAt: new Date(), completedAt: null,
    };
    await col.insertOne(survey);
    const surveyUrl = `${process.env.SITE_URL || 'https://kademedia.com'}/anket/${token}`;
    const transporter = makeTransporter();
    if (transporter) {
      const html = `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto"><div style="background:#111;padding:28px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#eac321;margin:0">kade<span style="color:#fff">media</span></h1></div><div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none"><h2 style="color:#111">Memnuniyet Anketimiz</h2><p>Sayın ${escapeHtml(clientName)},</p><p>${projectName ? `<strong>${escapeHtml(projectName)}</strong> projemizin` : 'Çalışmamızın'} tamamlanmasının ardından görüşleriniz bizim için değerli.</p><div style="text-align:center;margin:28px 0"><a href="${surveyUrl}" style="background:#eac321;color:#111;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Anketi Doldurun (1 dakika)</a></div></div></div>`;
        try { await transporter.sendMail({ from: `"Kade Media" <${process.env.SMTP_USER}>`, to: clientEmail, subject: cleanHeader('Hizmet Değerlendirme — Kade Media'), html }); } catch (e) { console.error('Anket gönderim hatası:', e.message); }
    }
    return res.status(201).json({ success: true, token, surveyUrl });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (cors(req, res)) return;

  // Survey submit is public (token-based)
  if (req.method === 'POST' && req.query.action === 'submit') {
    const db = await getDb();
    const col = db.collection('surveys');
    const { token, score, comment } = req.body;
    if (!token || score === undefined) return res.status(400).json({ error: 'Token ve puan zorunludur' });
    const npsScore = parseInt(score);
    if (isNaN(npsScore) || npsScore < 0 || npsScore > 10) return res.status(400).json({ error: 'Puan 0-10 arasında olmalıdır' });
    const survey = await col.findOne({ token: String(token) });
    if (!survey) return res.status(404).json({ error: 'Anket bulunamadı veya süresi dolmuş' });
    if (survey.completedAt) return res.status(409).json({ error: 'Bu anket zaten doldurulmuş' });
    let category = 'pasif';
    if (npsScore >= 9) category = 'destekci';
    else if (npsScore <= 6) category = 'kizgin';
    await col.updateOne({ token: String(token) }, { $set: { score: npsScore, category, comment: String(comment || '').slice(0, 500), completedAt: new Date() } });
    if (npsScore <= 6 && process.env.MAIL_TO) {
      const transporter = makeTransporter();
      if (transporter) {
        try { await transporter.sendMail({ from: `"Kade Media" <${process.env.SMTP_USER}>`, to: process.env.MAIL_TO, subject: cleanHeader(`⚠️ Düşük NPS Puanı: ${npsScore}/10 — ${survey.clientName}`), html: `<p>Müşteri <strong>${escapeHtml(survey.clientName)}</strong> NPS anketi için <strong>${npsScore}/10</strong> verdi.</p><p>Kategori: ${category}</p>${comment ? `<p>Yorum: ${escapeHtml(String(comment))}</p>` : ''}` }); } catch (e) { console.error('NPS bildirim hatası:', e.message); }
      }
    }
    return res.json({ success: true, message: 'Yanıtınız kaydedildi, teşekkür ederiz!' });
  }

  const db = await getDb();
  const { resource } = req.query;
  const permission = resource === 'surveys' ? 'surveys' : resource === 'subscriptions' ? 'subscriptions' : 'crm';
  const user = await requirePermission(req, res, permission, { write: req.method !== 'GET' });
  if (!user) return;

  if (resource === 'subscriptions') return handleSubscriptions(req, res, db, user);
  if (resource === 'surveys') return handleSurveys(req, res, db, user);

  return res.status(400).json({ error: 'resource parametresi gerekli: subscriptions | surveys' });
}
