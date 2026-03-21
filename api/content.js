import { getDb } from '../lib/mongodb.js';
import { requireAuth } from '../lib/auth.js';
import { cors } from '../lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('siteContent');

  // GET - Get site content (public)
  if (req.method === 'GET') {
    try {
      const section = req.query.section;
      if (section) {
        const content = await collection.findOne({ section });
        return res.status(200).json(content || { section, data: {} });
      }
      const allContent = await collection.find({}).toArray();
      return res.status(200).json(allContent);
    } catch (error) {
      console.error('Content GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update site content (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { section, data } = req.body;

      if (!section || !data) {
        return res.status(400).json({ error: 'Section ve data gerekli' });
      }

      await collection.updateOne(
        { section },
        {
          $set: {
            section,
            data,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return res.status(200).json({ message: 'İçerik güncellendi' });
    } catch (error) {
      console.error('Content PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
