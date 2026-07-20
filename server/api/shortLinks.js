import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LINK_FIELDS = new Set(['slug', 'target', 'label', 'active']);

function sanitizeLinkUpdate(value) {
  const clean = Object.fromEntries(Object.entries(value || {}).filter(([key]) => LINK_FIELDS.has(key)));
  if (clean.slug !== undefined) {
    if (typeof clean.slug !== 'string' || clean.slug.length > 40 || !SLUG_RE.test(clean.slug)) return null;
  }
  if (clean.target !== undefined) {
    if (typeof clean.target !== 'string' || !/^https?:\/\//i.test(clean.target)) return null;
    clean.target = clean.target.trim().slice(0, 2000);
  }
  if (clean.label !== undefined) clean.label = String(clean.label).trim().slice(0, 100);
  if (clean.active !== undefined) clean.active = Boolean(clean.active);
  return clean;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('shortLinks');

  // GET - public resolve by slug, or admin list of all short links
  if (req.method === 'GET') {
    try {
      const slug = req.query?.slug;
      if (slug) {
        if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Geçersiz slug' });
        const link = await collection.findOne({ slug, active: { $ne: false } });
        if (!link) return res.status(404).json({ error: 'Link bulunamadı' });
        return res.status(200).json({ slug: link.slug, target: link.target });
      }

      const user = await requirePermission(req, res, 'shortLinks');
      if (!user) return;
      const links = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(links);
    } catch (error) {
      console.error('ShortLinks GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - create link, or record a click (?action=click, public)
  if (req.method === 'POST') {
    if (req.query?.action === 'click') {
      try {
        const slug = req.body?.slug;
        if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Geçersiz slug' });
        await collection.updateOne({ slug }, { $inc: { clicks: 1 }, $set: { lastClickAt: new Date() } });
        return res.status(204).end();
      } catch (error) {
        console.error('ShortLinks click error:', error);
        return res.status(500).json({ error: 'Sunucu hatası' });
      }
    }

    const user = await requirePermission(req, res, 'shortLinks', { write: true });
    if (!user) return;

    try {
      const clean = sanitizeLinkUpdate(req.body);
      if (!clean) return res.status(400).json({ error: 'Link verisi geçersiz' });
      if (!clean.slug) return res.status(400).json({ error: 'Slug gerekli' });
      if (!clean.target) return res.status(400).json({ error: 'Hedef URL gerekli' });

      const existing = await collection.findOne({ slug: clean.slug });
      if (existing) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });

      const link = {
        slug: clean.slug,
        target: clean.target,
        label: clean.label || '',
        active: clean.active !== false,
        clicks: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await collection.insertOne(link);
      logActivity(db, { action: 'Kısa link oluşturuldu', detail: link.slug, type: 'create', icon: '🔗', user: user.username }).catch(() => {});
      return res.status(201).json({ ...link, _id: result.insertedId });
    } catch (error) {
      console.error('ShortLinks POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update link (requires auth)
  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'shortLinks', { write: true });
    if (!user) return;

    try {
      const { _id, ...rawUpdateData } = req.body || {};
      if (!_id) return res.status(400).json({ error: 'Link ID gerekli' });
      if (!isValidObjectId(_id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const updateData = sanitizeLinkUpdate(rawUpdateData);
      if (!updateData) return res.status(400).json({ error: 'Link verisi geçersiz' });

      if (updateData.slug) {
        const clash = await collection.findOne({ slug: updateData.slug, _id: { $ne: new ObjectId(_id) } });
        if (clash) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });
      }

      updateData.updatedAt = new Date();
      const result = await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Link bulunamadı' });

      logActivity(db, { action: 'Kısa link güncellendi', detail: updateData.slug || _id, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Link güncellendi' });
    } catch (error) {
      console.error('ShortLinks PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete link (requires auth)
  if (req.method === 'DELETE') {
    const user = await requirePermission(req, res, 'shortLinks', { write: true });
    if (!user) return;

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Link ID gerekli' });
      if (!isValidObjectId(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });

      const link = await collection.findOne({ _id: new ObjectId(queryId) });
      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Link bulunamadı' });

      logActivity(db, { action: 'Kısa link silindi', detail: link?.slug || queryId, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Link silindi' });
    } catch (error) {
      console.error('ShortLinks DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
