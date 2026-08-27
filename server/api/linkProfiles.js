import { getSupabase, isValidUuid, isUniqueViolation } from './_lib/supabase.js';
import { rateLimitCheck } from './_lib/rateLimit.js'
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const LINK_FIELDS = new Set(['label', 'url', 'icon']);

function sanitizeLinks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const clean = Object.fromEntries(Object.entries(item).filter(([key]) => LINK_FIELDS.has(key)));
      if (typeof clean.label !== 'string' || typeof clean.url !== 'string') return null;
      clean.label = clean.label.trim().slice(0, 60);
      let url = clean.url.trim();
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
      clean.url = url.slice(0, 500);
      clean.icon = typeof clean.icon === 'string' ? clean.icon.trim().slice(0, 30) : 'custom';
      if (!clean.label || !/^https?:\/\//i.test(clean.url)) return null;
      return clean;
    })
    .filter(Boolean)
    .slice(0, 20);
}

const PROFILE_FIELDS = new Set(['slug', 'name', 'handle', 'tagline', 'photo', 'links', 'active', 'accentColor']);

export function sanitizeProfileUpdate(value) {
  const clean = Object.fromEntries(Object.entries(value || {}).filter(([key]) => PROFILE_FIELDS.has(key)));
  if (clean.slug !== undefined) {
    if (typeof clean.slug !== 'string' || clean.slug.length > 80 || !SLUG_RE.test(clean.slug)) return null;
  }
  if (clean.name !== undefined) clean.name = String(clean.name).trim().slice(0, 100);
  if (clean.handle !== undefined) clean.handle = String(clean.handle).trim().slice(0, 60);
  if (clean.tagline !== undefined) clean.tagline = String(clean.tagline).trim().slice(0, 160);
  if (clean.photo !== undefined) clean.photo = String(clean.photo).slice(0, 2_000_000);
  if (clean.links !== undefined) clean.links = sanitizeLinks(clean.links);
  if (clean.active !== undefined) clean.active = Boolean(clean.active);
  if (clean.accentColor !== undefined) {
    clean.accentColor = HEX_COLOR_RE.test(clean.accentColor) ? clean.accentColor : '#d4943f';
  }
  return clean;
}

function profileInputToRow(clean) {
  const row = {};
  if (clean.slug !== undefined) row.slug = clean.slug;
  if (clean.name !== undefined) row.name = clean.name;
  if (clean.handle !== undefined) row.handle = clean.handle;
  if (clean.tagline !== undefined) row.tagline = clean.tagline;
  if (clean.photo !== undefined) row.photo = clean.photo;
  if (clean.links !== undefined) row.links = clean.links;
  if (clean.active !== undefined) row.active = clean.active;
  if (clean.accentColor !== undefined) row.accent_color = clean.accentColor;
  return row;
}

function rowToProfile(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    slug: row.slug,
    name: row.name,
    handle: row.handle,
    tagline: row.tagline,
    photo: row.photo,
    links: row.links,
    active: row.active,
    accentColor: row.accent_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  /* Public okuma yolu: kimlik doğrulaması yok, her istek DB'ye gidiyor ve
     handle/slug numaralandırılabilir. Cömert limit + failOpen: Redis kesintisi
     public profil sayfalarını düşürmemeli. */
  const rl = await rateLimitCheck(req, { namespace: 'link-profiles', maxRequests: 240, failOpen: true })
  if (!rl.allowed) return res.status(429).json({ error: 'Çok fazla istek' })

  if (cors(req, res)) return;

  const supabase = getSupabase();

  // GET - public single profile by slug, or admin list of all profiles
  if (req.method === 'GET') {
    try {
      const slug = req.query?.slug;
      if (slug) {
        if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return res.status(400).json({ error: 'Geçersiz slug' });
        const { data: profile, error } = await supabase.from('kade_link_profiles').select('*').eq('slug', slug).eq('active', true).maybeSingle();
        if (error) throw error;
        if (!profile) return res.status(404).json({ error: 'Profil bulunamadı' });
        return res.status(200).json(rowToProfile(profile));
      }

      const user = await requirePermission(req, res, 'linkProfiles');
      if (!user) return;
      const { data, error } = await supabase.from('kade_link_profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data.map(rowToProfile));
    } catch (error) {
      console.error('LinkProfiles GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create profile (requires auth)
  if (req.method === 'POST') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const clean = sanitizeProfileUpdate(req.body);
      if (!clean) return res.status(400).json({ error: 'Profil verisi geçersiz' });
      if (!clean.slug) return res.status(400).json({ error: 'Slug gerekli' });
      if (!clean.name?.trim()) return res.status(400).json({ error: 'İsim gerekli' });

      const { data: existing, error: existingError } = await supabase.from('kade_link_profiles').select('id').eq('slug', clean.slug).maybeSingle();
      if (existingError) throw existingError;
      if (existing) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });

      const row = profileInputToRow({
        slug: clean.slug,
        name: clean.name || '',
        handle: clean.handle || '',
        tagline: clean.tagline || '',
        photo: clean.photo || '',
        links: clean.links || [],
        active: clean.active !== false,
        accentColor: clean.accentColor || '#d4943f',
      });
      const { data, error } = await supabase.from('kade_link_profiles').insert(row).select().single();
      if (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Link profili oluşturuldu', detail: data.name, type: 'create', icon: '🔗', user: user.username }).catch(() => {});
      return res.status(201).json(rowToProfile(data));
    } catch (error) {
      console.error('LinkProfiles POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update profile (requires auth)
  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const { _id, ...rawUpdateData } = req.body || {};
      if (!_id) return res.status(400).json({ error: 'Profil ID gerekli' });
      if (!isValidUuid(_id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const updateData = sanitizeProfileUpdate(rawUpdateData);
      if (!updateData) return res.status(400).json({ error: 'Profil verisi geçersiz' });

      if (updateData.slug) {
        const { data: clash, error: clashError } = await supabase.from('kade_link_profiles').select('id').eq('slug', updateData.slug).neq('id', _id).maybeSingle();
        if (clashError) throw clashError;
        if (clash) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });
      }

      const row = profileInputToRow(updateData);
      row.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from('kade_link_profiles').update(row).eq('id', _id).select('id');
      if (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      if (!data || data.length === 0) return res.status(404).json({ error: 'Profil bulunamadı' });

      logActivity({ action: 'Link profili güncellendi', detail: updateData.name || _id, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Profil güncellendi' });
    } catch (error) {
      console.error('LinkProfiles PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete profile (requires auth)
  if (req.method === 'DELETE') {
    const user = await requirePermission(req, res, 'linkProfiles', { write: true });
    if (!user) return;

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Profil ID gerekli' });
      if (!isValidUuid(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });

      const { data: profile, error: findError } = await supabase.from('kade_link_profiles').select('name').eq('id', queryId).maybeSingle();
      if (findError) throw findError;

      const { data, error } = await supabase.from('kade_link_profiles').delete().eq('id', queryId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Profil bulunamadı' });

      logActivity({ action: 'Link profili silindi', detail: profile?.name || queryId, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Profil silindi' });
    } catch (error) {
      console.error('LinkProfiles DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
