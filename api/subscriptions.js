import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const db = await getDb();
  const col = db.collection('subscriptions');

  // GET — list or single subscription
  if (req.method === 'GET') {
    const { id, status, dueThisMont } = req.query;

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const item = await col.findOne({ _id: new ObjectId(id) });
      if (!item) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      return res.json(item);
    }

    const filter = {};
    if (status) filter.status = status;

    // Filter subscriptions renewing this month
    if (dueThisMont === 'true') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filter.nextRenewalDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const items = await col.find(filter).sort({ nextRenewalDate: 1 }).toArray();

    // Add days until renewal
    const today = new Date();
    const enriched = items.map(item => {
      if (item.nextRenewalDate) {
        const diff = Math.ceil((new Date(item.nextRenewalDate) - today) / (1000 * 60 * 60 * 24));
        return { ...item, daysUntilRenewal: diff };
      }
      return item;
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

    const subscription = {
      clientName: String(clientName).slice(0, 100),
      clientEmail: String(clientEmail || '').slice(0, 200),
      clientPhone: String(clientPhone || '').slice(0, 20),
      clientCompany: String(clientCompany || '').slice(0, 100),
      services: Array.isArray(services) ? services.slice(0, 10).map(s => String(s).slice(0, 100)) : [],
      monthlyAmount: Number(monthlyAmount) || 0,
      currency: String(currency || 'TRY').slice(0, 5),
      startDate: start,
      nextRenewalDate: nextRenewal,
      notes: String(notes || '').slice(0, 500),
      contactMessageId: contactMessageId ? String(contactMessageId).slice(0, 50) : null,
      status: 'aktif',
      paymentHistory: [],
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(subscription);
    subscription._id = result.insertedId;
    return res.status(201).json(subscription);
  }

  // PUT — update subscription (also record payment)
  if (req.method === 'PUT') {
    const { id, action, ...updates } = req.body;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    if (action === 'record-payment') {
      const { amount, date, note } = updates;
      const payment = {
        amount: Number(amount) || 0,
        date: date ? new Date(date) : new Date(),
        note: String(note || '').slice(0, 200),
        recordedBy: user.username,
      };
      // Advance renewal date by 1 month
      const sub = await col.findOne({ _id: new ObjectId(id) });
      if (!sub) return res.status(404).json({ error: 'Abonelik bulunamadı' });
      const nextRenewal = new Date(sub.nextRenewalDate || new Date());
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      await col.updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { paymentHistory: payment },
          $set: { nextRenewalDate: nextRenewal, updatedAt: new Date() },
        }
      );
      return res.json({ success: true, nextRenewalDate: nextRenewal });
    }

    const allowed = ['clientName', 'clientEmail', 'clientPhone', 'clientCompany', 'services', 'monthlyAmount', 'currency', 'status', 'notes', 'nextRenewalDate'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    safeUpdates.updatedAt = new Date();

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: safeUpdates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Abonelik bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
