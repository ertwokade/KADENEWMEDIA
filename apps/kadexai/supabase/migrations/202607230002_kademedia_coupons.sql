-- Faz 4 — şartname §10 "kupon/kampanya" admin modülü için temel şema.
-- NOT: Bu migration bu oturumda canlı Supabase'e UYGULANMADI (bkz.
-- docs/BLOCKERS_TR.md #1). Bilinçli olarak yalnızca ADMIN CRUD + kupon
-- doğrulama mantığı bu turda kuruldu; kuponun gerçek ödeme akışına
-- (server/api/shopier.js / validateShopierPayment) kablolanması bu turda
-- YAPILMADI çünkü bu, canlı webhook testine ihtiyaç duyan ödeme-kritik bir
-- değişikliktir (bkz. docs/05_COMMERCE_AND_ENTITLEMENT_TR.md prensipleri).

CREATE TABLE IF NOT EXISTS public.kade_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  applies_to TEXT[] DEFAULT '{}',              -- boş dizi = tüm paketler
  max_uses INTEGER,                             -- NULL = sınırsız
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kade_coupons_code_idx ON public.kade_coupons (code) WHERE active = TRUE;

-- 202607210001'deki kade_% RLS taramasıyla aynı desen (yalnızca service-role
-- erişimi; service_role zaten RLS'i bypass eder, bu yüzden ayrı bir policy
-- gerekmiyor — anon/authenticated'dan REVOKE yeterli ve tutarlı).
ALTER TABLE public.kade_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_coupons FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.kade_coupons FROM anon, authenticated;
