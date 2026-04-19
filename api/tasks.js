import { ObjectId } from 'mongodb';
import { getDb, isValidObjectId } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) return res.status(401).json({ error: 'Yetkisiz erişim' });

  const db = await getDb();
  const col = db.collection('tasks');

  // GET — list or single
  if (req.method === 'GET') {
    const { id, assignedTo, status, priority } = req.query;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
      const item = await col.findOne({ _id: new ObjectId(id) });
      if (!item) return res.status(404).json({ error: 'Görev bulunamadı' });
      return res.json(item);
    }
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    const items = await col.find(filter).sort({ createdAt: -1 }).toArray();
    return res.json(items);
  }

  // POST — create task
  if (req.method === 'POST') {
    const { title, description, assignedTo, dueDate, priority, relatedMessageId, relatedClientName } = req.body;

    if (!title) return res.status(400).json({ error: 'Görev başlığı zorunludur' });

    const validPriorities = ['dusuk', 'orta', 'yuksek', 'acil'];
    const task = {
      title: String(title).slice(0, 200),
      description: String(description || '').slice(0, 1000),
      assignedTo: String(assignedTo || '').slice(0, 100),
      assignedBy: user.username,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: validPriorities.includes(priority) ? priority : 'orta',
      status: 'beklemede',
      relatedMessageId: relatedMessageId ? String(relatedMessageId).slice(0, 50) : null,
      relatedClientName: String(relatedClientName || '').slice(0, 100),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await col.insertOne(task);
    task._id = result.insertedId;
    return res.status(201).json(task);
  }

  // PUT — update task
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });

    const allowed = ['title', 'description', 'assignedTo', 'dueDate', 'priority', 'status', 'relatedClientName'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    if (updates.status === 'tamamlandi') safeUpdates.completedAt = new Date();
    safeUpdates.updatedAt = new Date();

    const result = await col.updateOne({ _id: new ObjectId(id) }, { $set: safeUpdates });
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Görev bulunamadı' });
    return res.json({ success: true });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || !isValidObjectId(id)) return res.status(400).json({ error: 'Geçersiz ID' });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
