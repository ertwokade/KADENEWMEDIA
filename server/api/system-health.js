import { getSupabase } from './_lib/supabase.js';
import { requireAdmin } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

// Hassas olmayan, yalnızca varlık/yokluk (boolean) bilgisi — hiçbir zaman
// gerçek env değeri döndürülmez.
const ENV_CHECKS = [
  { key: 'SUPABASE_URL', label: 'Supabase URL' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
  { key: 'JWT_SECRET', label: 'JWT Secret' },
  { key: 'SHOPIER_API_KEY', label: 'Shopier API Key' },
  { key: 'SHOPIER_API_SECRET', label: 'Shopier API Secret' },
  { key: 'SMTP_HOST', label: 'SMTP Host' },
  { key: 'SMTP_USER', label: 'SMTP Kullanıcı' },
  { key: 'SMTP_PASS', label: 'SMTP Şifre' },
  { key: 'VITE_GA_ID', label: 'Google Analytics ID' },
  { key: 'SITE_URL', label: 'Site URL (sitemap için)' },
];

async function checkSupabase() {
  const startedAt = Date.now();
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('kade_users').select('id', { count: 'exact', head: true });
    if (error) throw error;
    return { configured: true, connected: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    return { configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY), connected: false, latencyMs: null, error: err.message };
  }
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const supabaseStatus = await checkSupabase();
  const env = Object.fromEntries(ENV_CHECKS.map(({ key, label }) => [key, { label, present: Boolean(process.env[key]) }]));

  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    server: {
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      env: process.env.VERCEL === '1' ? 'vercel' : (process.env.NODE_ENV || 'development'),
    },
    supabase: supabaseStatus,
    envVars: env,
  });
}
