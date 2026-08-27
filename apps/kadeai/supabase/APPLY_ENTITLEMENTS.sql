-- ACİL: public.entitlements tablosu production'da YOK.
-- Bulgu: /api/payments/owner → "Could not find the table 'public.entitlements'"
--
-- Etkisi: bir müşteri ŞU AN ödeme yaparsa Shopier webhook'u siparişi
-- 'paid' işaretler, ardından grantEntitlementForOrder() bu tabloya
-- yazmaya çalışıp düşer. Hata yakalanıp loglanır ama akış devam eder:
-- PARA TAHSİL EDİLİR, PAKET AÇILMAZ.
--
-- Tamamı additive; mevcut veriye dokunmaz.

-- KadeAI paket/yetki sistemi.
-- Sadece hazırlık: production'a yedek + staging doğrulaması olmadan uygulanmaz.

-- 1) Kişiye özel / 15 dk geçerli teklifler için sipariş son kullanma tarihi.
ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2) Kullanıcı yetkileri (satın alınca otomatik verilir).
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('baslangic', 'pro', 'sinirsiz')),
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
  api_included BOOLEAN NOT NULL DEFAULT TRUE,
  features TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  source_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entitlements_user_active_idx
  ON public.entitlements(user_id, status, expires_at DESC);

-- Her sipariş yalnızca bir kez yetkiye dönüşebilsin (idempotency).
CREATE UNIQUE INDEX IF NOT EXISTS entitlements_source_order_uidx
  ON public.entitlements(source_order_id) WHERE source_order_id IS NOT NULL;

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements FORCE ROW LEVEL SECURITY;

-- Kullanıcı kendi yetkilerini okuyabilir; yazma yalnızca service-role (server) ile.
DROP POLICY IF EXISTS entitlements_own_select ON public.entitlements;
CREATE POLICY entitlements_own_select ON public.entitlements
  FOR SELECT USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.entitlements FROM anon, authenticated;
GRANT SELECT ON public.entitlements TO authenticated;

-- 3) Aktif yetkiyi hızlı sorgulamak için yardımcı görünüm.
CREATE OR REPLACE VIEW public.active_entitlements AS
  SELECT * FROM public.entitlements
  WHERE status = 'active' AND expires_at > NOW();
