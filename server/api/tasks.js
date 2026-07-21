import { getSupabase, isValidUuid } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

function mapTask(row) {
  if (!row) return row;
  return {
    _id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assigned_to,
    assignedBy: row.assigned_by,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    relatedMessageId: row.related_message_id,
    relatedClientName: row.related_client_name,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, 'tasks', { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();

  // GET — list or single
  if (req.method === 'GET') {
    const { id, assignedTo, status, priority } = req.query;
    if (id) {
      if (!isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const { data, error } = await supabase.from('kade_tasks').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Görev bulunamadı' });
      return res.json(mapTask(data));
    }
    let query = supabase.from('kade_tasks').select('*').order('created_at', { ascending: false });
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    const { data, error } = await query;
    if (error) throw error;
    return res.json(data.map(mapTask));
  }

  // POST — create task
  if (req.method === 'POST') {
    const { title, description, assignedTo, dueDate, priority, relatedMessageId, relatedClientName } = req.body;

    if (!title) return res.status(400).json({ error: 'Görev başlığı zorunludur' });

    const validPriorities = ['dusuk', 'orta', 'yuksek', 'acil'];
    const task = {
      title: String(title).slice(0, 200),
      description: String(description || '').slice(0, 1000),
      assigned_to: String(assignedTo || '').slice(0, 100),
      assigned_by: user.username,
      due_date: dueDate ? new Date(dueDate) : null,
      priority: validPriorities.includes(priority) ? priority : 'orta',
      status: 'beklemede',
      related_message_id: relatedMessageId ? String(relatedMessageId).slice(0, 50) : null,
      related_client_name: String(relatedClientName || '').slice(0, 100),
      completed_at: null,
    };

    const { data, error } = await supabase.from('kade_tasks').insert(task).select().single();
    if (error) throw error;
    return res.status(201).json(mapTask(data));
  }

  // PUT — update task
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const allowed = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'relatedClientName'];
    const columnMap = {
      title: 'title',
      description: 'description',
      assignedTo: 'assigned_to',
      dueDate: 'due_date',
      priority: 'priority',
      status: 'status',
      relatedClientName: 'related_client_name',
    };
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[columnMap[key]] = updates[key];
    }
    if (updates.status === 'tamamlandi') safeUpdates.completed_at = new Date();
    safeUpdates.updated_at = new Date();

    const { data, error } = await supabase.from('kade_tasks').update(safeUpdates).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Görev bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    const { error } = await supabase.from('kade_tasks').delete().eq('id', id);
    if (error) throw error;
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
