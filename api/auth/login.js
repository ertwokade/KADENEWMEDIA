import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/mongodb.js';
import { createToken } from '../_lib/auth.js';
import { cors } from '../_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse body if needed
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = createToken({ id: user._id.toString(), username: user.username, role: user.role });

    return res.status(200).json({
      token,
      user: {
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}
