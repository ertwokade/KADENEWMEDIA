-- Yasal metin altyapısı (§5).
--
-- ÖNEMLİ: Bu migration hiçbir hukuki METİN İÇERMEZ ve üretmez. Yalnızca
-- yetkili hukuk danışmanının hazırladığı metinlerin sürümlenerek saklanmasını,
-- yayınlanmasını ve ödeme sırasında alınan onayın KANITLANABİLİR biçimde
-- kaydedilmesini sağlar. `status='published'` yapma kararı insanındır.

CREATE TABLE IF NOT EXISTS public.legal_documents (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  -- Metin değiştiğinde sürüm artırılır; alınmış onaylar eski sürüme bağlı kalır.
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  -- Ödeme öncesi açık onay gerektiren metinler (ör. mesafeli satış, ön
  -- bilgilendirme, cayma hakkı). Yalnız yayınlanmış olanlar zorunlu tutulur.
  requires_checkout_consent BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS legal_documents_status_idx ON public.legal_documents(status);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.legal_documents FROM anon, authenticated;

-- Onay kanıtı: hangi kullanıcı, hangi siparişte, hangi metnin hangi sürümünü,
-- ne zaman kabul etti. Değiştirilemez olmalı — UPDATE/DELETE hiç kimseye açık
-- değil, service-role dahil uygulama katmanı yalnızca INSERT yapar.
CREATE TABLE IF NOT EXISTS public.legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  document_slug TEXT NOT NULL,
  document_version INTEGER NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS legal_consents_user_idx ON public.legal_consents(user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS legal_consents_order_idx ON public.legal_consents(order_id);

ALTER TABLE public.legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consents FORCE ROW LEVEL SECURITY;

-- Kullanıcı kendi onay kaydını görebilir (kanıt hakkı); kimse değiştiremez.
DROP POLICY IF EXISTS legal_consents_own_select ON public.legal_consents;
CREATE POLICY legal_consents_own_select ON public.legal_consents
  FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.legal_consents FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.legal_consents FROM anon, authenticated;
GRANT SELECT ON public.legal_consents TO authenticated;
