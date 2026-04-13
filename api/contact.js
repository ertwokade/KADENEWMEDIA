import nodemailer from 'nodemailer';
import { ObjectId } from 'mongodb';
import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { requireAuth } from './_lib/auth.js';
import { logActivity } from './notifications.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action;

  // ── Newsletter aboneleri (auth gerekli) ──
  if (action === 'subscribers') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    const db = await getDb();

    if (req.method === 'GET') {
      try {
        const subscribers = await db.collection('newsletter')
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        return res.status(200).json(subscribers);
      } catch (err) {
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = req.query?.id;
        if (!id) return res.status(400).json({ error: 'id gerekli' });
        await db.collection('newsletter').deleteOne({ _id: new ObjectId(id) });
        logActivity(db, { action: 'Newsletter abonesi silindi', detail: '', type: 'delete', icon: '📧', user: user.username }).catch(() => {});
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── SMTP test (auth gerekli) ──
  if (action === 'smtp-test') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const transporter = makeTransporter();
    if (!transporter) return res.status(400).json({ error: 'SMTP ayarları yapılandırılmamış (SMTP_HOST, SMTP_USER, SMTP_PASS gerekli)' });

    try {
      await transporter.verify();
      return res.status(200).json({ success: true, message: 'SMTP bağlantısı başarılı!' });
    } catch (err) {
      return res.status(200).json({ success: false, message: `SMTP bağlantı hatası: ${err.message}` });
    }
  }

  // ── Kariyer Başvurusu (public, POST only) ──
  if (action === 'apply') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { name, email, phone, position, coverLetter } = body || {};
    if (!name?.trim() || !email?.trim() || !position?.trim()) {
      return res.status(400).json({ error: 'Ad, e-posta ve pozisyon zorunludur.' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    try {
      const db = await getDb();
      await db.collection('applications').insertOne({
        name: name.trim(), email: email.trim().toLowerCase(),
        phone: phone?.trim() || '-', position: position.trim(),
        coverLetter: coverLetter?.trim() || '',
        status: 'yeni', createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni kariyer başvurusu', detail: `${name.trim()} — ${position.trim()}`, type: 'message', icon: '💼', user: 'sistem' }).catch(() => {});
      const transporter = makeTransporter();
      if (transporter) {
        const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';
        transporter.sendMail({
          from: `"Kade Media Website" <${process.env.SMTP_USER}>`,
          to: mailTo,
          subject: `💼 Kariyer Başvurusu: ${escapeHtml(name)} — ${escapeHtml(position)}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;"><h2 style="color:#eac321;">💼 Kariyer Başvurusu</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;padding:6px 0;width:120px;">Ad Soyad</td><td style="color:#fff;font-weight:600;">${escapeHtml(name)}</td></tr><tr><td style="color:#888;padding:6px 0;">E-posta</td><td style="color:#eac321;">${escapeHtml(email)}</td></tr><tr><td style="color:#888;padding:6px 0;">Telefon</td><td style="color:#fff;">${escapeHtml(phone || '-')}</td></tr><tr><td style="color:#888;padding:6px 0;">Pozisyon</td><td style="color:#fff;">${escapeHtml(position)}</td></tr></table>${coverLetter ? `<div style="margin-top:16px;padding:14px;background:#1a1a1a;border-radius:8px;border-left:3px solid #eac321;"><p style="color:#ccc;margin:0;line-height:1.6;white-space:pre-wrap;">${escapeHtml(coverLetter)}</p></div>` : ''}</div>`,
        }).catch(() => {});
        transporter.sendMail({
          from: `"Kade Media" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Başvurunuz Alındı — Kade Media',
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;"><h2 style="color:#eac321;">Kade Media</h2><h3>Merhaba ${escapeHtml(name)},</h3><p style="color:#ccc;line-height:1.8;"><strong style="color:#eac321;">${escapeHtml(position)}</strong> pozisyonu için başvurunuz alındı. İnceleme sonrasında sizinle iletişime geçeceğiz.</p><p style="color:#888;font-size:12px;margin-top:24px;">Kade Media | hello@kademedia.com | +90 506 729 34 23</p></div>`,
        }).catch(() => {});
      }
      return res.status(200).json({ message: 'Başvurunuz başarıyla alındı!' });
    } catch (err) {
      console.error('Apply error:', err);
      return res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
    }
  }

  // ── Sosyal Medya Analiz Aracı Lead (public, POST only) ──
  if (action === 'analyzer-lead') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { email, score, platforms, usernames, categories } = body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi gerekli.' });
    }
    try {
      const db = await getDb();
      await db.collection('analyzer_leads').insertOne({
        email: email.trim().toLowerCase(), score, platforms, usernames, categories,
        createdAt: new Date(), source: 'social-media-analyzer', status: 'new',
      });
      await db.collection('messages').insertOne({
        name: email.split('@')[0], email: email.trim().toLowerCase(),
        phone: '', company: '', service: 'Sosyal Medya Analiz',
        message: `Sosyal Medya Analiz Aracı Lead - Skor: ${score}/100\nPlatformlar: ${platforms?.join(', ')}\nKullanıcı adları: ${JSON.stringify(usernames)}`,
        source: 'analyzer', status: 'yeni', read: false, createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni analiz lead', detail: `${email} — Skor: ${score}/100`, type: 'message', icon: '📊', user: 'sistem' }).catch(() => {});
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Analyzer lead error:', err);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Newsletter aboneliği (public, POST only) ──
  if (action === 'newsletter') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    return handleNewsletter(req, res);
  }

  // ── Normal contact form (POST only) ──
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const rl = rateLimitCheck(req);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Çok fazla istek. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.`,
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const {
    name, email, phone, company, service, message, source = 'iletisim-formu',
  } = body || {};

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Ad, e-posta ve mesaj alanları zorunludur.' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }

  if (message.trim().length < 10) {
    return res.status(400).json({ error: 'Mesajınız en az 10 karakter olmalıdır.' });
  }

  try {
    // Save to DB
    try {
      const db = await getDb();
      await db.collection('messages').insertOne({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '-',
        company: company?.trim() || '-',
        service: service || '-',
        message: message.trim(),
        source,
        status: 'yeni',
        read: false,
        createdAt: new Date(),
      });
      logActivity(db, { action: 'Yeni mesaj alındı', detail: `${name.trim()} - ${service || 'Genel'}`, type: 'message', icon: '✉️', user: 'sistem' }).catch(() => {});
    } catch (dbErr) {
      console.error('MongoDB save failed (non-critical):', dbErr.message);
    }

    // Send notification email to team
    const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';
    const transporter = makeTransporter();

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Kade Media Website" <${process.env.SMTP_USER}>`,
          to: mailTo,
          subject: `🔔 Yeni Lead: ${escapeHtml(name)} — ${service || 'Genel'}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
              <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
                <h1 style="color:#eac321;margin:0;">⚡ Kade Media</h1>
                <p style="color:#888;margin:8px 0 0">Yeni Lead Bildirimi</p>
              </div>
              <div style="padding:30px 20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#888;width:120px;">Ad Soyad</td><td style="padding:8px 0;color:#fff;font-weight:600;">${escapeHtml(name)}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">E-posta</td><td style="padding:8px 0;color:#eac321;">${escapeHtml(email)}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Telefon</td><td style="padding:8px 0;color:#fff;">${escapeHtml(phone || '-')}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Şirket</td><td style="padding:8px 0;color:#fff;">${escapeHtml(company || '-')}</td></tr>
                  <tr><td style="padding:8px 0;color:#888;">Hizmet</td><td style="padding:8px 0;color:#fff;">${escapeHtml(service || '-')}</td></tr>
                </table>
                <div style="margin-top:20px;padding:16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #eac321;">
                  <p style="color:#ccc;margin:0;line-height:1.6;">${escapeHtml(message)}</p>
                </div>
                <div style="text-align:center;margin:24px 0;">
                  <a href="mailto:${escapeHtml(email)}" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Yanıtla</a>
                </div>
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.log('Team notification email failed (non-critical):', mailErr.message);
      }

      // Thank you email
      try {
        await transporter.sendMail({
          from: `"Kade Media" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Mesajınız Alındı — Kade Media',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;">
              <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
                <h1 style="color:#eac321;margin:0;">Kade Media</h1>
              </div>
              <div style="padding:30px 20px;">
                <h2 style="color:#fff;">Merhaba ${escapeHtml(name)},</h2>
                <p style="color:#ccc;line-height:1.8;">Mesajınız başarıyla alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek — genellikle 1 iş günü içinde yanıt veriyoruz.</p>
                <p style="color:#ccc;line-height:1.8;">Acil bir konunuz varsa WhatsApp üzerinden ulaşabilirsiniz:</p>
                <div style="text-align:center;margin:24px 0;">
                  <a href="https://wa.me/905067293423" style="display:inline-block;padding:14px 32px;background:#eac321;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">WhatsApp'tan Yaz</a>
                </div>
                <hr style="border:none;border-top:1px solid #333;margin:24px 0;" />
                <p style="color:#888;font-size:13px;">Kade Media | Biruni Teknopark, Zeytinburnu/İstanbul<br/>hello@kademedia.com | +90 506 729 34 23</p>
              </div>
            </div>
          `,
        });
      } catch (thankYouErr) {
        console.log('Thank-you email failed (non-critical):', thankYouErr.message);
      }
    }

    // WhatsApp notification
    const waPhone = process.env.WA_PHONE;
    const waApiKey = process.env.WA_APIKEY;
    if (waPhone && waApiKey) {
      try {
        const waText = encodeURIComponent(
          `🔔 Yeni Lead!\n👤 ${name}\n📧 ${email}\n📞 ${phone || '-'}\n🏢 ${company || '-'}\n🎯 ${service || '-'}\n💬 ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
        );
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${waText}&apikey=${waApiKey}`);
      } catch (waError) {
        console.log('WA notification failed (non-critical):', waError.message);
      }
    }

    return res.status(200).json({ message: 'Mesajınız başarıyla gönderildi!' });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu' });
  }
}

// ========== NEWSLETTER HANDLER ==========
async function handleNewsletter(req, res) {
  const { email } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }
  try {
    const db = await getDb();
    const collection = db.collection('newsletter');
    const existing = await collection.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }
    await collection.insertOne({
      email: email.toLowerCase(),
      createdAt: new Date(),
      source: 'website',
    });
    return res.status(200).json({ message: 'Aboneliğiniz başarıyla oluşturuldu!' });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
  }
}
