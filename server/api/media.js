import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

const MAX_BASE64_SIZE = 2 * 1024 * 1024; // 2MB base64 limit

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const db = await getDb();
  const col = db.collection('media');

  // GET — list media or single item (include file payload when action=file)
  if (req.method === 'GET') {
    const { id, type, search, action } = req.query;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      if (action === 'file') {
        const item = await col.findOne({ _id: new ObjectId(id) });
        if (!item) return res.status(404).json({ error: 'Medya bulunamadı' });
        return res.json({ data: item.data, mimeType: item.mimeType, name: item.name });
      }
      const item = await col.findOne({ _id: new ObjectId(id) }, { projection: { data: 0 } });
      if (!item) return res.status(404).json({ error: 'Medya bulunamadı' });
      return res.json(item);
    }

    const filter = {};
    if (type) filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const items = await col.find(filter, { projection: { data: 0 } })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    return res.json(items);
  }

  // POST — upload media (base64)
  if (req.method === 'POST') {
    const { name, data, mimeType, alt, tags } = req.body;

    if (!name || !data || !mimeType) {
      return res.status(400).json({ error: 'Dosya adı, veri ve MIME türü zorunludur' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'application/pdf'];
    if (!allowedMimes.includes(mimeType)) {
      return res.status(400).json({ error: 'Desteklenmeyen dosya türü' });
    }

    if (data.length > MAX_BASE64_SIZE * 1.4) {
      return res.status(413).json({ error: 'Dosya boyutu çok büyük (max 2MB)' });
    }

    const sizeBytes = Math.round((data.length * 3) / 4);
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    const media = {
      name: String(name).slice(0, 200),
      mimeType,
      type: isImage ? 'image' : isVideo ? 'video' : 'document',
      sizeBytes,
      alt: String(alt || '').slice(0, 200),
      tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).slice(0, 50)) : [],
      data,
      uploadedBy: user.username,
      createdAt: new Date(),
    };

    const result = await col.insertOne(media);
    const { data: _d, ...publicItem } = media;
    publicItem._id = result.insertedId;
    return res.status(201).json(publicItem);
  }

  // GET data — get actual base64 for a specific item (separate endpoint pattern)
  // PUT — update metadata
  if (req.method === 'PUT') {
    const { id, alt, name, tags } = req.body;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const updates = { updatedAt: new Date() };
    if (alt !== undefined) updates.alt = String(alt).slice(0, 200);
    if (name !== undefined) updates.name = String(name).slice(0, 200);
    if (Array.isArray(tags)) updates.tags = tags.slice(0, 10).map(t => String(t).slice(0, 50));

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Medya bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE — single or bulk
  if (req.method === 'DELETE') {
    const { id, ids } = req.query;

    if (ids) {
      const idList = ids.split(',').filter(i => isValidObjectId(i)).map(i => new ObjectId(i));
      if (idList.length === 0) return res.status(400).json({ error: 'Geçersiz ID listesi' });
      const result = await col.deleteMany({ _id: { $in: idList } });
      return res.json({ deleted: result.deletedCount });
    }

    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'ID veya IDs zorunludur' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
