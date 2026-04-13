import { getDb } from './_lib/mongodb.js';
import nodemailer from 'nodemailer';

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
  // Vercel Cron veya CRON_SECRET ile korunan endpoint
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = await getDb();
    const collection = db.collection('reminders');
    const now = new Date();

    const pending = await collection.find({
      status: 'active',
      remindAt: { $lte: now },
    }).toArray();

    if (pending.length === 0) {
      return res.status(200).json({ sent: 0, message: 'No pending reminders' });
    }

    const transporter = makeTransporter();
    let sentCount = 0;

    for (const reminder of pending) {
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
  } catch (err) {
    console.error('Cron reminders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
