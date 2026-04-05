import nodemailer from 'nodemailer';
import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
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

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Newsletter subscription handler
  const action = req.query?.action;
  if (action === 'newsletter') {
    return handleNewsletter(req, res);
  }

  // Rate limiting
  const rl = rateLimitCheck(req);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Çok fazla istek. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.`,
    });
  }

  try {
    const { name, email, phone, company, service, message, website } = req.body || {};

    // Honeypot check
    if (website) {
      return res.status(200).json({ message: 'Mesajınız alındı.' });
    }

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Ad, e-posta ve mesaj gerekli' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    }
    if (message.trim().length < 20) {
      return res.status(400).json({ error: 'Mesajınız en az 20 karakter olmalıdır.' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Ad en az 2 karakter olmalıdır.' });
    }

    const source = service ? `iletisim-formu:${service}` : 'iletisim-formu:genel';

    // Save to MongoDB (non-blocking — email still sent even if DB fails)
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
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';

    if (smtpHost && smtpUser && smtpPass) {
      const port = parseInt(smtpPort) || 587;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
        ...(port === 587 ? { requireTLS: true } : {}),
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      // Verify SMTP connection before sending
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified');
      } catch (verifyErr) {
        console.error('❌ SMTP verification failed:', verifyErr.message);
      }

      // Team notification email
      try { await transporter.sendMail({
        from: `"Kade Media İletişim" <${smtpUser}>`,
        to: mailTo,
        subject: `🔔 Yeni Lead: ${escapeHtml(name)} — ${escapeHtml(service || 'Genel')}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#1a1a2e;color:#fff;border-radius:12px;">
            <div style="text-align:center;padding:20px 0;border-bottom:1px solid #333;">
              <h1 style="color:#eac321;margin:0;">Kade Media</h1>
              <p style="color:#aaa;margin:5px 0 0;">Yeni İletişim Formu Mesajı</p>
            </div>
            <div style="padding:20px 0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:10px;color:#eac321;font-weight:bold;width:120px;">Ad Soyad:</td><td style="padding:10px;color:#fff;">${escapeHtml(name)}</td></tr>
                <tr><td style="padding:10px;color:#eac321;font-weight:bold;">E-posta:</td><td style="padding:10px;"><a href="mailto:${escapeHtml(email)}" style="color:#eac321;">${escapeHtml(email)}</a></td></tr>
                <tr><td style="padding:10px;color:#eac321;font-weight:bold;">Telefon:</td><td style="padding:10px;color:#fff;">${escapeHtml(phone || '-')}</td></tr>
                <tr><td style="padding:10px;color:#eac321;font-weight:bold;">Şirket:</td><td style="padding:10px;color:#fff;">${escapeHtml(company || '-')}</td></tr>
                <tr><td style="padding:10px;color:#eac321;font-weight:bold;">Hizmet:</td><td style="padding:10px;color:#fff;">${escapeHtml(service || '-')}</td></tr>
              </table>
              <div style="padding:20px;background:#16213e;border-radius:8px;margin-top:15px;">
                <p style="color:#eac321;font-weight:bold;margin:0 0 10px;">Mesaj:</p>
                <p style="color:#fff;line-height:1.6;margin:0;">${escapeHtml(message)}</p>
              </div>
            </div>
            <div style="text-align:center;padding:15px 0;border-top:1px solid #333;color:#666;font-size:12px;">
              kademedia.com.tr iletişim formu • Lead durumu: <strong style="color:#eac321;">Yeni</strong>
            </div>
          </div>
        `,
      }); } catch (teamMailErr) { console.error('Team email failed (non-critical):', teamMailErr.message); }

      // Thank-you email to user
      try {
        await transporter.sendMail({
          from: `"Kade Media" <${smtpUser}>`,
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
