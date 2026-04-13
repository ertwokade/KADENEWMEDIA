import { cors } from './_lib/cors.js';
import { getDb } from './_lib/mongodb.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, score, platforms, usernames, categories } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Geçerli bir e-posta adresi gerekli.' });
    }

    const db = await getDb();

    // Save lead
    await db.collection('analyzer_leads').insertOne({
      email: email.trim().toLowerCase(),
      score,
      platforms,
      usernames,
      categories,
      createdAt: new Date(),
      source: 'social-media-analyzer',
      status: 'new',
    });

    // Also add to messages collection as a lead for admin panel visibility
    await db.collection('messages').insertOne({
      name: email.split('@')[0],
      email: email.trim().toLowerCase(),
      phone: '',
      company: '',
      service: 'Sosyal Medya Analiz',
      message: `Sosyal Medya Analiz Aracı Lead - Skor: ${score}/100\nPlatformlar: ${platforms?.join(', ')}\nKullanıcı adları: ${JSON.stringify(usernames)}`,
      source: 'analyzer',
      status: 'new',
      read: false,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Analyzer lead error:', err);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
