import { getSupabase, isValidUuid, isUniqueViolation, isNotFound } from './_lib/supabase.js';
import { requirePermission } from './_lib/auth.js';
import { cors } from './_lib/cors.js';
import { isValidCouponCode, normalizeCouponCode } from './_lib/coupons.js';
import { logActivity } from './notifications.js';

// Bu uç yalnızca kupon TANIMLARINI yönetir (admin CRUD). Kuponun gerçek
// ödeme akışında (Shopier checkout) uygulanması bu turda YAPILMADI — bkz.
// migration 202607230002 ve docs/BLOCKERS_TR.md notu. Bu yüzden burada
// yalnızca requirePermission('coupons') ile admin/editor erişimi var,
// herhangi bir public/checkout yolu yok.

function mapCoupon(row) {
  if (!row) return row;
  return {
    _id: row.id,
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    appliesTo: row.applies_to || [],
    maxUses: row.max_uses,
    usedCount: row.used_count,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    active: row.active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = await requirePermission(req, res, 'coupons', { write: req.method !== 'GET' });
  if (!user) return;

  const supabase = getSupabase();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('kade_coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json((data || []).map(mapCoupon));
    }

    if (req.method === 'POST') {
      const { code, description, discountType, discountValue, appliesTo, maxUses, validFrom, validUntil, active } = req.body || {};
      const normalizedCode = normalizeCouponCode(code);

      if (!isValidCouponCode(normalizedCode)) {
        return res.status(400).json({ error: 'Kupon kodu 3-32 karakter, yalnızca büyük harf/rakam/tire/alt çizgi içerebilir' });
      }
      if (!['percent', 'fixed'].includes(discountType)) {
        return res.status(400).json({ error: 'discountType "percent" veya "fixed" olmalı' });
      }
      const value = Number(discountValue);
      if (!Number.isFinite(value) || value <= 0) {
        return res.status(400).json({ error: 'Geçersiz indirim değeri' });
      }
      if (discountType === 'percent' && value > 100) {
        return res.status(400).json({ error: 'Yüzde indirim 100\'den büyük olamaz' });
      }

      const { data: created, error } = await supabase.from('kade_coupons').insert({
        code: normalizedCode,
        description: description || '',
        discount_type: discountType,
        discount_value: value,
        applies_to: Array.isArray(appliesTo) ? appliesTo : [],
        max_uses: maxUses != null && maxUses !== '' ? Number(maxUses) : null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        active: active !== false,
        created_by: user.username,
      }).select().single();

      if (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ error: 'Bu kupon kodu zaten kullanılıyor' });
        throw error;
      }
      logActivity({ action: 'Kupon oluşturuldu', detail: normalizedCode, type: 'create', icon: '🏷️', user: user.username, targetType: 'coupon', targetId: created.id }).catch(() => {});
      return res.status(201).json(mapCoupon(created));
    }

    if (req.method === 'PUT') {
      const { id, description, discountType, discountValue, appliesTo, maxUses, validFrom, validUntil, active } = req.body || {};
      if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz kupon ID' });

      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (discountType !== undefined) {
        if (!['percent', 'fixed'].includes(discountType)) return res.status(400).json({ error: 'Geçersiz discountType' });
        updateData.discount_type = discountType;
      }
      if (discountValue !== undefined) {
        const value = Number(discountValue);
        if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'Geçersiz indirim değeri' });
        updateData.discount_value = value;
      }
      if (appliesTo !== undefined) updateData.applies_to = Array.isArray(appliesTo) ? appliesTo : [];
      if (maxUses !== undefined) updateData.max_uses = maxUses != null && maxUses !== '' ? Number(maxUses) : null;
      if (validFrom !== undefined) updateData.valid_from = validFrom || null;
      if (validUntil !== undefined) updateData.valid_until = validUntil || null;
      if (active !== undefined) updateData.active = Boolean(active);

      const { error } = await supabase.from('kade_coupons').update(updateData).eq('id', id);
      if (error) {
        if (isNotFound(error)) return res.status(404).json({ error: 'Kupon bulunamadı' });
        throw error;
      }
      logActivity({ action: 'Kupon güncellendi', detail: id, type: 'update', icon: '✏️', user: user.username, targetType: 'coupon', targetId: id }).catch(() => {});
      return res.status(200).json({ message: 'Kupon güncellendi' });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id || !isValidUuid(id)) return res.status(400).json({ error: 'Geçersiz kupon ID' });

      const { data: existing } = await supabase.from('kade_coupons').select('code').eq('id', id).maybeSingle();
      const { error } = await supabase.from('kade_coupons').delete().eq('id', id);
      if (error) throw error;
      logActivity({ action: 'Kupon silindi', detail: existing?.code || id, type: 'delete', icon: '🗑️', user: user.username, targetType: 'coupon', targetId: id }).catch(() => {});
      return res.status(200).json({ message: 'Kupon silindi' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Coupons API error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
