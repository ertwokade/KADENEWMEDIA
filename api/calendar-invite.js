import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateICS({ title, description, date, time, duration = 60 }) {
  const timeStr = time || '10:00';
  const [year, month, day] = date.split('-');
  const [hours, minutes] = timeStr.split(':');

  const startTotal = parseInt(hours) * 60 + parseInt(minutes);
  const endTotal = startTotal + duration;
  const endH = String(Math.floor(endTotal / 60) % 24).padStart(2, '0');
  const endM = String(endTotal % 60).padStart(2, '0');

  const startFmt = `${year}${month}${day}T${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`;
  const endFmt = `${year}${month}${day}T${endH}${endM}00`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kade Media//Calendar//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Istanbul',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0300',
    'TZOFFSETTO:+0300',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `DTSTART;TZID=Europe/Istanbul:${startFmt}`,
    `DTEND;TZID=Europe/Istanbul:${endFmt}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${(description || '').replace(/\n/g, '\\n')}`,
    'ORGANIZER;CN=Kade Media:mailto:hello@kademedia.com',
    `UID:${Date.now()}@kademedia.com.tr`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }

  try {
    const { event, recipients, customEmails, message } = req.body;

    if (!event || !event.title || !event.date) {
      return res.status(400).json({ error: 'Etkinlik başlığı ve tarihi gerekli' });
    }

    if ((!recipients || recipients.length === 0) && (!customEmails || customEmails.length === 0)) {
      return res.status(400).json({ error: 'En az bir alıcı seçmelisiniz' });
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Collect email addresses — validate each one
    const emails = (Array.isArray(customEmails) ? customEmails : [])
      .filter(e => typeof e === 'string' && EMAIL_RE.test(e.trim()))
      .map(e => e.trim());

    if (recipients && recipients.length > 0) {
      const db = await getDb();
      const validIds = recipients.filter(id => isValidObjectId(id)).map(id => new ObjectId(id));
      const users = await db.collection('users')
        .find({ _id: { $in: validIds } })
        .project({ username: 1, email: 1 })
        .toArray();

      users.forEach(u => {
        if (u.email) emails.push(u.email);
      });
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'Geçerli e-posta adresi bulunamadı' });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ error: 'SMTP yapılandırması eksik. SMTP_HOST, SMTP_USER, SMTP_PASS ortam değişkenlerini ayarlayın.' });
    }

    const port = parseInt(smtpPort) || 587;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPass },
      ...(port === 587 ? { requireTLS: true } : {}),
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const icsContent = generateICS(event);

    const platformLabels = {
      instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
      twitter: 'X (Twitter)', linkedin: 'LinkedIn', facebook: 'Facebook',
    };
    const typeLabels = {
      post: 'Gönderi', story: 'Story', reel: 'Reels',
      video: 'Video', live: 'Canlı Yayın', ad: 'Reklam',
    };

    const emailBody = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;">
        <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
          <h1 style="color:#eac321;margin:0;">Kade Media</h1>
          <p style="color:#aaa;margin:5px 0 0;">İçerik Takvimi Daveti</p>
        </div>
        <div style="padding:20px 0;">
          <h2 style="color:#fff;margin:0 0 16px;">${escapeHtml(event.title)}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#eac321;font-weight:bold;width:100px;">Tarih:</td><td style="padding:8px 0;color:#fff;">${escapeHtml(event.date)}</td></tr>
            <tr><td style="padding:8px 0;color:#eac321;font-weight:bold;">Saat:</td><td style="padding:8px 0;color:#fff;">${escapeHtml(event.time || '10:00')}</td></tr>
            <tr><td style="padding:8px 0;color:#eac321;font-weight:bold;">Platform:</td><td style="padding:8px 0;color:#fff;">${escapeHtml(platformLabels[event.platform] || event.platform)}</td></tr>
            <tr><td style="padding:8px 0;color:#eac321;font-weight:bold;">Tür:</td><td style="padding:8px 0;color:#fff;">${escapeHtml(typeLabels[event.type] || event.type)}</td></tr>
          </table>
          ${message ? `<div style="padding:16px;background:#16213e;border-radius:8px;margin-top:16px;"><p style="color:#eac321;font-weight:bold;margin:0 0 8px;">Mesaj:</p><p style="color:#fff;line-height:1.6;margin:0;">${escapeHtml(message)}</p></div>` : ''}
          ${event.description ? `<div style="padding:16px;background:#16213e;border-radius:8px;margin-top:12px;"><p style="color:#eac321;font-weight:bold;margin:0 0 8px;">Açıklama:</p><p style="color:#fff;line-height:1.6;margin:0;">${escapeHtml(event.description)}</p></div>` : ''}
        </div>
        <div style="text-align:center;padding:15px 0;border-top:1px solid #333;color:#666;font-size:12px;">
          Kade Media İçerik Takvimi
        </div>
      </div>
    `;

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: `"Kade Media Takvim" <${smtpUser}>`,
          to: email,
          subject: `📅 ${event.title} — ${event.date} ${event.time || ''}`,
          html: emailBody,
          icalEvent: {
            method: 'REQUEST',
            content: icsContent,
          },
        });
        sent++;
      } catch (err) {
        console.error(`Calendar invite failed for ${email}:`, err.message);
        failed++;
      }
    }

    return res.status(200).json({
      message: `${sent} kişiye davet gönderildi${failed > 0 ? `, ${failed} başarısız` : ''}`,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Calendar invite error:', error);
    return res.status(500).json({ error: 'Davet gönderilirken hata oluştu. Lütfen tekrar deneyin.' });
  }
}
