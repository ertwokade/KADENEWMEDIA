import { ObjectId } from 'mongodb';
import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('partners');

  // GET - List all partners (public)
  if (req.method === 'GET') {
    try {
      const partners = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(partners);
    } catch (error) {
      console.error('Partners GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create partner (requires auth)
  if (req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      // Slug'dan id oluştur — detail sayfası URL'i için gerekli
      const slug = req.body.slug || (req.body.name || '').toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const partner = { ...req.body, id: slug, createdAt: new Date(), updatedAt: new Date() };
      const result = await collection.insertOne(partner);
      logActivity(db, { action: 'Partner eklendi', detail: `${req.body.name || ''}`, type: 'create', icon: '🤝', user: user.username }).catch(() => {});
      return res.status(201).json({ ...partner, _id: result.insertedId });
    } catch (error) {
      console.error('Partners POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update partner (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const { _id, ...updateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'Partner ID gerekli' });

      updateData.updatedAt = new Date();
      const result = await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Partner bulunamadı' });

      logActivity(db, { action: 'Partner güncellendi', detail: `${updateData.name || _id}`, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Partner güncellendi' });
    } catch (error) {
      console.error('Partners PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete partner (requires auth)
  if (req.method === 'DELETE') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Partner ID gerekli' });

      const partner = await collection.findOne({ _id: new ObjectId(queryId) });
      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Partner bulunamadı' });

      logActivity(db, { action: 'Partner silindi', detail: `${partner?.name || queryId}`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Partner silindi' });
    } catch (error) {
      console.error('Partners DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
