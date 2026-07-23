import bcrypt from 'bcryptjs';
import { getSupabase } from './_lib/supabase.js';
import { clearAuthCookies, createToken, getAuthorizedUser, getDefaultPermissions, requireAuth, setAuthCookies, setCsrfCookie } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { rateLimitCheck } from './_lib/rateLimit.js';
import { logActivity } from './notifications.js';

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
    const user = await getAuthorizedUser(req);
    if (!user) return res.status(200).json({ authenticated: false });
    return res.status(200).json({
      authenticated: true,
      user: { username: user.username, role: user.role, permissions: user.permissions || getDefaultPermissions(user.role) },
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
    logActivity({
      action: 'Giriş denemesi engellendi (rate limit)',
      detail: `${MAX_LOGIN_ATTEMPTS} başarısız denemeden sonra ${LOGIN_WINDOW_MS / 60000} dk için engellendi`,
      type: 'security',
      icon: '🚫',
      user: 'sistem',
    }).catch(() => {});
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

    const supabase = getSupabase();

    const { count: userCount, error: countError } = await supabase
      .from('kade_users')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;
    if (!userCount) {
      return res.status(503).json({ error: 'Yönetici hesabı yapılandırılmamış. Güvenli seed işlemini çalıştırın.' });
    }

    const { data: user, error: findError } = await supabase
      .from('kade_users')
      .select('id, username, password_hash, role, session_version')
      .eq('username', username)
      .maybeSingle();
    if (findError) throw findError;

    if (!user) {
      logActivity({ action: 'Başarısız giriş denemesi', detail: `Bilinmeyen kullanıcı adı: ${username}`, type: 'security', icon: '⚠️', user: 'sistem' }).catch(() => {});
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password_hash);
    } catch (bcryptErr) {
      console.error('bcrypt compare hatası:', bcryptErr.message);
    }

    if (!valid) {
      logActivity({ action: 'Başarısız giriş denemesi', detail: `Yanlış şifre: ${user.username}`, type: 'security', icon: '⚠️', user: 'sistem', targetType: 'user', targetId: user.id }).catch(() => {});
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      sessionVersion: Number(user.session_version || 0),
    });
    const csrfToken = setAuthCookies(req, res, token);

    logActivity({ action: 'Admin girişi yapıldı', detail: `${user.username} giriş yaptı`, type: 'system', icon: '🔐', user: user.username, targetType: 'user', targetId: user.id }).catch(() => {});

    return res.status(200).json({
      csrfToken,
      user: {
        username: user.username,
        role: user.role,
        permissions: getDefaultPermissions(user.role),
      }
    });
  } catch (error) {
    console.error('Login hatası:', error.message, 'code:', error.code);
    const msg = error.message || '';
    if (
      msg.includes('bad auth') || error.code === 8000 ||
      msg.includes('Authentication failed') ||
      msg.includes('SUPABASE_URL') || msg.includes('SUPABASE_SERVICE_ROLE_KEY') ||
      msg.includes('tanımlı değil') || msg.includes('Invalid API key')
    ) {
      return res.status(500).json({ error: 'Veritabanı bağlantı hatası. Lütfen yöneticinize başvurun.' });
    }
    if (msg.includes('timed out') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
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
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { currentPassword, newPassword } = body || {};

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Mevcut şifre ve yeni şifre gerekli' });
    }

    if (newPassword.length < 12 || newPassword.length > 128 || currentPassword.length > 128) {
      return res.status(400).json({ error: 'Yeni şifre 12–128 karakter arasında olmalı' });
    }

    const supabase = getSupabase();
    const { data: dbUser, error: findError } = await supabase
      .from('kade_users')
      .select('id, username, password_hash, role, session_version')
      .eq('username', user.username)
      .maybeSingle();
    if (findError) throw findError;

    if (!dbUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const valid = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Mevcut şifre hatalı' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const sessionVersion = Number(dbUser.session_version || 0) + 1;
    const { error: updateError } = await supabase
      .from('kade_users')
      .update({ password_hash: hashedPassword, session_version: sessionVersion, updated_at: new Date().toISOString() })
      .eq('username', user.username);
    if (updateError) throw updateError;

    const token = createToken({
      id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      sessionVersion,
    });
    setAuthCookies(req, res, token);

    return res.status(200).json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
