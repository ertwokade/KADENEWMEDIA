import nodemailer from 'nodemailer';
import { getDb } from '../_lib/mongodb.js';
import { cors } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Ad, e-posta ve mesaj gerekli' });
    }

    // Save to MongoDB
    const db = await getDb();
    await db.collection('messages').insertOne({
      name,
      email,
      phone: phone || '-',
      company: company || '-',
      service: service || '-',
      message,
      read: false,
      createdAt: new Date(),
    });

    // Send email via SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const mailTo = process.env.MAIL_TO || 'thekademedia@gmail.com';

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort) || 587,
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: `"Kade Media İletişim" <${smtpUser}>`,
        to: mailTo,
        subject: `Yeni İletişim Formu - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #fff; border-radius: 12px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #333;">
              <h1 style="color: #FFD700; margin: 0;">Kade Media</h1>
              <p style="color: #aaa; margin: 5px 0 0;">Yeni İletişim Formu Mesajı</p>
            </div>
            <div style="padding: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; color: #FFD700; font-weight: bold;">Ad Soyad:</td><td style="padding: 10px; color: #fff;">${name}</td></tr>
                <tr><td style="padding: 10px; color: #FFD700; font-weight: bold;">E-posta:</td><td style="padding: 10px; color: #fff;"><a href="mailto:${email}" style="color: #FFD700;">${email}</a></td></tr>
                <tr><td style="padding: 10px; color: #FFD700; font-weight: bold;">Telefon:</td><td style="padding: 10px; color: #fff;">${phone || '-'}</td></tr>
                <tr><td style="padding: 10px; color: #FFD700; font-weight: bold;">Şirket:</td><td style="padding: 10px; color: #fff;">${company || '-'}</td></tr>
                <tr><td style="padding: 10px; color: #FFD700; font-weight: bold;">Hizmet:</td><td style="padding: 10px; color: #fff;">${service || '-'}</td></tr>
              </table>
              <div style="padding: 20px; background: #16213e; border-radius: 8px; margin-top: 15px;">
                <p style="color: #FFD700; font-weight: bold; margin: 0 0 10px;">Mesaj:</p>
                <p style="color: #fff; line-height: 1.6; margin: 0;">${message}</p>
              </div>
            </div>
            <div style="text-align: center; padding: 15px 0; border-top: 1px solid #333; color: #666; font-size: 12px;">
              Bu e-posta kademedia.com iletişim formu üzerinden gönderilmiştir.
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({ message: 'Mesajınız başarıyla gönderildi!' });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu' });
  }
}
