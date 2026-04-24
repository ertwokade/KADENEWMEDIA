import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity, createNotification } from './_lib/notify.js';

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

function getEmails(reminder) {
  // Support both legacy single email and new emails array
  if (reminder.emails && Array.isArray(reminder.emails) && reminder.emails.length > 0) {
    return reminder.emails;
  }
  if (reminder.email) return [reminder.email];
  return [process.env.MAIL_TO || 'thekademedia@gmail.com'];
}

function timingSafeHexEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const leftBuf = Buffer.from(left, 'hex');
  const rightBuf = Buffer.from(right, 'hex');
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}

function verifyVercelSignature(req) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET || process.env.CRON_SIGNATURE_SECRET;
  const signature =
    req.headers['x-vercel-signature'] ||
    req.headers['x-vercel-webhook-signature'];
  if (!secret || typeof signature !== 'string') return false;

  const rawBody = typeof req.body === 'string'
    ? req.body
    : req.method === 'GET'
      ? ''
      : JSON.stringify(req.body || {});
  const expected = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
  return timingSafeHexEqual(signature, expected);
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('reminders');
  const action = req.query?.action;

  // ── Cron: Zamanı gelen hatırlatıcıları gönder (GET veya POST, auth VEYA CRON_SECRET) ──
  if (action === 'check') {
    // Auth: JWT user OR cron
    // Vercel Hobby cron sends a plain GET — no special headers.
    // We accept: (1) valid JWT from admin, (2) CRON_SECRET via header/query, (3) any GET if no CRON_SECRET is set
    const user = requireAuth(req);
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const userAgent = String(req.headers['user-agent'] || '');
    const isCronSecret = !!cronSecret &&
      authHeader === `Bearer ${cronSecret}` &&
      userAgent.startsWith('vercel-cron/');
    const isSignedVercelRequest = verifyVercelSignature(req);
    if (!user && !isCronSecret && !isSignedVercelRequest) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const now = new Date();
      const pending = await collection.find({
        status: 'active',
        remindAt: { $lte: now },
      }).toArray();

      if (pending.length === 0) return res.status(200).json({ sent: 0, notifications: 0, total: 0, smtpConfigured: !!makeTransporter() });

      const transporter = makeTransporter();
      let sentCount = 0;
      let notifCount = 0;
      const errors = [];

      for (const reminder of pending) {
        const emails = getEmails(reminder);

        // E-posta gönder
        if (transporter && emails.length > 0) {
          try {
            const priorityColors = { low: '#2ECC71', medium: '#eac321', high: '#E91E63' };
            const priorityLabels = { low: 'Düşük', medium: 'Orta', high: 'Yüksek' };
            const color = priorityColors[reminder.priority] || '#eac321';
            const label = priorityLabels[reminder.priority] || 'Orta';

            await transporter.sendMail({
              from: `"Kade Media Hatırlatıcı" <${process.env.SMTP_USER}>`,
              to: emails.join(', '),
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
                      <tr><td style="padding:8px 0;color:#888;">Tarih</td><td style="padding:8px 0;color:#fff;">${new Date(reminder.remindAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</td></tr>
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
            console.error('Reminder email failed:', reminder.title, err.message);
            errors.push(`Email gönderilemedi: "${reminder.title}"`);
          }
        } else if (!transporter) {
          errors.push(`SMTP not configured — skipped email for "${reminder.title}"`);
        }

        // Sistem içi bildirim oluştur (assignedUsers varsa)
        if (reminder.assignedUsers && Array.isArray(reminder.assignedUsers) && reminder.assignedUsers.length > 0) {
          for (const userId of reminder.assignedUsers) {
            try {
              await createNotification(db, {
                userId,
                type: 'reminder',
                title: `⏰ ${reminder.title}`,
                message: reminder.description || 'Hatırlatıcı zamanı geldi.',
                link: '/admin',
              });
              notifCount++;
            } catch (err) {
              console.error('Notification failed for user', userId, err.message);
              errors.push(`Bildirim gönderilemedi: kullanıcı ${userId}`);
            }
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

      return res.status(200).json({
        sent: sentCount,
        notifications: notifCount,
        total: pending.length,
        smtpConfigured: !!transporter,
        ...(errors.length > 0 ? { errors } : {}),
      });
    } catch (err) {
      console.error('Reminder check error:', err);
      return res.status(500).json({ error: 'Hatırlatıcı kontrolü sırasında hata oluştu.' });
    }
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

    const { title, description, remindAt, emails, priority, category, repeat, assignedUsers } = body || {};
    if (!title?.trim() || !remindAt) {
      return res.status(400).json({ error: 'Başlık ve hatırlatma zamanı zorunludur.' });
    }

    // emails: array of email strings; assignedUsers: array of user IDs for in-app notification
    const emailList = Array.isArray(emails) && emails.length > 0
      ? emails.filter(e => e && e.includes('@'))
      : [process.env.MAIL_TO || 'thekademedia@gmail.com'];

    const reminder = {
      title: title.trim(),
      description: description?.trim() || '',
      remindAt: new Date(remindAt),
      emails: emailList,
      assignedUsers: Array.isArray(assignedUsers) ? assignedUsers : [],
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

    const { id, title, description, remindAt, emails, priority, category, repeat, status, assignedUsers } = body || {};
    if (!id) return res.status(400).json({ error: 'id gerekli' });
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description.trim();
    if (remindAt !== undefined) update.remindAt = new Date(remindAt);
    if (emails !== undefined) update.emails = Array.isArray(emails) ? emails.filter(e => e && e.includes('@')) : [];
    if (assignedUsers !== undefined) update.assignedUsers = Array.isArray(assignedUsers) ? assignedUsers : [];
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
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await collection.deleteOne({ _id: new ObjectId(id) });
    logActivity(db, { action: 'Hatırlatıcı silindi', detail: id, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
    return res.status(200).json({ success: true });
  }

  // ── POST ?action=send-invite — Takvim daveti gönder (calendar-invite) ──
  if (action === 'send-invite' && req.method === 'POST') {
    const { event, recipients, customEmails, message } = req.body;
    if (!event || !event.title || !event.date) return res.status(400).json({ error: 'Etkinlik başlığı ve tarihi gerekli' });
    if ((!recipients || recipients.length === 0) && (!customEmails || customEmails.length === 0)) return res.status(400).json({ error: 'En az bir alıcı seçmelisiniz' });

    function generateICS({ title, description, date, time, duration = 60 }) {
      const [year, month, day] = date.split('-');
      const [hours, minutes] = (time || '10:00').split(':');
      const startTotal = parseInt(hours) * 60 + parseInt(minutes);
      const endTotal = startTotal + duration;
      const endH = String(Math.floor(endTotal / 60) % 24).padStart(2, '0');
      const endM = String(endTotal % 60).padStart(2, '0');
      const startFmt = `${year}${month}${day}T${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`;
      const endFmt = `${year}${month}${day}T${endH}${endM}00`;
      return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kade Media//Calendar//TR','CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VTIMEZONE','TZID:Europe/Istanbul','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0300','TZOFFSETTO:+0300','END:STANDARD','END:VTIMEZONE','BEGIN:VEVENT',`DTSTART;TZID=Europe/Istanbul:${startFmt}`,`DTEND;TZID=Europe/Istanbul:${endFmt}`,`SUMMARY:${title}`,`DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,'ORGANIZER;CN=Kade Media:mailto:hello@kademedia.com',`UID:${Date.now()}@kademedia.com`,'STATUS:CONFIRMED','END:VEVENT','END:VCALENDAR'].join('\r\n');
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = (Array.isArray(customEmails) ? customEmails : []).filter(e => typeof e === 'string' && EMAIL_RE.test(e.trim())).map(e => e.trim());
    if (recipients && recipients.length > 0) {
      const validIds = recipients.filter(id => isValidObjectId(id)).map(id => new ObjectId(id));
      const users = await db.collection('users').find({ _id: { $in: validIds } }).project({ email: 1 }).toArray();
      users.forEach(u => { if (u.email) emails.push(u.email); });
    }
    if (emails.length === 0) return res.status(400).json({ error: 'Geçerli e-posta adresi bulunamadı' });

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) return res.status(500).json({ error: 'SMTP yapılandırması eksik' });

    const port2 = parseInt(process.env.SMTP_PORT) || 587;
    const transporter2 = nodemailer.createTransport({ host: smtpHost, port: port2, secure: port2 === 465, auth: { user: smtpUser, pass: smtpPass }, ...(port2 === 587 ? { requireTLS: true } : {}), tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
    const icsContent = generateICS(event);
    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px"><div style="text-align:center;padding:20px 0;border-bottom:1px solid #333"><h1 style="color:#eac321;margin:0">Kade Media</h1><p style="color:#aaa;margin:5px 0 0">İçerik Takvimi Daveti</p></div><div style="padding:20px 0"><h2 style="color:#fff;margin:0 0 16px">${escapeHtml(event.title)}</h2><p style="color:#eac321">Tarih: ${escapeHtml(event.date)} ${escapeHtml(event.time || '10:00')}</p>${message ? `<p style="color:#fff">${escapeHtml(message)}</p>` : ''}${event.description ? `<p style="color:#fff">${escapeHtml(event.description)}</p>` : ''}</div></div>`;

    let sent = 0; let failed = 0;
    for (const email of emails) {
      try { await transporter2.sendMail({ from: `"Kade Media Takvim" <${smtpUser}>`, to: email, subject: `📅 ${event.title} — ${event.date}`, html: emailBody, icalEvent: { method: 'REQUEST', content: icsContent } }); sent++; }
      catch (err) { console.error(`Davet hatası ${email}:`, err.message); failed++; }
    }
    return res.status(200).json({ message: `${sent} kişiye davet gönderildi${failed > 0 ? `, ${failed} başarısız` : ''}`, sent, failed });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
