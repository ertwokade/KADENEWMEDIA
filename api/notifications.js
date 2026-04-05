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
  const action = req.query?.action;

  // ── Activity Log (GET /api/notifications?action=activity) ──
  if (action === 'activity') {
    if (req.method === 'GET') {
      const filter = req.query?.type;
      const match = filter && filter !== 'all' ? { type: filter } : {};
      const logs = await db.collection('activity_log')
        .find(match)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      return res.status(200).json(logs);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { action: logAction, detail, type, icon } = body || {};
      if (!logAction) return res.status(400).json({ error: 'action gerekli' });

      const log = {
        action: logAction,
        detail: detail || '',
        type: type || 'system',
        icon: icon || '⚙️',
        user: user.username,
        createdAt: new Date(),
      };
      await db.collection('activity_log').insertOne(log);
      return res.status(201).json(log);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    type: type || 'info',
    title,
    message,
    link: link || null,
    read: false,
    createdAt: new Date(),
  });
}

// Helper: Aktivite logu (diğer API'lerden çağrılabilir)
export async function logActivity(db, { action, detail, type, icon, user }) {
  await db.collection('activity_log').insertOne({
    action,
    detail: detail || '',
    type: type || 'system',
    icon: icon || '⚙️',
    user: user || 'sistem',
    createdAt: new Date(),
  });
}
