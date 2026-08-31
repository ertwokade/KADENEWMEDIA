-- KadexAI — production'a uygulanmayı bekleyen migration'lar
-- Güncellendi: 2026-08-29
-- Veri silmez; mevcut marka önekli tabloları koruyarak yeniden adlandırır,
-- ardından CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS adımlarını uygular.
-- Supabase → SQL Editor'a bu dosyanın tamamı yapıştırılıp bir kez çalıştırılır.

-- Ön kontrol: aşağıdaki ALTER/CREATE adımlarından önce mevcut tabloların
-- yeni adlarıyla erişilebilir olmasını sağlar.
DO $rebrand_preflight$
DECLARE
  previous_prefix TEXT := 'kade' || 'ai';
  current_prefix CONSTANT TEXT := 'kadexai';
  suffix TEXT;
  previous_name TEXT;
  current_name TEXT;
BEGIN
  FOREACH suffix IN ARRAY ARRAY['pricing_overrides', 'quote_requests', 'content_blocks']
  LOOP
    previous_name := previous_prefix || '_' || suffix;
    current_name := current_prefix || '_' || suffix;
    IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
       AND to_regclass(format('public.%I', current_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
    END IF;
  END LOOP;

  previous_name := 'kade' || '_ai_usage';
  current_name := current_prefix || '_usage';
  IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
     AND to_regclass(format('public.%I', current_name)) IS NULL THEN
    EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
  END IF;
END
$rebrand_preflight$;

-- ═══════════════════════════════════════════════════════════
-- 202608260003_expired_payment_orders.sql
-- ═══════════════════════════════════════════════════════════
-- 15 dakikalık ödeme tekliflerinin ayrı ve geri döndürülemez yaşam döngüsü.

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_status_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired'));

CREATE INDEX IF NOT EXISTS payment_orders_pending_expiry_idx
  ON public.payment_orders(expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;


-- ═══════════════════════════════════════════════════════════
-- 202608260004_user_provider_keys.sql
-- ═══════════════════════════════════════════════════════════
-- BYOK anahtarları yalnız service-role API üzerinden yönetilir. Kullanıcı
-- tabloyu doğrudan okuyamaz; böylece şifreli blob dahi tarayıcıya çıkmaz.

CREATE TABLE IF NOT EXISTS public.user_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google')),
  encrypted_secret BYTEA NOT NULL,
  key_hint TEXT NOT NULL CHECK (char_length(key_hint) <= 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS user_provider_keys_user_idx
  ON public.user_provider_keys(user_id);

ALTER TABLE public.user_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_provider_keys FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_provider_keys FROM anon, authenticated;

COMMENT ON TABLE public.user_provider_keys IS
  'AES-256-GCM encrypted BYOK secrets. Service-role only; never return encrypted_secret to clients.';


-- ═══════════════════════════════════════════════════════════
-- 202608260005_platform_controls.sql
-- ═══════════════════════════════════════════════════════════
-- Merkezi audit trail ve kontrollü feature rollout altyapısı.

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'denied', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_audit_events_created_idx
  ON public.platform_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_actor_idx
  ON public.platform_audit_events(actor_user_id, created_at DESC);

ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_audit_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  admin_only BOOLEAN NOT NULL DEFAULT FALSE,
  beta_only BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_users UUID[] NOT NULL DEFAULT '{}',
  allowed_tiers TEXT[] NOT NULL DEFAULT '{}',
  rollout_percent INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  description TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.feature_flags FROM anon, authenticated;


-- ═══════════════════════════════════════════════════════════
-- 202608260006_ai_usage_ledger.sql
-- ═══════════════════════════════════════════════════════════
-- Sunucu tarafında tutulan AI kullanım ve maliyet defteri.
--
-- Neden: kullanım kaydı bugüne kadar tarayıcıdan `/api/history` gövdesiyle
-- bildiriliyordu; kullanıcı `tokens_used` alanını istediği gibi gönderebiliyor,
-- hiç göndermemeyi de seçebiliyordu. Kota ve brüt marj hesabı bu yüzden
-- güvenilir değildi. Bu tabloya YALNIZCA service-role yazar ve kayıt,
-- sağlayıcı yanıtındaki gerçek token sayımından üretilir.

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL DEFAULT 'unknown',
  model TEXT NOT NULL,
  provider TEXT,
  tier TEXT CHECK (tier IS NULL OR tier IN ('baslangic', 'pro', 'sinirsiz')),
  product_id TEXT,
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  -- Maliyeti BİLİNMİYORSA NULL kalır. 0 yazma: brüt marjı olduğundan iyi gösterir.
  cost_usd NUMERIC(14, 6) CHECK (cost_usd IS NULL OR cost_usd >= 0),
  -- Kullanıcı kendi sağlayıcı anahtarını kullandıysa maliyet KadexAI'ye ait değildir.
  byok BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kullanıcının dönem içi kotasını saymak için.
CREATE INDEX IF NOT EXISTS ai_usage_events_user_created_idx
  ON public.ai_usage_events(user_id, created_at DESC);

-- Admin panelinde model/paket kırılımı için.
CREATE INDEX IF NOT EXISTS ai_usage_events_created_idx
  ON public.ai_usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_events_model_created_idx
  ON public.ai_usage_events(model, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events FORCE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi kullanımını okuyabilir; yazma yalnızca service-role.
DROP POLICY IF EXISTS ai_usage_events_own_select ON public.ai_usage_events;
CREATE POLICY ai_usage_events_own_select ON public.ai_usage_events
  FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.ai_usage_events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.ai_usage_events FROM anon, authenticated;
GRANT SELECT ON public.ai_usage_events TO authenticated;

-- Kota kontrolü her AI çağrısından ÖNCE çalışır. Satırları çekip uygulamada
-- toplamak bu sıcak yolda hem ağ hem bellek maliyeti üretir; toplama
-- veritabanında yapılır.
CREATE OR REPLACE FUNCTION public.ai_usage_summary(p_user_id UUID, p_since TIMESTAMPTZ)
RETURNS TABLE (
  total_tokens BIGINT,
  billable_tokens BIGINT,
  cost_usd NUMERIC,
  unpriced_requests BIGINT,
  requests BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(total_tokens), 0)::BIGINT,
    COALESCE(SUM(total_tokens) FILTER (WHERE NOT byok), 0)::BIGINT,
    COALESCE(SUM(cost_usd), 0)::NUMERIC,
    COUNT(*) FILTER (WHERE cost_usd IS NULL)::BIGINT,
    COUNT(*)::BIGINT
  FROM public.ai_usage_events
  WHERE user_id = p_user_id AND created_at >= p_since;
$$;

-- SECURITY DEFINER olduğu için yalnız sunucu (service-role) çağırabilmeli.
REVOKE ALL ON FUNCTION public.ai_usage_summary(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 202608260007_kadexai_quote_requests.sql
-- ═══════════════════════════════════════════════════════════
-- KadexAI "Teklif Al" akışı (§15) ve tekliften ödemeye dönüşüm (§16).
--
-- Ana sitedeki public.kade_quotes ajans/danışmanlık talepleri içindir
-- (hizmetler, platformlar, aylık bütçe). KadexAI'nin ihtiyacı farklı: ekip
-- büyüklüğü, API gereksinimi, tahmini kullanım, istenen özellikler. Bu yüzden
-- o tabloya sütun eklemek yerine ayrı bir tablo kullanılıyor; iki ürünün
-- pipeline'ları da birbirinden bağımsız ilerliyor.

CREATE TABLE IF NOT EXISTS public.kadexai_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Talep giriş yapmış kullanıcıdan gelir; hesap silinirse talep de silinir.
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  first_name TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
  last_name TEXT NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 80),
  company TEXT CHECK (company IS NULL OR char_length(company) <= 160),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 32),

  use_case TEXT NOT NULL CHECK (char_length(use_case) BETWEEN 1 AND 2000),
  team_size TEXT CHECK (team_size IS NULL OR team_size IN ('1', '2-5', '6-20', '21-50', '50+')),
  requested_features TEXT[] NOT NULL DEFAULT '{}',
  api_needed BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_usage TEXT CHECK (estimated_usage IS NULL OR char_length(estimated_usage) <= 400),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),

  -- §15 pipeline. Ödeme oluşturulduğunda 'payment_pending'e geçer ve
  -- payment_order_id dolar; ödeme onaylanınca 'completed'.
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'reviewing', 'offer_prepared', 'sent',
    'accepted', 'rejected', 'payment_pending', 'completed'
  )),
  payment_order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 2000),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kadexai_quote_requests_user_idx
  ON public.kadexai_quote_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kadexai_quote_requests_status_idx
  ON public.kadexai_quote_requests(status, created_at DESC);

