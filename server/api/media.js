import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { validateMediaUpload } from './_lib/uploadValidation.js';

const LIST_COLUMNS = 'id, name, mime_type, type, size_bytes, alt, tags, uploaded_by, created_at, updated_at';

function rowToMedia(row) {
  if (!row) return row;
  const item = {
    _id: row.id,
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    type: row.type,
    sizeBytes: row.size_bytes,
    alt: row.alt,
    tags: row.tags,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.data !== undefined) item.data = row.data;
  return item;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, ['media', 'content'], { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();

  // GET — list media or single item (include file payload when action=file)
  if (req.method === 'GET') {
    const { id, type, search, action } = req.query;
    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      if (action === 'file') {
        const { data: item, error } = await supabase.from('kade_media').select('data, mime_type, name').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!item) return res.status(404).json({ error: 'Medya bulunamadı' });
        return res.json({ data: item.data, mimeType: item.mime_type, name: item.name });
      }
      const { data: item, error } = await supabase.from('kade_media').select(LIST_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw error;
      if (!item) return res.status(404).json({ error: 'Medya bulunamadı' });
      return res.json(rowToMedia(item));
    }

    let query = supabase.from('kade_media').select(LIST_COLUMNS);
    if (type) query = query.eq('type', type);
    if (search) query = query.ilike('name', `%${String(search).slice(0, 100)}%`);

    const { data: items, error } = await query.order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return res.json(items.map(rowToMedia));
  }

  // POST — upload media (base64)
  if (req.method === 'POST') {
    const { name, data, mimeType, alt, tags } = req.body;

    if (typeof name !== 'string' || !name.trim() || !data || !mimeType) {
      return res.status(400).json({ error: 'Dosya adı, veri ve MIME türü zorunludur' });
    }
    const validation = validateMediaUpload(data, mimeType);
    if (!validation.ok) return res.status(validation.status).json({ error: validation.error });

    const sizeBytes = validation.sizeBytes;
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    const row = {
      name: name.trim().slice(0, 200),
      mime_type: mimeType,
      type: isImage ? 'image' : isVideo ? 'video' : 'document',
      size_bytes: sizeBytes,
      alt: String(alt || '').slice(0, 200),
      tags: Array.isArray(tags) ? tags.slice(0, 10).map(t => String(t).slice(0, 50)) : [],
      data,
      uploaded_by: user.username,
    };

    const { data: created, error } = await supabase.from('kade_media').insert(row).select(LIST_COLUMNS).single();
    if (error) throw error;
    return res.status(201).json(rowToMedia(created));
  }

  // PUT — update metadata
  if (req.method === 'PUT') {
    const { id, alt, name, tags } = req.body;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const updates = { updated_at: new Date().toISOString() };
    if (alt !== undefined) updates.alt = String(alt).slice(0, 200);
    if (name !== undefined) updates.name = String(name).slice(0, 200);
    if (Array.isArray(tags)) updates.tags = tags.slice(0, 10).map(t => String(t).slice(0, 50));

    const { data, error } = await supabase.from('kade_media').update(updates).eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Medya bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE — single or bulk
  if (req.method === 'DELETE') {
    const { id, ids } = req.query;

    if (ids) {
      const idList = ids.split(',').filter(i => isValidUuid(i));
      if (idList.length === 0) return res.status(400).json({ error: 'Geçersiz ID listesi' });
      const { data, error } = await supabase.from('kade_media').delete().in('id', idList).select('id');
      if (error) throw error;
      return res.json({ deleted: data?.length || 0 });
    }

    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { error } = await supabase.from('kade_media').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    return res.status(400).json({ error: 'ID veya IDs zorunludur' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
