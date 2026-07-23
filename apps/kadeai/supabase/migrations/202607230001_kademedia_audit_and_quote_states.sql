-- Faz 3 — şartname §8.5 (teklif durum makinesi) ve §8.7/§22 (audit log yapısı)
-- için geriye dönük uyumlu, geri alınabilir genişletme.
--
-- NOT: Bu migration bu oturumda canlı Supabase'e UYGULANMADI (bkz.
-- docs/BLOCKERS_TR.md #1). Kredensiyal sağlandığında normal migration akışıyla
-- uygulanmalı. Var olan hiçbir satır/uygulama kodu bozulmaz: tüm yeni kolonlar
-- NULL'a izin verir, hiçbir eski değer silinmez/zorla değiştirilmez.

-- ============================================================================
-- 1) kade_quotes — teklif durum makinesini şartnameye hizala
-- ============================================================================
-- Şartnamenin 19-20 durumluk tam yaşam döngüsü (payment_pending, paid,
-- provisioning, active, refunded vb.) aslında ÖDEME/SİPARİŞ aşamalarıdır ve
-- zaten kade_shopier_orders tarafında ayrı olarak tutuluyor (bkz. docs/05 §2
-- varlık eşleme tablosu). kade_quotes yalnızca "teklif talebi" yaşam
-- döngüsünü temsil eder; bu yüzden yalnızca şartnamenin teklif-talebi alt
-- kümesi (draft→requested→reviewing→offered→revised→accepted, artı
-- rejected/expired/cancelled) buraya uygulanıyor. Mevcut 5 basit değer
-- (yeni/aranacak/teklif-hazirlandi/kazandi/kaybetti) geriye dönük uyumluluk
-- için CHECK'e dahil edildi — admin UI kademeli olarak yeni değerlere
-- geçebilir, eski satırlar bozulmaz.

ALTER TABLE public.kade_quotes
  DROP CONSTRAINT IF EXISTS kade_quotes_status_check;

ALTER TABLE public.kade_quotes
  ADD CONSTRAINT kade_quotes_status_check CHECK (status IN (
    -- Legacy (mevcut admin UI, korunuyor)
    'yeni', 'aranacak', 'teklif-hazirlandi', 'kazandi', 'kaybetti',
    -- Şartname §8.5 teklif-talebi alt kümesi (yeni, opsiyonel)
    'draft', 'requested', 'reviewing', 'offered', 'revised', 'accepted',
    'rejected', 'expired', 'cancelled'
  ));

COMMENT ON COLUMN public.kade_quotes.status IS
  'Legacy: yeni≈requested, aranacak≈reviewing, teklif-hazirlandi≈offered, '
  'kazandi≈accepted, kaybetti≈rejected. accepted sonrası ödeme/sipariş '
  'durumu kade_shopier_orders üzerinden takip edilir (bkz. docs/05).';

-- ============================================================================
-- 2) kade_activity_log — yapısal audit alanları (§8.7/§22)
-- ============================================================================
-- target_type/target_id: hangi varlık üzerinde işlem yapıldığı (örn.
-- 'blog_post', '<uuid>') — şu an bu bilgi yalnızca serbest metin `detail`
-- içine gömülü, sorgulanamıyor.
-- before/after: değişiklik öncesi/sonrası özet (jsonb, opsiyonel) — hassas
-- alanlar (şifre, token) asla buraya yazılmamalı, çağıran kod sorumludur.

ALTER TABLE public.kade_activity_log
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS target_id TEXT,
  ADD COLUMN IF NOT EXISTS before JSONB,
  ADD COLUMN IF NOT EXISTS after JSONB;

CREATE INDEX IF NOT EXISTS kade_activity_log_target_idx
  ON public.kade_activity_log (target_type, target_id);
