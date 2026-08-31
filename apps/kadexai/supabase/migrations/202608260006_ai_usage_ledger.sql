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
