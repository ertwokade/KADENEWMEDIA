// Kupon doğrulama/uygulama mantığı — saf fonksiyonlar, veritabanı/ağ erişimi yok.
// Bilinçli olarak henüz server/api/shopier.js ödeme akışına kablolanmadı (bkz.
// migration 202607230002'deki not) — bu dosya yalnızca admin CRUD tarafından
// ve ileride canlı ortamda doğrulanacak checkout entegrasyonu tarafından
// kullanılmak üzere hazırlanmıştır.

export function isCouponCurrentlyValid(coupon, { packageRef, now = new Date() } = {}) {
  if (!coupon || !coupon.active) return { ok: false, reason: 'inactive' };

  const nowTime = now.getTime();
  if (coupon.validFrom && nowTime < new Date(coupon.validFrom).getTime()) {
    return { ok: false, reason: 'not_started' };
  }
  if (coupon.validUntil && nowTime > new Date(coupon.validUntil).getTime()) {
    return { ok: false, reason: 'expired' };
  }
  if (coupon.maxUses != null && Number(coupon.usedCount || 0) >= Number(coupon.maxUses)) {
    return { ok: false, reason: 'max_uses_reached' };
  }
  if (Array.isArray(coupon.appliesTo) && coupon.appliesTo.length > 0 && packageRef && !coupon.appliesTo.includes(packageRef)) {
    return { ok: false, reason: 'not_applicable_to_package' };
  }

  return { ok: true, reason: null };
}

// unitAmountMinor: kuruş/cent cinsinden, her zaman tam sayı (bkz. shopierCatalog.js).
export function applyCouponDiscount(unitAmountMinor, coupon) {
  if (!Number.isSafeInteger(unitAmountMinor) || unitAmountMinor <= 0) return unitAmountMinor;
  if (!coupon) return unitAmountMinor;

  let discounted;
  if (coupon.discountType === 'percent') {
    const pct = Math.min(Math.max(Number(coupon.discountValue) || 0, 0), 100);
    discounted = Math.round(unitAmountMinor * (1 - pct / 100));
  } else {
    const fixedMinor = Math.round((Number(coupon.discountValue) || 0) * 100);
    discounted = unitAmountMinor - fixedMinor;
  }

  // Asla negatif veya orijinal tutardan büyük bir sonuç döndürme.
  return Math.min(Math.max(discounted, 0), unitAmountMinor);
}

const CODE_RE = /^[A-Z0-9_-]{3,32}$/;

export function isValidCouponCode(code) {
  return typeof code === 'string' && CODE_RE.test(code);
}

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase();
}
