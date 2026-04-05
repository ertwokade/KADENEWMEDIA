import { ObjectId } from 'mongodb';
import { getDb } from './_lib/mongodb.js';
import { requireAuth } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const db = await getDb();
  const collection = db.collection('notes');

  // GET — belirli bir mesaja ait notları getir
  if (req.method === 'GET') {
    const messageId = req.query?.messageId;
    if (!messageId) {
      return res.status(400).json({ error: 'messageId gerekli' });
    }
    const notes = await collection
      .find({ messageId })
      .sort({ createdAt: -1 })
      .toArray();
    return res.status(200).json(notes);
  }

  // POST — yeni not ekle
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { messageId, text, type } = body || {};
    if (!messageId || !text?.trim()) {
      return res.status(400).json({ error: 'messageId ve text gerekli' });
    }

    const note = {
      messageId,
      text: text.trim(),
      type: type || 'note', // call, email, meeting, note
      createdBy: user.username,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(note);
    return res.status(201).json({ ...note, _id: result.insertedId });
  }

  // DELETE — not sil
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (!id) {
      return res.status(400).json({ error: 'id gerekli' });
    }
    await collection.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
