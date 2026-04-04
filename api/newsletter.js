import { getDb } from './_lib/mongodb.js';
import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }

  try {
    const db = await getDb();
    const collection = db.collection('newsletter');

    const existing = await collection.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }

    await collection.insertOne({
      email: email.toLowerCase(),
      createdAt: new Date(),
      source: 'website',
    });

    return res.status(200).json({ message: 'Aboneliğiniz başarıyla oluşturuldu!' });
  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: 'Bir hata oluştu, lütfen tekrar deneyin.' });
  }
}
