import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { createNotification, logActivity } from './_lib/notify.js';

// Diğer API dosyaları bu iki fonksiyonu tarihsel olarak './notifications.js'ten
// import ediyor; tek kaynak _lib/notify.js olacak şekilde burada yeniden export
// ediliyor (önceden burada ayrı, senkron olmayan bir kopyaları vardı).
export { createNotification, logActivity };

function mapActivityLog(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    action: row.action,
    detail: row.detail,
    type: row.type,
    icon: row.icon,
    user: row.user,
    targetType: row.target_type,
    targetId: row.target_id,
    before: row.before,
    after: row.after,
    createdAt: row.created_at,
  };
}

function mapNotification(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    read: row.read,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const supabase = getSupabase();
  const action = req.query?.action;

  // ── Activity Log (GET /api/notifications?action=activity) ──
  if (action === 'activity') {
    const user = await requirePermission(req, res, 'activity', { write: req.method !== 'GET' });
    if (!user) return;

    if (req.method === 'GET') {
      const filter = req.query?.type;
      let query = supabase.from('kade_activity_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (filter && filter !== 'all') query = query.eq('type', filter);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json((data || []).map(mapActivityLog));
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { action: logAction, detail, type, icon } = body || {};
      if (!logAction) return res.status(400).json({ error: 'action gerekli' });

      const { data, error } = await supabase.from('kade_activity_log').insert({
        action: logAction,
        detail: detail || '',
        type: type || 'system',
        icon: icon || '⚙️',
        user: user.username,
      }).select().single();
      if (error) throw error;
      return res.status(201).json(mapActivityLog(data));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requirePermission(req, res, 'dashboard');
  if (!user) return;

  // GET — bildirimleri getir
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('kade_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.status(200).json((data || []).map(mapNotification));
  }

  // PUT — okundu işaretle
  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { id, markAllRead } = body || {};

    if (markAllRead) {
      const { error } = await supabase
        .from('kade_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { error } = await supabase
        .from('kade_notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'id veya markAllRead gerekli' });
  }

  // DELETE — bildirim sil
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ error: 'id gerekli' });
    }
    if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_notifications').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
