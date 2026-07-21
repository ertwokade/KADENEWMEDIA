import nodemailer from 'nodemailer';
import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
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

function mapProposal(row) {
  if (!row) return row;
  return {
    _id: row.id,
    proposalNumber: row.proposal_number,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientCompany: row.client_company,
    services: row.services,
    totalAmount: row.total_amount,
    currency: row.currency,
    validUntil: row.valid_until,
    notes: row.notes,
    messageId: row.message_id,
    status: row.status,
    sentAt: row.sent_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, 'proposals', { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();

  // GET — list proposals or single
  if (req.method === 'GET') {
    const { id, messageId, status } = req.query;
    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { data, error } = await supabase.from('kade_proposals').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Teklif bulunamadı' });
      return res.json(mapProposal(data));
    }
    let query = supabase.from('kade_proposals').select('*').order('created_at', { ascending: false });
    if (messageId) query = query.eq('message_id', messageId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data.map(mapProposal));
  }

  // POST — create proposal
  if (req.method === 'POST') {
    const {
      clientName, clientEmail, clientPhone, clientCompany,
      services, totalAmount, currency, validUntil, notes,
      messageId, sendEmail,
    } = req.body;

    if (!clientName || !clientEmail || !services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Müşteri adı, e-posta ve en az bir hizmet zorunludur' });
    }

    const proposalNumber = `KM-${Date.now().toString().slice(-6)}`;
    const proposalInsert = {
      proposal_number: proposalNumber,
      client_name: String(clientName).slice(0, 100),
      client_email: String(clientEmail).slice(0, 200),
      client_phone: String(clientPhone || '').slice(0, 20),
      client_company: String(clientCompany || '').slice(0, 100),
      services: services.slice(0, 20).map(s => ({
        name: String(s.name || '').slice(0, 100),
        description: String(s.description || '').slice(0, 300),
        amount: Number(s.amount) || 0,
        quantity: Number(s.quantity) || 1,
      })),
      total_amount: Number(totalAmount) || 0,
      currency: String(currency || 'TRY').slice(0, 5),
      valid_until: validUntil ? new Date(validUntil) : null,
      notes: String(notes || '').slice(0, 1000),
      message_id: messageId ? String(messageId).slice(0, 50) : null,
      status: 'taslak',
      created_by: user.username,
    };

    const { data: inserted, error: insertError } = await supabase.from('kade_proposals').insert(proposalInsert).select().single();
    if (insertError) throw insertError;
    let proposal = mapProposal(inserted);

    // Send email if requested
    if (sendEmail && clientEmail) {
      const transporter = makeTransporter();
      if (transporter) {
        const serviceRows = proposal.services.map(s =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.name)}</td><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(s.description)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${s.quantity}x</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${s.amount.toLocaleString('tr-TR')} ${proposal.currency}</td></tr>`
        ).join('');

        const html = `
          <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
            <div style="background:#111;padding:32px;text-align:center">
              <h1 style="color:#eac321;margin:0;font-size:1.6rem">kade<span style="color:#fff">media</span></h1>
              <p style="color:#888;margin:8px 0 0;font-size:0.85rem">Dijital Pazarlama Ajansı</p>
            </div>
            <div style="padding:32px">
              <h2 style="color:#111;margin:0 0 8px">Teklif: ${escapeHtml(proposalNumber)}</h2>
              <p style="color:#555">Sayın ${escapeHtml(clientName)},</p>
              <p style="color:#555">Talebiniz doğrultusunda hazırladığımız hizmet teklifini aşağıda bulabilirsiniz.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0">
                <thead><tr style="background:#f5f5f5"><th style="padding:10px;text-align:left">Hizmet</th><th style="padding:10px;text-align:left">Açıklama</th><th style="padding:10px;text-align:right">Adet</th><th style="padding:10px;text-align:right">Tutar</th></tr></thead>
                <tbody>${serviceRows}</tbody>
                <tfoot><tr style="background:#eac32115"><td colspan="3" style="padding:12px;font-weight:bold;text-align:right">Toplam Tutar</td><td style="padding:12px;font-weight:bold;font-size:1.1rem;text-align:right;color:#111">${proposal.totalAmount.toLocaleString('tr-TR')} ${proposal.currency}</td></tr></tfoot>
              </table>
              ${proposal.validUntil ? `<p style="color:#888;font-size:0.85rem">Bu teklif <strong>${new Date(proposal.validUntil).toLocaleDateString('tr-TR')}</strong> tarihine kadar geçerlidir.</p>` : ''}
              ${proposal.notes ? `<div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-top:16px"><strong>Notlar:</strong><p style="margin:8px 0 0;color:#555">${escapeHtml(proposal.notes)}</p></div>` : ''}
              <div style="margin-top:32px;text-align:center">
                <a href="mailto:thekademedia@gmail.com" style="background:#eac321;color:#111;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Teklifi Onaylayın</a>
              </div>
            </div>
            <div style="padding:20px 32px;border-top:1px solid #eee;font-size:0.8rem;color:#999;text-align:center">
              Kade Media Dijital Pazarlama | thekademedia@gmail.com
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"Kade Media" <${process.env.SMTP_USER}>`,
            to: clientEmail,
            cc: process.env.MAIL_TO,
            subject: `Teklif ${proposalNumber} — Kade Media`,
            html,
          });
          const { data: updated, error: updateError } = await supabase
            .from('kade_proposals')
            .update({ status: 'gonderildi', sent_at: new Date() })
            .eq('id', proposal._id)
            .select()
            .single();
          if (updateError) throw updateError;
          proposal = mapProposal(updated);
        } catch (err) {
          console.error('Teklif e-posta hatası:', err.message);
        }
      }
    }

    return res.status(201).json(proposal);
  }

  // PUT — update proposal status or details
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const allowed = ['status', 'notes', 'validUntil', 'totalAmount', 'services', 'clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'currency'];
    const columnMap = {
      status: 'status',
      notes: 'notes',
      validUntil: 'valid_until',
      totalAmount: 'total_amount',
      services: 'services',
      clientName: 'client_name',
      clientEmail: 'client_email',
      clientPhone: 'client_phone',
      clientCompany: 'client_company',
      currency: 'currency',
    };
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[columnMap[key]] = updates[key];
    }
    safeUpdates.updated_at = new Date();

    const { data, error } = await supabase.from('kade_proposals').update(safeUpdates).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Teklif bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_proposals').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
