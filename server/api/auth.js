import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from './_lib/mongodb.js';
import { clearAuthCookies, createToken, requireAuth, setAuthCookies, setCsrfCookie } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { logActivity } from './notifications.js';

// Varsayılan admin bilgileri — .env'den alınır
const DEFAULT_ADMIN_USERNAME = 'kade';
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

// Brute-force koruması: IP başına login denemesi sınırı
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 dakika
const MAX_LOGIN_ATTEMPTS = 10;

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const action = req.query?.action || 'login';

  if (req.method === 'GET' && action === 'csrf') {
    const csrfToken = setCsrfCookie(req, res);
    return res.status(200).json({ csrfToken });
  }

  if (req.method === 'GET' && action === 'session') {
    const user = requireAuth(req);
    if (!user) return res.status(401).json({ authenticated: false });
    return res.status(200).json({
      authenticated: true,
      user: { username: user.username, role: user.role },
    });
  }

  if (req.method === 'POST' && action === 'logout') {
    clearAuthCookies(req, res);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (action === 'change-password') {
    return handleChangePassword(req, res);
  }

  return handleLogin(req, res);
}

// ========== LOGIN ==========
async function handleLogin(req, res) {
  const rl = await rateLimitCheck(req, {
    namespace: 'login',
    windowMs: LOGIN_WINDOW_MS,
    maxRequests: MAX_LOGIN_ATTEMPTS,
  });
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Çok fazla giriş denemesi. Lütfen ${rl.retryAfter} dakika sonra tekrar deneyin.`,
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{1,30}$/.test(username)) {
      return res.status(400).json({ error: 'Geçersiz kullanıcı adı formatı' });
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
    }

    const defaultPwMatches = DEFAULT_ADMIN_PASSWORD
      ? (() => {
          try {
            const a = Buffer.from(password || '');
            const b = Buffer.from(DEFAULT_ADMIN_PASSWORD);
            return a.length === b.length && crypto.timingSafeEqual(a, b);
          } catch { return false; }
        })()
      : false;
    if (!valid && username === DEFAULT_ADMIN_USERNAME && defaultPwMatches) {
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
    const csrfToken = setAuthCookies(req, res, token);

    logActivity(db, { action: 'Admin girişi yapıldı', detail: `${user.username} giriş yaptı`, type: 'system', icon: '🔐', user: user.username }).catch(() => {});

    return res.status(200).json({
      csrfToken,
      user: {
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login hatası:', error.message, 'code:', error.code);
    const msg = error.message || '';
    if (
      msg.includes('bad auth') || error.code === 8000 ||
      msg.includes('Authentication failed') ||
      msg.includes('MONGODB_URI') ||
      msg.includes('tanımlı değil')
    ) {
      return res.status(500).json({ error: 'Veritabanı bağlantı hatası. Lütfen yöneticinize başvurun.' });
    }
    if (msg.includes('timed out') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || error.name === 'MongoNetworkError') {
      return res.status(503).json({ error: 'Veritabanına ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.' });
    }
    return res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
  }
}

// ========== CHANGE PASSWORD ==========
async function handleChangePassword(req, res) {
  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({ error: 'Yeni şifre en az 12 karakter olmalı' });
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
