-- Paket adı ve özellik matrisini de admin panelinden yönetilebilir yap (§13).
--
-- Fiyat zaten kadexai_pricing_overrides üzerinden DB-driven'dı; ad ve özellik
-- listesi koda gömülüydü. Aynı tabloya ekleniyor ki tek satırlık override
-- kaydı bozulmasın ve mevcut senkron cache deseni değişmesin.
--
-- Güvenlik notu: özellik listesi entitlement grant'ine yazılır. Boş veya
-- bozuk bir değer kullanıcıyı yetkisiz bırakabileceği için uygulama katmanı
-- geçersiz değerleri REDDEDİP koddaki varsayılana düşer (bkz. pricingConfig.ts).

ALTER TABLE public.kadexai_pricing_overrides
  ADD COLUMN IF NOT EXISTS tier_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tier_features JSONB NOT NULL DEFAULT '{}'::jsonb;
