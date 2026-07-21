import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';
import nodemailer from 'nodemailer';

const VALID_STATUSES = ['yeni', 'gorusme-bekliyor', 'teklif-gonderildi', 'kazanildi', 'kaybedildi'];

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function cleanHeader(str, max = 200) {
  return String(str || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function mapMessage(m) {
  if (!m) return m;
  return { ...m, _id: m.id, consentAt: m.consent_at, createdAt: m.created_at };
}

function mapNote(n) {
  if (!n) return n;
  return { ...n, _id: n.id, messageId: n.message_id, createdBy: n.created_by, createdAt: n.created_at };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, 'messages', { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();
  const action = req.query?.action;

  // ── Email reply (POST ?action=reply) ──
  if (action === 'reply' && req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { id, replyText, subject } = body || {};
      if (!id || !replyText?.trim()) return res.status(400).json({ error: 'id ve replyText gerekli' });
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const { data: message, error: findError } = await supabase.from('kade_messages').select('*').eq('id', id).maybeSingle();
      if (findError) throw findError;
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

      const mailSubject = cleanHeader(subject || `Re: Kade Media — ${message.service && message.service !== '-' ? message.service : 'İletişim'}`);

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
              <p style="color:#888;font-size:12px;margin:0;">Kade Media | İstanbul<br/>thekademedia@gmail.com</p>
            </div>
          </div>
        `,
      });

      // Mark as replied in notes
      const { error: noteError } = await supabase.from('kade_message_notes').insert({
        message_id: id,
        text: `E-posta yanıtı gönderildi: "${replyText.substring(0, 80)}${replyText.length > 80 ? '...' : ''}"`,
        type: 'email',
        created_by: user.username,
      });
      if (noteError) throw noteError;

      logActivity({ action: 'E-posta yanıtı gönderildi', detail: `${message.name} (${message.email})`, type: 'message', icon: '📤', user: user.username }).catch(() => {});

      return res.status(200).json({ message: 'E-posta başarıyla gönderildi!' });
    } catch (error) {
      console.error('Reply error:', error);
      return res.status(500).json({ error: 'E-posta gönderilemedi. SMTP ayarlarını kontrol edin.' });
    }
  }

  // GET - List all messages
  if (req.method === 'GET') {
    try {
      const { data: messages, error } = await supabase.from('kade_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(messages.map(mapMessage));
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
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const update = {};

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Geçersiz durum değeri' });
        update.status = status;
      } else if (read !== undefined) {
        update.read = read;
      } else {
        update.read = true;
      }

      const { error } = await supabase.from('kade_messages').update(update).eq('id', id);
      if (error) throw error;
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
      if (!isValidUuid(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { data: msg, error: findError } = await supabase.from('kade_messages').select('*').eq('id', queryId).maybeSingle();
      if (findError) throw findError;
      const { error } = await supabase.from('kade_messages').delete().eq('id', queryId);
      if (error) throw error;
      logActivity({ action: 'Mesaj silindi', detail: `${msg?.name || ''} - ${msg?.subject || ''}`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Mesaj silindi' });
    } catch (error) {
      console.error('Messages DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // ── Notes (CRM) — ?action=notes ──
  if (action === 'notes') {
    if (req.method === 'GET') {
      const messageId = req.query?.messageId;
      if (!messageId) return res.status(400).json({ error: 'messageId gerekli' });
      const { data: notes, error } = await supabase.from('kade_message_notes').select('*').eq('message_id', messageId).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(notes.map(mapNote));
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { messageId, text, type } = body || {};
      if (!messageId || !text?.trim()) return res.status(400).json({ error: 'messageId ve text gerekli' });
      const note = { message_id: messageId, text: text.trim(), type: type || 'note', created_by: user.username };
      const { data, error } = await supabase.from('kade_message_notes').insert(note).select().single();
      if (error) throw error;
      return res.status(201).json(mapNote(data));
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'id gerekli' });
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { error } = await supabase.from('kade_message_notes').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
