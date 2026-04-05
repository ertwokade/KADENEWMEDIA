import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/mongodb.js';
import { createToken } from '../_lib/auth.js';
import { cors } from '../_lib/cors.js';

// Varsayılan admin bilgileri — .env'den alınır, yoksa fallback
const DEFAULT_ADMIN_USERNAME = 'kade';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'KadeAdmin2026!';

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

    // Veritabanında hiç kullanıcı yoksa otomatik admin oluştur
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      console.log('📦 Veritabanında kullanıcı yok — varsayılan admin oluşturuluyor...');
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await db.collection('users').insertOne({
        username: DEFAULT_ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
      console.log(`✅ Admin kullanıcısı oluşturuldu: ${DEFAULT_ADMIN_USERNAME}`);
    }

    const user = await db.collection('users').findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch (bcryptErr) {
      console.error('bcrypt compare hatası:', bcryptErr.message);
      // Hash bozuksa valid = false kalır, aşağıda ele alınır
    }

    // Varsayılan admin kullanıcısı için: şifre hash'i uyumsuzsa ve
    // girilen şifre beklenen varsayılan şifreyle eşleşiyorsa,
    // hash'i yeniden oluştur ve güncelle
    if (!valid && username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
      console.log('🔄 Admin şifre hash\'i uyumsuz — yeniden oluşturuluyor...');
      const newHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: newHash } }
      );
      valid = true;
      console.log('✅ Admin şifre hash\'i güncellendi');
    }

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
    console.error('Login hatası:', error);
    // MongoDB authentication hatası kontrolü
    if (error.message?.includes('bad auth') || error.code === 8000) {
      return res.status(500).json({ 
        error: 'Veritabanı bağlantı hatası: MongoDB Atlas kullanıcı adı veya şifresi yanlış. Lütfen MONGODB_URI ortam değişkenini kontrol edin.' 
      });
    }
    return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}
