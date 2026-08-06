import { getSupabase } from './_lib/supabase.js';
import { requireAdmin } from './_lib/auth.js';
import { cors } from './_lib/cors.js';

// Hassas olmayan, yalnızca varlık/yokluk (boolean) bilgisi — hiçbir zaman
// gerçek env değeri döndürülmez.
//
// `optional: true` olanlar tanımsızken de sistem çalışır; kodda gerçek bir
// varsayılanları vardır. Bunları eksik gibi göstermek yanıltıcıydı: panel
// çalışan bir yapılandırmaya kırmızı ✕ basıyor, gerçek eksikle aynı ağırlıkta
// görünüyordu. `note` alanı eksikken ne olduğunu söyler.
export const ENV_CHECKS = [
  { key: 'SUPABASE_URL', label: 'Supabase URL' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role Key' },
  { key: 'JWT_SECRET', label: 'JWT Secret' },
  {
    key: 'SITE_URL',
    label: 'Site URL',
    optional: true,
    note: 'Tanımsızsa https://kadenewmedia.com kullanılır (sitemap, anket bağlantıları).',
  },
  {
    key: 'SMTP_HOST',
    label: 'SMTP Host',
    optional: true,
    note: 'Tanımsızsa form bildirimi e-postası gönderilmez; talep yine veritabanına yazılır.',
  },
  { key: 'SMTP_USER', label: 'SMTP Kullanıcı', optional: true, note: 'SMTP Host ile birlikte gerekir.' },
  { key: 'SMTP_PASS', label: 'SMTP Şifre', optional: true, note: 'SMTP Host ile birlikte gerekir.' },
  {
    key: 'SHOPIER_API_KEY',
    label: 'Shopier API Key',
    optional: true,
    note: 'Ödeme entegrasyonu kullanılmıyorsa gerekmez.',
  },
  { key: 'SHOPIER_API_SECRET', label: 'Shopier API Secret', optional: true, note: 'Ödeme entegrasyonu kullanılmıyorsa gerekmez.' },
  // NOT: VITE_ önekli değişkenler istemci build'ine gömülür, sunucu
  // çalışma zamanında okunmaz. Buradan "var mı" diye bakmak yanlış sonuç
  // verir — GA durumu bu yüzden ayrıca, gerçek kaynağından raporlanır.
];

// GA istemci tarafında yapılandırılır; kodda çalışan bir varsayılan kimlik
// vardır, yani "tanımsız" hiçbir zaman "analitik kapalı" demek değildir.
export const CLIENT_CHECKS = [
  {
    key: 'VITE_GA_ID',
    label: 'Google Analytics ID',
    optional: true,
    note: 'İstemci build\'ine gömülür; sunucudan doğrulanamaz. Tanımsızsa varsayılan ölçüm kimliği kullanılır.',
  },
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
  const env = Object.fromEntries([
    ...ENV_CHECKS.map(({ key, label, optional = false, note = null }) => [
      key,
      { label, present: Boolean(process.env[key]), optional, note },
    ]),
    // Sunucudan doğrulanamayan istemci değişkenleri her zaman "bilinmiyor"
    // olarak raporlanır; var/yok iddiasında bulunmak yanlış olurdu.
    ...CLIENT_CHECKS.map(({ key, label, optional, note }) => [
      key,
      { label, present: null, optional, note },
    ]),
  ]);

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
