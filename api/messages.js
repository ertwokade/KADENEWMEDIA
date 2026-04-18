import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { ObjectId } from 'mongodb';
import { logActivity } from './notifications.js';
import nodemailer from 'nodemailer';

const VALID_STATUSES = ['yeni', 'gorusme-bekliyor', 'teklif-gonderildi', 'kazanildi', 'kaybedildi'];

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const db = await getDb();
  const collection = db.collection('messages');
  const action = req.query?.action;

  // ── Email reply (POST ?action=reply) ──
  if (action === 'reply' && req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { id, replyText, subject } = body || {};
      if (!id || !replyText?.trim()) return res.status(400).json({ error: 'id ve replyText gerekli' });
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const message = await collection.findOne({ _id: new ObjectId(id) });
      if (!message) return res.status(404).json({ error: 'Mesaj bulunamadı' });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(400).json({ error: 'SMTP ayarları yapılandırılmamış. Vercel environment variables kontrol edin.' });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost, port: smtpPort, secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        ...(smtpPort === 587 ? { requireTLS: true } : {}),
        tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      });

      const mailSubject = subject || `Re: Kade Media — ${message.service && message.service !== '-' ? message.service : 'İletişim'}`;

      await transporter.sendMail({
        from: `"Kade Media" <${smtpUser}>`,
        to: message.email,
        subject: mailSubject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#0a0a0a;color:#fff;border-radius:12px;">
            <div style="text-align:center;padding:16px 0;border-bottom:1px solid #333;">
              <h2 style="color:#eac321;margin:0;">⚡ Kade Media</h2>
            </div>
            <div style="padding:24px 20px;">
              <p style="color:#ccc;margin:0 0 8px;">Merhaba ${escapeHtml(message.name)},</p>
              <div style="margin:20px 0;padding:16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #eac321;white-space:pre-wrap;line-height:1.7;color:#e0e0e0;">${escapeHtml(replyText)}</div>
              <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
              <p style="color:#888;font-size:12px;margin:0;">Kade Media | Biruni Teknopark, Zeytinburnu/İstanbul<br/>hello@kademedia.com | +90 506 729 34 23</p>
            </div>
          </div>
        `,
      });

      // Mark as replied in notes
      await db.collection('notes').insertOne({
        messageId: id,
        text: `E-posta yanıtı gönderildi: "${replyText.substring(0, 80)}${replyText.length > 80 ? '...' : ''}"`,
        type: 'email',
        createdBy: user.username,
        createdAt: new Date(),
      });

      logActivity(db, { action: 'E-posta yanıtı gönderildi', detail: `${message.name} (${message.email})`, type: 'message', icon: '📤', user: user.username }).catch(() => {});

      return res.status(200).json({ message: 'E-posta başarıyla gönderildi!' });
    } catch (error) {
      console.error('Reply error:', error);
      return res.status(500).json({ error: 'E-posta gönderilemedi. SMTP ayarlarını kontrol edin.' });
    }
  }

  // GET - List all messages
  if (req.method === 'GET') {
    try {
      const messages = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Messages GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Mark as read OR update status
  if (req.method === 'PUT') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { id, status, read } = body || {};
      if (!id) return res.status(400).json({ error: 'id gerekli' });
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const update = {};

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Geçersiz durum değeri' });
        update.status = status;
      } else if (read !== undefined) {
        update.read = read;
      } else {
        update.read = true;
      }

      await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return res.status(200).json({ message: 'Güncellendi' });
    } catch (error) {
      console.error('Messages PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete message
  if (req.method === 'DELETE') {
    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'id gerekli' });
      if (!isValidObjectId(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });
      const msg = await collection.findOne({ _id: new ObjectId(queryId) });
      await collection.deleteOne({ _id: new ObjectId(queryId) });
      logActivity(db, { action: 'Mesaj silindi', detail: `${msg?.name || ''} - ${msg?.subject || ''}`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Mesaj silindi' });
    } catch (error) {
      console.error('Messages DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Notes (CRM) — ?action=notes ──
  if (action === 'notes') {
    const notesCol = db.collection('notes');

    if (req.method === 'GET') {
      const messageId = req.query?.messageId;
      if (!messageId) return res.status(400).json({ error: 'messageId gerekli' });
      const notes = await notesCol.find({ messageId }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(notes);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { messageId, text, type } = body || {};
      if (!messageId || !text?.trim()) return res.status(400).json({ error: 'messageId ve text gerekli' });
      const note = { messageId, text: text.trim(), type: type || 'note', createdBy: user.username, createdAt: new Date() };
      const result = await notesCol.insertOne(note);
      return res.status(201).json({ ...note, _id: result.insertedId });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id gerekli' });
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      await notesCol.deleteOne({ _id: new ObjectId(id) });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
