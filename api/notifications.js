import { ObjectId } from 'mongodb';
import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const db = await getDb();
  const collection = db.collection('notifications');

  // GET — bildirimleri getir
  if (req.method === 'GET') {
    const notifications = await collection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return res.status(200).json(notifications);
  }

  // PUT — okundu işaretle
  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { id, markAllRead } = body || {};

    if (markAllRead) {
      await collection.updateMany(
        { userId: user.id, read: false },
        { $set: { read: true } }
      );
      return res.status(200).json({ success: true });
    }

    if (id) {
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { read: true } }
      );
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'id veya markAllRead gerekli' });
  }

  // DELETE — bildirim sil
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ error: 'id gerekli' });
    }
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Helper: Bildirim oluşturma (diğer API'lerden çağrılabilir)
export async function createNotification(db, { userId, type, title, message, link }) {
  await db.collection('notifications').insertOne({
    userId,
    type: type || 'info', // info, message, calendar, system
    title,
    message,
    link: link || null,
    read: false,
    createdAt: new Date(),
  });
}
