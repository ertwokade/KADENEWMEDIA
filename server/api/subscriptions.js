import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

function mapPayment(row) {
  if (!row) return row;
  return {
    amount: row.amount,
    date: row.date,
    note: row.note,
    recordedBy: row.recorded_by,
  };
}

function mapSubscription(row, payments = []) {
  if (!row) return row;
  return {
    _id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientCompany: row.client_company,
    services: row.services,
    monthlyAmount: row.monthly_amount,
    currency: row.currency,
    startDate: row.start_date,
    nextRenewalDate: row.next_renewal_date,
    notes: row.notes,
    contactMessageId: row.contact_message_id,
    status: row.status,
    paymentHistory: payments.map(mapPayment),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchPaymentsFor(supabase, subscriptionIds) {
  if (subscriptionIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('kade_subscription_payments')
    .select('*')
    .in('subscription_id', subscriptionIds);
  if (error) throw error;
  const map = new Map();
  for (const payment of data) {
    if (!map.has(payment.subscription_id)) map.set(payment.subscription_id, []);
    map.get(payment.subscription_id).push(payment);
  }
  return map;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, 'subscriptions', { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();

  // GET — list or single subscription
  if (req.method === 'GET') {
    const { id, status, dueThisMont } = req.query;

    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { data, error } = await supabase.from('kade_subscriptions').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      const { data: payments, error: payError } = await supabase
        .from('kade_subscription_payments')
        .select('*')
        .eq('subscription_id', id);
      if (payError) throw payError;
      return res.json(mapSubscription(data, payments));
    }

    let query = supabase.from('kade_subscriptions').select('*').order('next_renewal_date', { ascending: true });
    if (status) query = query.eq('status', status);

    // Filter subscriptions renewing this month
    if (dueThisMont === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      query = query.gte('next_renewal_date', startOfMonth.toISOString()).lte('next_renewal_date', endOfMonth.toISOString());
    }

    const { data: items, error } = await query;
    if (error) throw error;

    const paymentsMap = await fetchPaymentsFor(supabase, items.map(item => item.id));

    // Add days until renewal
    const today = new Date();
    const enriched = items.map(item => {
      const mapped = mapSubscription(item, paymentsMap.get(item.id) || []);
      if (item.next_renewal_date) {
        const diff = Math.ceil((new Date(item.next_renewal_date) - today) / (1000 * 60 * 60 * 24));
        return { ...mapped, daysUntilRenewal: diff };
      }
      return mapped;
    });

    return res.json(enriched);
  }

  // POST — create subscription
  if (req.method === 'POST') {
    const {
      clientName, clientEmail, clientPhone, clientCompany,
      services, monthlyAmount, currency, startDate, notes,
      contactMessageId,
    } = req.body;

    if (!clientName || !monthlyAmount) {
      return res.status(400).json({ error: 'Müşteri adı ve aylık tutar zorunludur' });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const nextRenewal = new Date(start);
    nextRenewal.setMonth(nextRenewal.getMonth() + 1);

    const subscriptionInsert = {
      client_name: String(clientName).slice(0, 100),
      client_email: String(clientEmail || '').slice(0, 200),
      client_phone: String(clientPhone || '').slice(0, 20),
      client_company: String(clientCompany || '').slice(0, 100),
      services: Array.isArray(services) ? services.slice(0, 10).map(s => String(s).slice(0, 100)) : [],
      monthly_amount: Number(monthlyAmount) || 0,
      currency: String(currency || 'TRY').slice(0, 5),
      start_date: start,
      next_renewal_date: nextRenewal,
      notes: String(notes || '').slice(0, 500),
      contact_message_id: contactMessageId ? String(contactMessageId).slice(0, 50) : null,
      status: 'aktif',
      created_by: user.username,
    };

    const { data, error } = await supabase.from('kade_subscriptions').insert(subscriptionInsert).select().single();
    if (error) throw error;
    return res.status(201).json(mapSubscription(data, []));
  }

  // PUT — update subscription (also record payment)
  if (req.method === 'PUT') {
    const { id, action, ...updates } = req.body;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    if (action === 'record-payment') {
      const { amount, date, note } = updates;

      const { data: sub, error: subError } = await supabase.from('kade_subscriptions').select('*').eq('id', id).maybeSingle();
      if (subError) throw subError;
      if (!sub) return res.status(404).json({ error: 'Abonelik bulunamadı' });

      const nextRenewal = new Date(sub.next_renewal_date || new Date());
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      const payment = {
        subscription_id: id,
        amount: Number(amount) || 0,
        date: date ? new Date(date) : new Date(),
        note: String(note || '').slice(0, 200),
        recorded_by: user.username,
      };

      const { error: payError } = await supabase.from('kade_subscription_payments').insert(payment);
      if (payError) throw payError;

      const { error: updateError } = await supabase
        .from('kade_subscriptions')
        .update({ next_renewal_date: nextRenewal, updated_at: new Date() })
        .eq('id', id);
      if (updateError) throw updateError;

      return res.json({ success: true, nextRenewalDate: nextRenewal });
    }

    const allowed = ['clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'services', 'monthlyAmount', 'currency', 'status', 'notes', 'nextRenewalDate'];
    const columnMap = {
      clientName: 'client_name',
      clientEmail: 'client_email',
      clientPhone: 'client_phone',
      clientCompany: 'client_company',
      services: 'services',
      monthlyAmount: 'monthly_amount',
      currency: 'currency',
      status: 'status',
      notes: 'notes',
      nextRenewalDate: 'next_renewal_date',
    };
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[columnMap[key]] = updates[key];
    }
    safeUpdates.updated_at = new Date();

    const { data, error } = await supabase.from('kade_subscriptions').update(safeUpdates).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Abonelik bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_subscriptions').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
