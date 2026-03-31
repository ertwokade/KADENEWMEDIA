import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { ObjectId } from 'mongodb';

const VALID_STATUSES = ['yeni', 'gorusme-bekliyor', 'teklif-gonderildi', 'kazanildi', 'kaybedildi'];

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const db = await getDb();
  const collection = db.collection('messages');

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
      const { id, status } = req.body;
      const update = {};

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({ error: 'Geçersiz durum değeri' });
        }
        update.status = status;
      } else {
        update.read = true;
      }

      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );
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
      await collection.deleteOne({ _id: new ObjectId(queryId) });
      return res.status(200).json({ message: 'Mesaj silindi' });
    } catch (error) {
      console.error('Messages DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
