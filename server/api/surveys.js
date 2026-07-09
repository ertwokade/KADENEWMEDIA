import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requirePermission } from './_lib/auth.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { cors } from './_lib/cors.js';

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

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const col = db.collection('surveys');

  // Public: Submit survey response (no auth required — token-based access)
  if (req.method === 'POST' && req.query.action === 'submit') {
    const rl = await rateLimitCheck(req, { namespace: 'survey-submit', windowMs: 60 * 60 * 1000, maxRequests: 30 });
    if (!rl.allowed) return res.status(429).json({ error: `Çok fazla istek. ${rl.retryAfter} dakika sonra tekrar deneyin.` });
    const { token, score, comment } = req.body;
    if (!token || score === undefined) {
      return res.status(400).json({ error: 'Token ve puan zorunludur' });
    }
    const npsScore = parseInt(score);
    if (isNaN(npsScore) || npsScore < 0 || npsScore > 10) {
      return res.status(400).json({ error: 'Puan 0-10 arasında olmalıdır' });
    }

    const survey = await col.findOne({ token: String(token) });
    if (!survey) return res.status(404).json({ error: 'Anket bulunamadı veya süresi dolmuş' });
    if (survey.completedAt) return res.status(409).json({ error: 'Bu anket zaten doldurulmuş' });

    let category = 'pasif';
    if (npsScore >= 9) category = 'destekci';
    else if (npsScore <= 6) category = 'kizgin';

    await col.updateOne(
      { token: String(token) },
      {
        $set: {
          score: npsScore,
          category,
          comment: String(comment || '').slice(0, 500),
          completedAt: new Date(),
        },
      }
    );

    // Notify admin if low score
    if (npsScore <= 6 && process.env.MAIL_TO) {
      const transporter = makeTransporter();
      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"Kade Media" <${process.env.SMTP_USER}>`,
            to: process.env.MAIL_TO,
            subject: cleanHeader(`⚠️ Düşük NPS Puanı: ${npsScore}/10 — ${survey.clientName}`),
            html: `<p>Müşteri <strong>${escapeHtml(survey.clientName)}</strong> NPS anketi için <strong>${npsScore}/10</strong> verdi.</p><p>Kategori: ${category}</p>${comment ? `<p>Yorum: ${escapeHtml(comment)}</p>` : ''}`,
          });
        } catch (e) {
          console.error('NPS bildirim hatası:', e.message);
        }
      }
    }

    return res.json({ success: true, message: 'Yanıtınız kaydedildi, teşekkür ederiz!' });
  }

  // Auth required for all other actions
  const user = await requirePermission(req, res, 'surveys', { write: req.method !== 'GET' });
  if (!user) return;

  // GET — list surveys with results
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
      const npsScore = Math.round(((promoters - detractors) / all.length) * 100);

      return res.json({
        avgScore: Math.round(avgScore * 10) / 10,
        npsScore,
        total: all.length,
        categories: {
          destekci: all.filter(i => i.category === 'destekci').length,
          pasif: all.filter(i => i.category === 'pasif').length,
          kizgin: all.filter(i => i.category === 'kizgin').length,
        },
      });
    }

    const items = await col.find({}).sort({ createdAt: -1 }).limit(100).toArray();
    return res.json(items);
  }

  // POST — send survey to client
  if (req.method === 'POST') {
    const { clientName, clientEmail, clientCompany, projectName } = req.body;
    if (!clientName || !clientEmail) {
      return res.status(400).json({ error: 'Müşteri adı ve e-posta zorunludur' });
    }

    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const survey = {
      clientName: String(clientName).slice(0, 100),
      clientEmail: String(clientEmail).slice(0, 200),
      clientCompany: String(clientCompany || '').slice(0, 100),
      projectName: String(projectName || '').slice(0, 100),
      token,
      score: null,
      category: null,
      comment: null,
      sentBy: user.username,
      createdAt: new Date(),
      completedAt: null,
    };

    await col.insertOne(survey);

    const surveyUrl = `${process.env.SITE_URL || 'https://kademedia.com'}/anket/${token}`;
    const transporter = makeTransporter();
    if (transporter) {
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto">
          <div style="background:#111;padding:28px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:#eac321;margin:0">kade<span style="color:#fff">media</span></h1>
          </div>
          <div style="padding:32px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #eee;border-top:none">
            <h2 style="color:#111">Memnuniyet Anketimiz</h2>
            <p>Sayın ${escapeHtml(clientName)},</p>
            <p>${projectName ? `<strong>${escapeHtml(projectName)}</strong> projemizin` : 'Çalışmamızın'} tamamlanmasının ardından görüşleriniz bizim için çok değerli.</p>
            <p style="color:#555">Kade Media ile çalışma deneyiminizi 0-10 arasında değerlendirin:</p>
            <div style="text-align:center;margin:28px 0">
              <a href="${surveyUrl}" style="background:#eac321;color:#111;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:1rem">Anketi Doldurun (1 dakika)</a>
            </div>
            <p style="color:#999;font-size:0.8rem">Geri bildiriminiz ürün ve hizmetlerimizi geliştirmemize yardımcı olur.</p>
          </div>
        </div>
      `;
      try {
        await transporter.sendMail({
          from: `"Kade Media" <${process.env.SMTP_USER}>`,
          to: clientEmail,
          subject: cleanHeader('Hizmet Değerlendirme — Kade Media'),
          html,
        });
      } catch (e) {
        console.error('Anket gönderim hatası:', e.message);
      }
    }

    return res.status(201).json({ success: true, token, surveyUrl });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
