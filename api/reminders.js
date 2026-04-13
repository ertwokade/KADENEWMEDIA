import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';
import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

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
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('reminders');
  const action = req.query?.action;

  // ── Cron: Zamanı gelen hatırlatıcıları gönder (auth VEYA CRON_SECRET) ──
  if (action === 'check') {
    const user = requireAuth(req);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    if (!user && !isCron) return res.status(401).json({ error: 'Yetkisiz erişim' });

    const now = new Date();
    const pending = await collection.find({
      status: 'active',
      remindAt: { $lte: now },
    }).toArray();

    if (pending.length === 0) return res.status(200).json({ sent: 0 });

    const transporter = makeTransporter();
    let sentCount = 0;

    for (const reminder of pending) {
      // E-posta gönder
      if (transporter && reminder.email) {
        try {
          const priorityColors = { low: '#2ECC71', medium: '#eac321', high: '#E91E63' };
          const priorityLabels = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
          const color = priorityColors[reminder.priority] || '#eac321';
          const label = priorityLabels[reminder.priority] || 'Orta';

          await transporter.sendMail({
            from: `"Kade Media Hatırlatıcı" <${process.env.SMTP_USER}>`,
            to: reminder.email,
            subject: `⏰ Hatırlatıcı: ${reminder.title}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
                <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
                  <h1 style="color:#eac321;margin:0;">⏰ Hatırlatıcı</h1>
                  <p style="color:#888;margin:8px 0 0">Kade Media Admin</p>
                </div>
                <div style="padding:30px 20px;">
                  <h2 style="color:#fff;margin:0 0 16px;">${escapeHtml(reminder.title)}</h2>
                  ${reminder.description ? `<p style="color:#ccc;line-height:1.8;margin:0 0 16px;padding:14px;background:#1a1a1a;border-radius:8px;border-left:3px solid ${color};">${escapeHtml(reminder.description)}</p>` : ''}
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:8px 0;color:#888;width:120px;">Öncelik</td><td style="padding:8px 0;color:${color};font-weight:600;">${label}</td></tr>
                    <tr><td style="padding:8px 0;color:#888;">Tarih</td><td style="padding:8px 0;color:#fff;">${new Date(reminder.remindAt).toLocaleString('tr-TR')}</td></tr>
                    ${reminder.category ? `<tr><td style="padding:8px 0;color:#888;">Kategori</td><td style="padding:8px 0;color:#fff;">${escapeHtml(reminder.category)}</td></tr>` : ''}
                  </table>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="https://kademedia.com.tr/admin" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Admin Paneline Git</a>
                  </div>
                </div>
                <div style="text-align:center;padding:16px;border-top:1px solid #333;">
                  <p style="color:#666;font-size:12px;margin:0;">Bu e-posta Kade Media hatırlatıcı sistemi tarafından gönderilmiştir.</p>
                </div>
              </div>
            `,
          });
          sentCount++;
        } catch (err) {
          console.error('Reminder email failed:', err.message);
        }
      }

      // Tekrarlayan mı?
      if (reminder.repeat && reminder.repeat !== 'none') {
        const next = new Date(reminder.remindAt);
        if (reminder.repeat === 'daily') next.setDate(next.getDate() + 1);
        else if (reminder.repeat === 'weekly') next.setDate(next.getDate() + 7);
        else if (reminder.repeat === 'monthly') next.setMonth(next.getMonth() + 1);

        await collection.updateOne(
          { _id: reminder._id },
          { $set: { remindAt: next, lastSentAt: now } }
        );
      } else {
        await collection.updateOne(
          { _id: reminder._id },
          { $set: { status: 'sent', lastSentAt: now } }
        );
      }
    }

    return res.status(200).json({ sent: sentCount, total: pending.length });
  }

  // Diğer endpointler için auth zorunlu
  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  // ── GET — Tüm hatırlatıcıları getir ──
  if (req.method === 'GET') {
    const status = req.query?.status;
    const filter = status && status !== 'all' ? { status } : {};
    const reminders = await collection.find(filter).sort({ remindAt: 1 }).toArray();
    return res.status(200).json(reminders);
  }

  // ── POST — Yeni hatırlatıcı oluştur ──
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    const { title, description, remindAt, email, priority, category, repeat } = body || {};
    if (!title?.trim() || !remindAt) {
      return res.status(400).json({ error: 'Başlık ve hatırlatma zamanı zorunludur.' });
    }

    const reminder = {
      title: title.trim(),
      description: description?.trim() || '',
      remindAt: new Date(remindAt),
      email: email?.trim() || process.env.MAIL_TO || 'thekademedia@gmail.com',
      priority: priority || 'medium',
      category: category?.trim() || '',
      repeat: repeat || 'none',
      status: 'active',
      createdBy: user.username,
      createdAt: new Date(),
      lastSentAt: null,
    };

    const result = await collection.insertOne(reminder);
    logActivity(db, { action: 'Yeni hatırlatıcı oluşturuldu', detail: title.trim(), type: 'create', icon: '⏰', user: user.username }).catch(() => {});
    return res.status(201).json({ ...reminder, _id: result.insertedId });
  }

  // ── PUT — Hatırlatıcı güncelle ──
  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    const { id, title, description, remindAt, email, priority, category, repeat, status } = body || {};
    if (!id) return res.status(400).json({ error: 'id gerekli' });

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (remindAt !== undefined) update.remindAt = new Date(remindAt);
    if (email !== undefined) update.email = email.trim();
    if (priority !== undefined) update.priority = priority;
    if (category !== undefined) update.category = category.trim();
    if (repeat !== undefined) update.repeat = repeat;
    if (status !== undefined) update.status = status;
    update.updatedAt = new Date();

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    logActivity(db, { action: 'Hatırlatıcı güncellendi', detail: title || id, type: 'update', icon: '⏰', user: user.username }).catch(() => {});
    return res.status(200).json({ success: true });
  }

  // ── DELETE — Hatırlatıcı sil ──
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: 'id gerekli' });
    await collection.deleteOne({ _id: new ObjectId(id) });
    logActivity(db, { action: 'Hatırlatıcı silindi', detail: id, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
