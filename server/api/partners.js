import { getSupabase, isValidUuid, isUniqueViolation } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { logActivity } from './notifications.js';

const PARTNER_FIELDS = new Set([
  'id', 'slug', 'name', 'category', 'categoryEn', 'logo', 'color',
  'descTr', 'descEn', 'longDescTr', 'longDescEn',
  'servicesTr', 'servicesEn', 'resultsTr', 'resultsEn',
]);

export function sanitizePartnerUpdate(value) {
  const clean = Object.fromEntries(Object.entries(value || {}).filter(([key]) => PARTNER_FIELDS.has(key)));
  for (const key of ['id', 'slug']) {
    if (clean[key] !== undefined && (typeof clean[key] !== 'string' || clean[key].length > 160 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean[key]))) return null;
  }
  for (const key of ['name', 'category', 'categoryEn', 'color']) {
    if (clean[key] !== undefined) clean[key] = String(clean[key]).trim().slice(0, key === 'name' ? 100 : 120);
  }
  for (const key of ['descTr', 'descEn']) if (clean[key] !== undefined) clean[key] = String(clean[key]).slice(0, 500);
  for (const key of ['longDescTr', 'longDescEn']) if (clean[key] !== undefined) clean[key] = String(clean[key]).slice(0, 5000);
  for (const key of ['servicesTr', 'servicesEn', 'resultsTr', 'resultsEn']) {
    if (clean[key] !== undefined) clean[key] = Array.isArray(clean[key]) ? clean[key].filter((item) => typeof item === 'string').map((item) => item.slice(0, 200)).slice(0, 50) : [];
  }
  return clean;
}

// DB'de `id` UUID PK'dir (değişmez); eski Mongo şemasında `id` alanı slug değeriydi.
// Geriye dönük uyumluluk için gelen `id`/`slug` alanlarını `slug` koluna eşliyoruz.
function partnerInputToRow(clean) {
  const row = {};
  const slugValue = clean.slug !== undefined ? clean.slug : clean.id;
  if (slugValue !== undefined) row.slug = slugValue;
  if (clean.name !== undefined) row.name = clean.name;
  if (clean.category !== undefined) row.category = clean.category;
  if (clean.categoryEn !== undefined) row.category_en = clean.categoryEn;
  if (clean.logo !== undefined) row.logo = clean.logo;
  if (clean.color !== undefined) row.color = clean.color;
  if (clean.descTr !== undefined) row.desc_tr = clean.descTr;
  if (clean.descEn !== undefined) row.desc_en = clean.descEn;
  if (clean.longDescTr !== undefined) row.long_desc_tr = clean.longDescTr;
  if (clean.longDescEn !== undefined) row.long_desc_en = clean.longDescEn;
  if (clean.servicesTr !== undefined) row.services_tr = clean.servicesTr;
  if (clean.servicesEn !== undefined) row.services_en = clean.servicesEn;
  if (clean.resultsTr !== undefined) row.results_tr = clean.resultsTr;
  if (clean.resultsEn !== undefined) row.results_en = clean.resultsEn;
  return row;
}

// `id` cevapta eski slug-tabanlı davranışı korumak için `slug` değerini taşır;
// gerçek Postgres UUID PK `_id` alanında döner (Admin.jsx güncelleme/silme için kullanıyor).
function rowToPartner(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categoryEn: row.category_en,
    logo: row.logo,
    color: row.color,
    descTr: row.desc_tr,
    descEn: row.desc_en,
    longDescTr: row.long_desc_tr,
    longDescEn: row.long_desc_en,
    servicesTr: row.services_tr,
    servicesEn: row.services_en,
    resultsTr: row.results_tr,
    resultsEn: row.results_en,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const supabase = getSupabase();

  // GET - List all partners (public)
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('kade_partners').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data.map(rowToPartner));
    } catch (error) {
      console.error('Partners GET error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // POST - Create partner (requires auth)
  if (req.method === 'POST') {
    const user = await requirePermission(req, res, 'partners', { write: true });
    if (!user) return;

    try {
      const {
        name, category, categoryEn, logo, color,
        descTr, descEn, longDescTr, longDescEn,
        servicesTr, servicesEn, resultsTr, resultsEn, slug: bodySlug, id: bodyId,
      } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'Partner adı gerekli' });
      if (name.length > 100) return res.status(400).json({ error: 'Ad çok uzun (max 100)' });
      if (descTr && descTr.length > 500) return res.status(400).json({ error: 'Kısa açıklama çok uzun (max 500)' });
      if (longDescTr && longDescTr.length > 5000) return res.status(400).json({ error: 'Uzun açıklama çok uzun (max 5000)' });
      // Slug'dan id oluştur — detail sayfası URL'i için gerekli
      const slug = bodySlug || bodyId || (name || '').toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const row = partnerInputToRow({
        slug, name, category, categoryEn, logo, color,
        descTr, descEn, longDescTr, longDescEn,
        servicesTr, servicesEn, resultsTr, resultsEn,
      });
      const { data, error } = await supabase.from('kade_partners').insert(row).select().single();
      if (error) {
        if (isUniqueViolation(error)) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Partner eklendi', detail: `${req.body.name || ''}`, type: 'create', icon: '🤝', user: user.username }).catch(() => {});
      return res.status(201).json(rowToPartner(data));
    } catch (error) {
      console.error('Partners POST error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // PUT - Update partner (requires auth)
  if (req.method === 'PUT') {
    const user = await requirePermission(req, res, 'partners', { write: true });
    if (!user) return;

    try {
      const { _id, ...rawUpdateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'Partner ID gerekli' });
      if (!isValidUuid(_id)) return res.status(400).json({ error: 'Geçersiz ID' });

      const updateData = sanitizePartnerUpdate(rawUpdateData);
      if (!updateData) return res.status(400).json({ error: 'Partner verisi geçersiz' });

      const row = partnerInputToRow(updateData);
      row.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from('kade_partners').update(row).eq('id', _id).select('id');
      if (error) {
        if (isUniqueViolation(error)) return res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        throw error;
      }
      if (!data || data.length === 0) return res.status(404).json({ error: 'Partner bulunamadı' });

      logActivity({ action: 'Partner güncellendi', detail: `${updateData.name || _id}`, type: 'update', icon: '✏️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Partner güncellendi' });
    } catch (error) {
      console.error('Partners PUT error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  // DELETE - Delete partner (requires auth)
  if (req.method === 'DELETE') {
    const user = await requirePermission(req, res, 'partners', { write: true });
    if (!user) return;

    try {
      const queryId = req.body?.id || req.query.id;
      if (!queryId) return res.status(400).json({ error: 'Partner ID gerekli' });
      if (!isValidUuid(queryId)) return res.status(400).json({ error: 'Geçersiz ID' });

      const { data: partner, error: findError } = await supabase.from('kade_partners').select('name').eq('id', queryId).maybeSingle();
      if (findError) throw findError;

      const { data, error } = await supabase.from('kade_partners').delete().eq('id', queryId).select('id');
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Partner bulunamadı' });

      logActivity({ action: 'Partner silindi', detail: `${partner?.name || queryId}`, type: 'delete', icon: '🗑️', user: user.username }).catch(() => {});
      return res.status(200).json({ message: 'Partner silindi' });
    } catch (error) {
      console.error('Partners DELETE error:', error);
      return res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
