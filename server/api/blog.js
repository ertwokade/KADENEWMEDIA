import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { sanitizeBlogHtml, stripHtml } from './_lib/sanitize.js';
import { logActivity } from './notifications.js';

function sanitizePost(post) {
  if (!post) return post;
  return {
    ...post,
    titleTr: stripHtml(post.titleTr, 300),
    titleEn: stripHtml(post.titleEn, 300),
    excerptTr: stripHtml(post.excerptTr, 1000),
    excerptEn: stripHtml(post.excerptEn, 1000),
    category: stripHtml(post.category, 120),
    categoryEn: stripHtml(post.categoryEn, 120),
    contentTr: sanitizeBlogHtml(post.contentTr),
    contentEn: sanitizeBlogHtml(post.contentEn),
  };
}

function sanitizeBlogInput(input) {
  const clean = { ...input };
  for (const key of ['titleTr', 'titleEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 300);
  }
  for (const key of ['excerptTr', 'excerptEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 1000);
  }
  for (const key of ['category', 'categoryEn']) {
    if (clean[key] !== undefined) clean[key] = stripHtml(clean[key], 120);
  }
  if (clean.contentTr !== undefined) clean.contentTr = sanitizeBlogHtml(clean.contentTr);
  if (clean.contentEn !== undefined) clean.contentEn = sanitizeBlogHtml(clean.contentEn);
  return clean;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('blogs');

  // GET - List all blog posts (public)
  if (req.method === 'GET') {
    try {
      const now = new Date();
      const posts = await collection.find({
        $or: [
          { publishAt: { $exists: false } },
          { publishAt: null },
          { publishAt: { $lte: now } },
        ],
      }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(posts.map(sanitizePost));
    } catch (error) {
      console.error('Blog GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create new blog post (requires auth)
  if (req.method === 'POST') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const {
        titleTr, titleEn, excerptTr, excerptEn,
        contentTr, contentEn, category, categoryEn,
        image, color, readTime, slug, publishAt
      } = req.body;

      if (!titleTr || !slug) return res.status(400).json({ error: 'Başlık ve slug gerekli' });
      if (titleTr.length > 300) return res.status(400).json({ error: 'Başlık çok uzun (max 300)' });
      if (slug.length > 200) return res.status(400).json({ error: 'Slug çok uzun (max 200)' });
      if (contentTr && contentTr.length > 200000) return res.status(400).json({ error: 'İçerik çok uzun (max 200.000 karakter)' });

      const existing = await collection.findOne({ slug });
      if (existing) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });

      const post = sanitizeBlogInput({
        titleTr: titleTr || '', titleEn: titleEn || '',
        excerptTr: excerptTr || '', excerptEn: excerptEn || '',
        contentTr: contentTr || '', contentEn: contentEn || '',
        category: category || '', categoryEn: categoryEn || '',
        image: image || '', color: color || '#eac321',
        readTime: parseInt(readTime) || 5, slug,
        publishAt: publishAt ? new Date(publishAt) : null,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await collection.insertOne(post);
      logActivity(db, { action: 'Blog yazısı oluşturuldu', detail: `"${titleTr}"`, type: 'create', icon: '📝', user: user.username }).catch(() => {});
      return res.status(201).json({ ...post, _id: result.insertedId });
    } catch (error) {
      console.error('Blog POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update blog post (requires auth)
  if (req.method === 'PUT') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const { id, ...rawUpdateData } = req.body;
      if (!id) return res.status(400).json({ error: 'Post ID gerekli' });
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz Post ID' });

      const updateData = sanitizeBlogInput(rawUpdateData);
      updateData.updatedAt = new Date();
      if (updateData.readTime) updateData.readTime = parseInt(updateData.readTime);
      if (updateData.publishAt !== undefined) {
        updateData.publishAt = updateData.publishAt ? new Date(updateData.publishAt) : null;
      }

      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateData });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Post bulunamadı' });

      logActivity(db, { action: 'Blog yazısı güncellendi', detail: `"${updateData.titleTr || id}"`, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Post güncellendi' });
    } catch (error) {
      console.error('Blog PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete blog post (requires auth)
  if (req.method === 'DELETE') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Post ID gerekli' });
      if (!isValidObjectId(queryId)) return res.status(400).json({ error: 'Geçersiz Post ID' });

      const post = await collection.findOne({ _id: new ObjectId(queryId) });
      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Post bulunamadı' });

      logActivity(db, { action: 'Blog yazısı silindi', detail: `"${post?.titleTr || queryId}"`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Post silindi' });
    } catch (error) {
      console.error('Blog DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
