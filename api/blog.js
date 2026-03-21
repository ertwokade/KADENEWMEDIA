import { ObjectId } from 'mongodb';
import { getDb } from '../_lib/mongodb.js';
import { requireAuth } from '../_lib/auth.js';
import { cors } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('blogs');

  // GET - List all blog posts (public)
  if (req.method === 'GET') {
    try {
      const posts = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(posts);
    } catch (error) {
      console.error('Blog GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create new blog post (requires auth)
  if (req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const {
        titleTr, titleEn, excerptTr, excerptEn,
        contentTr, contentEn, category, categoryEn,
        image, color, readTime, slug
      } = req.body;

      if (!titleTr || !slug) {
        return res.status(400).json({ error: 'Başlık ve slug gerekli' });
      }

      const existing = await collection.findOne({ slug });
      if (existing) {
        return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
      }

      const post = {
        titleTr: titleTr || '',
        titleEn: titleEn || '',
        excerptTr: excerptTr || '',
        excerptEn: excerptEn || '',
        contentTr: contentTr || '',
        contentEn: contentEn || '',
        category: category || '',
        categoryEn: categoryEn || '',
        image: image || '📝',
        color: color || '#FFD700',
        readTime: parseInt(readTime) || 5,
        slug,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(post);
      return res.status(201).json({ ...post, _id: result.insertedId });
    } catch (error) {
      console.error('Blog POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update blog post (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Post ID gerekli' });
      }

      updateData.updatedAt = new Date();
      if (updateData.readTime) updateData.readTime = parseInt(updateData.readTime);

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Post bulunamadı' });
      }

      return res.status(200).json({ message: 'Post güncellendi' });
    } catch (error) {
      console.error('Blog PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete blog post (requires auth)
  if (req.method === 'DELETE') {
    const user = requireAuth(req);
    if (!user) {
      return res.status(401).json({ error: 'Yetkisiz erişim' });
    }

    try {
      const { id } = req.body || {};
      const queryId = id || req.query.id;

      if (!queryId) {
        return res.status(400).json({ error: 'Post ID gerekli' });
      }

      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Post bulunamadı' });
      }

      return res.status(200).json({ message: 'Post silindi' });
    } catch (error) {
      console.error('Blog DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
