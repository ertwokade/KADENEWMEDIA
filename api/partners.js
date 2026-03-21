import { ObjectId } from 'mongodb';
import { getDb } from '../lib/mongodb.js';
import { requireAuth } from '../lib/auth.js';
import { cors } from '../lib/cors.js';

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
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const partner = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(partner);
      return res.status(201).json({ ...partner, _id: result.insertedId });
    } catch (error) {
      console.error('Partners POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update partner (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Partner ID gerekli' });
      }

      updateData.updatedAt = new Date();

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Partner bulunamadı' });
      }

      return res.status(200).json({ message: 'Partner güncellendi' });
    } catch (error) {
      console.error('Partners PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete partner (requires auth)
  if (req.method === 'DELETE') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const queryId = req.body?.id || req.query.id;

      if (!queryId) {
        return res.status(400).json({ error: 'Partner ID gerekli' });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Partner bulunamadı' });
      }

      return res.status(200).json({ message: 'Partner silindi' });
    } catch (error) {
      console.error('Partners DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
