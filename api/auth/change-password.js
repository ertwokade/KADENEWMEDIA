import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/mongodb.js';
import { requireAuth } from '../_lib/auth.js';
import { cors } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Yeni şifre en az 4 karakter olmalı' });
    }

    const db = await getDb();
    const dbUser = await db.collection('users').findOne({ username: user.username });

    if (!dbUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) {
      return res.status(401).json({ error: 'Mevcut şifre hatalı' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { username: user.username },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    return res.status(200).json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