ALTER TABLE public.kadexai_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadexai_quote_requests FORCE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi taleplerini GÖRÜR. Yazma tamamen sunucudadır:
-- status/payment_order_id gibi alanlar istemciden gelemesin diye INSERT bile
-- service-role ile yapılır.
DROP POLICY IF EXISTS kadexai_quote_requests_own_select ON public.kadexai_quote_requests;
CREATE POLICY kadexai_quote_requests_own_select ON public.kadexai_quote_requests
  FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.kadexai_quote_requests FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.kadexai_quote_requests FROM anon, authenticated;
GRANT SELECT ON public.kadexai_quote_requests TO authenticated;

-- ═══════════════════════════════════════════════════════════
-- 202608260008_kadexai_content_blocks.sql
-- ═══════════════════════════════════════════════════════════
-- Admin CMS (§25): kamuya açık KadexAI içeriğinin metinleri.
--
-- Frontend, koddaki varsayılanları taban alır ve bu tablodaki override'ı
-- üzerine bindirir. Böylece tablo boşken (veya erişilemezken) sayfa yine
-- eksiksiz render olur — CMS bir bağımlılık değil, bir katmandır.

CREATE TABLE IF NOT EXISTS public.kadexai_content_blocks (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kadexai_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadexai_content_blocks FORCE ROW LEVEL SECURITY;

-- İçerik kamuya açık olsa da okuma sunucudan (service-role) yapılır; istemciye
-- doğrudan tablo erişimi verilmez ki yazma yüzeyi hiç oluşmasın.
REVOKE ALL ON public.kadexai_content_blocks FROM anon, authenticated;

-- ═══════════════════════════════════════════════════════════
-- 202608260009_legal_documents.sql
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- 202608260010_pricing_labels_features.sql
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- 202608270001_content_studio.sql
-- ═══════════════════════════════════════════════════════════
-- KadexAI İçerik Stüdyosu: kişisel marka sesi ve kaynak bağlı içerik paketleri.

CREATE TABLE IF NOT EXISTS public.kade_brand_voices (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  samples     JSONB NOT NULL DEFAULT '[]'::jsonb,
  strength    INTEGER NOT NULL DEFAULT 0 CHECK (strength BETWEEN 0 AND 100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (jsonb_typeof(samples) = 'array')
);

CREATE TABLE IF NOT EXISTS public.kade_content_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_title  TEXT NOT NULL,
  source_url    TEXT,
  source_text   TEXT NOT NULL,
  voice_samples JSONB NOT NULL DEFAULT '[]'::jsonb,
  output        JSONB NOT NULL DEFAULT '{}'::jsonb,
  model         TEXT NOT NULL DEFAULT 'auto',
  status        TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (char_length(source_text) BETWEEN 120 AND 16000),
  CHECK (jsonb_typeof(voice_samples) = 'array'),
  CHECK (jsonb_typeof(output) = 'object')
);

CREATE INDEX IF NOT EXISTS kade_content_runs_user_created_idx
  ON public.kade_content_runs(user_id, created_at DESC);

ALTER TABLE public.kade_brand_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_brand_voices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_content_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_content_runs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kade_brand_voices_own_select ON public.kade_brand_voices;
CREATE POLICY kade_brand_voices_own_select ON public.kade_brand_voices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_brand_voices_own_insert ON public.kade_brand_voices;
CREATE POLICY kade_brand_voices_own_insert ON public.kade_brand_voices
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_brand_voices_own_update ON public.kade_brand_voices;
CREATE POLICY kade_brand_voices_own_update ON public.kade_brand_voices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_brand_voices_own_delete ON public.kade_brand_voices;
CREATE POLICY kade_brand_voices_own_delete ON public.kade_brand_voices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS kade_content_runs_own_select ON public.kade_content_runs;
CREATE POLICY kade_content_runs_own_select ON public.kade_content_runs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_content_runs_own_insert ON public.kade_content_runs;
CREATE POLICY kade_content_runs_own_insert ON public.kade_content_runs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_content_runs_own_update ON public.kade_content_runs;
CREATE POLICY kade_content_runs_own_update ON public.kade_content_runs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS kade_content_runs_own_delete ON public.kade_content_runs;
CREATE POLICY kade_content_runs_own_delete ON public.kade_content_runs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.kade_brand_voices, public.kade_content_runs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kade_brand_voices, public.kade_content_runs TO authenticated;
GRANT ALL ON public.kade_brand_voices, public.kade_content_runs TO service_role;

-- ═══════════════════════════════════════════════════════════
-- 202608290002_kadexai_rebrand.sql
-- ═══════════════════════════════════════════════════════════
-- Mevcut kurulumlarda önceki marka önekli nesneleri veri kaybetmeden taşır.

DO $rebrand$
DECLARE
  previous_prefix TEXT := 'kade' || 'ai';
  current_prefix CONSTANT TEXT := 'kadexai';
  suffix TEXT;
  previous_name TEXT;
  current_name TEXT;
BEGIN
  FOREACH suffix IN ARRAY ARRAY['pricing_overrides', 'quote_requests', 'content_blocks']
  LOOP
    previous_name := previous_prefix || '_' || suffix;
    current_name := current_prefix || '_' || suffix;
    IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
       AND to_regclass(format('public.%I', current_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
    END IF;
  END LOOP;

  previous_name := 'kade' || '_ai_usage';
  current_name := current_prefix || '_usage';
  IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
     AND to_regclass(format('public.%I', current_name)) IS NULL THEN
    EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
  END IF;

  FOREACH suffix IN ARRAY ARRAY['quote_requests_user_idx', 'quote_requests_status_idx']
  LOOP
    previous_name := previous_prefix || '_' || suffix;
    current_name := current_prefix || '_' || suffix;
    IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
       AND to_regclass(format('public.%I', current_name)) IS NULL THEN
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', previous_name, current_name);
    END IF;
  END LOOP;

  previous_name := 'kade' || '_ai_usage_created_idx';
  current_name := current_prefix || '_usage_created_idx';
  IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
     AND to_regclass(format('public.%I', current_name)) IS NULL THEN
    EXECUTE format('ALTER INDEX public.%I RENAME TO %I', previous_name, current_name);
  END IF;

  previous_name := previous_prefix || '_quote_requests_own_select';
  current_name := current_prefix || '_quote_requests_own_select';
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = current_prefix || '_quote_requests'
      AND policyname = previous_name
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = current_prefix || '_quote_requests'
      AND policyname = current_name
  ) THEN
    EXECUTE format(
      'ALTER POLICY %I ON public.%I RENAME TO %I',
      previous_name,
      current_prefix || '_quote_requests',
      current_name
    );
  END IF;

  previous_name := 'handle_' || previous_prefix || '_new_user';
  current_name := 'handle_' || current_prefix || '_new_user';
  IF to_regprocedure(format('public.%I()', previous_name)) IS NOT NULL
     AND to_regprocedure(format('public.%I()', current_name)) IS NULL THEN
    EXECUTE format('ALTER FUNCTION public.%I() RENAME TO %I', previous_name, current_name);
  END IF;

  previous_name := 'on_auth_user_created_' || previous_prefix;
  current_name := 'on_auth_user_created_' || current_prefix;
  IF EXISTS (
    SELECT 1
    FROM pg_trigger trigger_record
    JOIN pg_class table_record ON table_record.oid = trigger_record.tgrelid
    JOIN pg_namespace schema_record ON schema_record.oid = table_record.relnamespace
    WHERE schema_record.nspname = 'auth'
      AND table_record.relname = 'users'
      AND trigger_record.tgname = previous_name
      AND NOT trigger_record.tgisinternal
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger trigger_record
    JOIN pg_class table_record ON table_record.oid = trigger_record.tgrelid
    JOIN pg_namespace schema_record ON schema_record.oid = table_record.relnamespace
    WHERE schema_record.nspname = 'auth'
      AND table_record.relname = 'users'
      AND trigger_record.tgname = current_name
      AND NOT trigger_record.tgisinternal
  ) THEN
    EXECUTE format('ALTER TRIGGER %I ON auth.users RENAME TO %I', previous_name, current_name);
  END IF;
END
$rebrand$;
