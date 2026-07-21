import nodemailer from 'nodemailer';
import { getSupabase, isValidUuid } from './_lib/supabase.js';
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

function mapPayment(row) {
  if (!row) return row;
  return {
    amount: row.amount,
    date: row.date,
    note: row.note,
    recordedBy: row.recorded_by,
  };
}

function mapSubscription(row, payments = []) {
  if (!row) return row;
  return {
    _id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientCompany: row.client_company,
    services: row.services,
    monthlyAmount: row.monthly_amount,
    currency: row.currency,
    startDate: row.start_date,
    nextRenewalDate: row.next_renewal_date,
    notes: row.notes,
    contactMessageId: row.contact_message_id,
    status: row.status,
    paymentHistory: payments.map(mapPayment),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSurvey(row) {
  if (!row) return row;
  return {
    _id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientCompany: row.client_company,
    projectName: row.project_name,
    token: row.token,
    score: row.score,
    category: row.category,
    comment: row.comment,
    sentBy: row.sent_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

async function fetchPaymentsFor(supabase, subscriptionIds) {
  if (subscriptionIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('kade_subscription_payments')
    .select('*')
    .in('subscription_id', subscriptionIds);
  if (error) throw error;
  const map = new Map();
  for (const payment of data) {
    if (!map.has(payment.subscription_id)) map.set(payment.subscription_id, []);
    map.get(payment.subscription_id).push(payment);
  }
  return map;
}

// ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
async function handleSubscriptions(req, res, supabase, user) {
  if (req.method === 'GET') {
    const { id, status, dueThisMont } = req.query;
    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { data, error } = await supabase.from('kade_subscriptions').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      const { data: payments, error: payError } = await supabase
        .from('kade_subscription_payments')
        .select('*')
        .eq('subscription_id', id);
      if (payError) throw payError;
      return res.json(mapSubscription(data, payments));
    }
    let query = supabase.from('kade_subscriptions').select('*').order('next_renewal_date', { ascending: true });
    if (status) query = query.eq('status', status);
    if (dueThisMont === 'true') {
      const now = new Date();
      query = query
        .gte('next_renewal_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .lte('next_renewal_date', new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString());
    }
    const { data: items, error } = await query;
    if (error) throw error;
    const paymentsMap = await fetchPaymentsFor(supabase, items.map(item => item.id));
    const today = new Date();
    return res.json(items.map(item => {
      const mapped = mapSubscription(item, paymentsMap.get(item.id) || []);
      return item.next_renewal_date
        ? { ...mapped, daysUntilRenewal: Math.ceil((new Date(item.next_renewal_date) - today) / 86400000) }
        : mapped;
    }));
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, clientPhone, clientCompany, services, monthlyAmount, currency, startDate, notes, contactMessageId } = req.body;
    if (!clientName || !monthlyAmount) return res.status(400).json({ error: 'Müşteri adı ve aylık tutar zorunludur' });
    const start = startDate ? new Date(startDate) : new Date();
    const nextRenewal = new Date(start);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    const subscriptionInsert = {
      client_name: String(clientName).slice(0, 100),
      client_email: String(clientEmail || '').slice(0, 200),
      client_phone: String(clientPhone || '').slice(0, 20),
      client_company: String(clientCompany || '').slice(0, 100),
      services: Array.isArray(services) ? services.slice(0, 10).map(s => String(s).slice(0, 100)) : [],
      monthly_amount: Number(monthlyAmount) || 0,
      currency: String(currency || 'TRY').slice(0, 5),
      start_date: start,
      next_renewal_date: nextRenewal,
      notes: String(notes || '').slice(0, 500),
      contact_message_id: contactMessageId ? String(contactMessageId).slice(0, 50) : null,
      status: 'aktif',
      created_by: user.username,
    };
    const { data, error } = await supabase.from('kade_subscriptions').insert(subscriptionInsert).select().single();
    if (error) throw error;
    return res.status(201).json(mapSubscription(data, []));
  }

  if (req.method === 'PUT') {
    const { id, action, ...updates } = req.body;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    if (action === 'record-payment') {
      const { amount, date, note } = updates;
      const { data: sub, error: subError } = await supabase.from('kade_subscriptions').select('*').eq('id', id).maybeSingle();
      if (subError) throw subError;
      if (!sub) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      const nextRenewal = new Date(sub.next_renewal_date || new Date());
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      const payment = {
        subscription_id: id,
        amount: Number(amount) || 0,
        date: date ? new Date(date) : new Date(),
        note: String(note || '').slice(0, 200),
        recorded_by: user.username,
      };
      const { error: payError } = await supabase.from('kade_subscription_payments').insert(payment);
      if (payError) throw payError;
      const { error: updateError } = await supabase
        .from('kade_subscriptions')
        .update({ next_renewal_date: nextRenewal, updated_at: new Date() })
        .eq('id', id);
      if (updateError) throw updateError;
      return res.json({ success: true, nextRenewalDate: nextRenewal });
    }
    const allowed = ['clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'services', 'monthlyAmount', 'currency', 'status', 'notes', 'nextRenewalDate'];
    const columnMap = { clientName: 'client_name', clientEmail: 'client_email', clientPhone: 'client_phone', clientCompany: 'client_company', services: 'services', monthlyAmount: 'monthly_amount', currency: 'currency', status: 'status', notes: 'notes', nextRenewalDate: 'next_renewal_date' };
    const safeUpdates = {};
    for (const key of allowed) { if (updates[key] !== undefined) safeUpdates[columnMap[key]] = updates[key]; }
    safeUpdates.updated_at = new Date();
    const { data, error } = await supabase.from('kade_subscriptions').update(safeUpdates).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Abonelik bulunamadı' });
    return res.json({ success: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_subscriptions').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── SURVEYS ────────────────────────────────────────────────────────────────
async function handleSurveys(req, res, supabase, user) {
  if (req.method === 'GET') {
    const { token, stats } = req.query;
    if (token) {
      const { data, error } = await supabase.from('kade_surveys').select('*').eq('token', String(token)).maybeSingle();
      if (error) throw error;
      return data ? res.json(mapSurvey(data)) : res.status(404).json({ error: 'Bulunamadı' });
    }
    if (stats === 'true') {
      // Mongo eşdeğeri: { completedAt: { $exists: true } } — alan her belgede mevcut
      // olduğundan (null olsa bile) tüm kayıtlar eşleşir; davranış aynen korunuyor.
      const { data: all, error } = await supabase.from('kade_surveys').select('*');
      if (error) throw error;
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
    const { data: items, error } = await supabase.from('kade_surveys').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return res.json(items.map(mapSurvey));
  }

  if (req.method === 'POST') {
    const { clientName, clientEmail, clientCompany, projectName } = req.body;
    if (!clientName || !clientEmail) return res.status(400).json({ error: 'Müşteri adı ve e-posta zorunludur' });
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const surveyInsert = {
      client_name: String(clientName).slice(0, 100),
      client_email: String(clientEmail).slice(0, 200),
      client_company: String(clientCompany || '').slice(0, 100),
      project_name: String(projectName || '').slice(0, 100),
      token,
      score: null, category: null, comment: null,
      sent_by: user.username,
      completed_at: null,
    };
    const { error } = await supabase.from('kade_surveys').insert(surveyInsert);
    if (error) throw error;
    const surveyUrl = `${process.env.SITE_URL || 'https://kadenewmedia.com'}/anket/${token}`;
    const transporter = makeTransporter();
    if (transporter) {
      const html = `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto"><div style="background:#111;padding:28px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:#eac321;margin:0">kade<span style="color:#fff">media</span></h1></div><div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none"><h2 style="color:#111">Memnuniyet Anketimiz</h2><p>Sayın ${escapeHtml(clientName)},</p><p>${projectName ? `<strong>${escapeHtml(projectName)}</strong> projemizin` : 'Çalışmamızın'} tamamlanmasının ardından görüşleriniz bizim için değerli.</p><div style="text-align:center;margin:28px 0"><a href="${surveyUrl}" style="background:#eac321;color:#111;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Anketi Doldurun (1 dakika)</a></div></div></div>`;
        try { await transporter.sendMail({ from: `"Kade Media" <${process.env.SMTP_USER}>`, to: clientEmail, subject: cleanHeader('Hizmet Değerlendirme — Kade Media'), html }); } catch (e) { console.error('Anket gönderim hatası:', e.message); }
    }
    return res.status(201).json({ success: true, token, surveyUrl });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_surveys').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── MAIN HANDLER ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (cors(req, res)) return;

  const supabase = getSupabase();

  // Survey submit is public (token-based)
  if (req.method === 'POST' && req.query.action === 'submit') {
    const { token, score, comment } = req.body;
    if (!token || score === undefined) return res.status(400).json({ error: 'Token ve puan zorunludur' });
    const npsScore = parseInt(score);
    if (isNaN(npsScore) || npsScore < 0 || npsScore > 10) return res.status(400).json({ error: 'Puan 0-10 arasında olmalıdır' });
    const { data: survey, error: surveyError } = await supabase.from('kade_surveys').select('*').eq('token', String(token)).maybeSingle();
    if (surveyError) throw surveyError;
    if (!survey) return res.status(404).json({ error: 'Anket bulunamadı veya süresi dolmuş' });
    if (survey.completed_at) return res.status(409).json({ error: 'Bu anket zaten doldurulmuş' });
    let category = 'pasif';
    if (npsScore >= 9) category = 'destekci';
    else if (npsScore <= 6) category = 'kizgin';
    const { error: updateError } = await supabase
      .from('kade_surveys')
      .update({ score: npsScore, category, comment: String(comment || '').slice(0, 500), completed_at: new Date() })
      .eq('token', String(token));
    if (updateError) throw updateError;
    if (npsScore <= 6 && process.env.MAIL_TO) {
      const transporter = makeTransporter();
      if (transporter) {
        try { await transporter.sendMail({ from: `"Kade Media" <${process.env.SMTP_USER}>`, to: process.env.MAIL_TO, subject: cleanHeader(`⚠️ Düşük NPS Puanı: ${npsScore}/10 — ${survey.client_name}`), html: `<p>Müşteri <strong>${escapeHtml(survey.client_name)}</strong> NPS anketi için <strong>${npsScore}/10</strong> verdi.</p><p>Kategori: ${category}</p>${comment ? `<p>Yorum: ${escapeHtml(String(comment))}</p>` : ''}` }); } catch (e) { console.error('NPS bildirim hatası:', e.message); }
      }
    }
    return res.json({ success: true, message: 'Yanıtınız kaydedildi, teşekkür ederiz!' });
  }

  const { resource } = req.query;
  const permission = resource === 'surveys' ? 'surveys' : resource === 'subscriptions' ? 'subscriptions' : 'crm';
  const user = await requirePermission(req, res, permission, { write: req.method !== 'GET' });
  if (!user) return;

  if (resource === 'subscriptions') return handleSubscriptions(req, res, supabase, user);
  if (resource === 'surveys') return handleSurveys(req, res, supabase, user);

  return res.status(400).json({ error: 'resource parametresi gerekli: subscriptions | surveys' });
}
