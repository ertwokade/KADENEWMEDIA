import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const LINK_FIELDS = new Set(['label', 'url', 'icon']);

function sanitizeLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const clean = Object.fromEntries(Object.entries(item).filter(([key]) => LINK_FIELDS.has(key)));
      if (typeof clean.label !== 'string' || typeof clean.url !== 'string') return null;
      clean.label = clean.label.trim().slice(0, 60);
      clean.url = clean.url.trim().slice(0, 500);
      clean.icon = typeof clean.icon === 'string' ? clean.icon.trim().slice(0, 30) : 'custom';
      if (!clean.label || !/^https?:\/\//i.test(clean.url)) return null;
      return clean;
    })
    .filter(Boolean)
    .slice(0, 20);
}

const PROFILE_FIELDS = new Set(['slug', 'name', 'handle', 'tagline', 'photo', 'links', 'active', 'accentColor']);

export function sanitizeProfileUpdate(value) {
  const clean = Object.fromEntries(Object.entries(value || {}).filter(([key]) => PROFILE_FIELDS.has(key)));
  if (clean.slug !== undefined) {
    if (typeof clean.slug !== 'string' || clean.slug.length > 80 || !SLUG_RE.test(clean.slug)) return null;
  }
  if (clean.name !== undefined) clean.name = String(clean.name).trim().slice(0, 100);
  if (clean.handle !== undefined) clean.handle = String(clean.handle).trim().slice(0, 60);
  if (clean.tagline !== undefined) clean.tagline = String(clean.tagline).trim().slice(0, 160);
  if (clean.photo !== undefined) clean.photo = String(clean.photo).slice(0, 2_000_000);
  if (clean.links !== undefined) clean.links = sanitizeLinks(clean.links);
  if (clean.active !== undefined) clean.active = Boolean(clean.active);
  if (clean.accentColor !== undefined) {
    clean.accentColor = HEX_COLOR_RE.test(clean.accentColor) ? clean.accentColor : '#d4943f';
  }
  return clean;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const db = await getDb();
  const collection = db.collection('linkProfiles');

  // GET - public single profile by slug, or admin list of all profiles
  if (req.method === 'GET') {
    try {
      const slug = req.query?.slug;
      if (slug) {
        if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Geçersiz slug' });
        const profile = await collection.findOne({ slug, active: { $ne: false } });
        if (!profile) return res.status(404).json({ error: 'Profil bulunamadı' });
        return res.status(200).json(profile);
      }

      const user = await requirePermission(req, res, 'linkProfiles');
      if (!user) return;
      const profiles = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(profiles);
    } catch (error) {
      console.error('LinkProfiles GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create profile (requires auth)
  if (req.method === 'POST') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const clean = sanitizeProfileUpdate(req.body);
      if (!clean) return res.status(400).json({ error: 'Profil verisi geçersiz' });
      if (!clean.slug) return res.status(400).json({ error: 'Slug gerekli' });
      if (!clean.name?.trim()) return res.status(400).json({ error: 'İsim gerekli' });

      const existing = await collection.findOne({ slug: clean.slug });
      if (existing) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });

      const profile = {
        slug: clean.slug,
        name: clean.name || '',
        handle: clean.handle || '',
        tagline: clean.tagline || '',
        photo: clean.photo || '',
        links: clean.links || [],
        active: clean.active !== false,
        accentColor: clean.accentColor || '#d4943f',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await collection.insertOne(profile);
      logActivity(db, { action: 'Link profili oluşturuldu', detail: profile.name, type: 'create', icon: '🔗', user: user.username }).catch(() => {});
      return res.status(201).json({ ...profile, _id: result.insertedId });
    } catch (error) {
      console.error('LinkProfiles POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update profile (requires auth)
  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const { _id, ...rawUpdateData } = req.body || {};
      if (!_id) return res.status(400).json({ error: 'Profil ID gerekli' });
      if (!isValidObjectId(_id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const updateData = sanitizeProfileUpdate(rawUpdateData);
      if (!updateData) return res.status(400).json({ error: 'Profil verisi geçersiz' });

      if (updateData.slug) {
        const clash = await collection.findOne({ slug: updateData.slug, _id: { $ne: new ObjectId(_id) } });
        if (clash) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });
      }

      updateData.updatedAt = new Date();
      const result = await collection.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
      if (result.matchedCount === 0) return res.status(404).json({ error: 'Profil bulunamadı' });

      logActivity(db, { action: 'Link profili güncellendi', detail: updateData.name || _id, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Profil güncellendi' });
    } catch (error) {
      console.error('LinkProfiles PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete profile (requires auth)
  if (req.method === 'DELETE') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Profil ID gerekli' });
      if (!isValidObjectId(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });

      const profile = await collection.findOne({ _id: new ObjectId(queryId) });
      const result = await collection.deleteOne({ _id: new ObjectId(queryId) });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'Profil bulunamadı' });

      logActivity(db, { action: 'Link profili silindi', detail: profile?.name || queryId, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Profil silindi' });
    } catch (error) {
      console.error('LinkProfiles DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
