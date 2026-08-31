-- KadexAI SaaS fiyatlandırmasını (TIER_MONTHLY_TRY, PERIOD_FACTOR, API_EXCLUDED_DISCOUNT)
-- admin panelden, yeniden deploy etmeden düzenlenebilir kılmak için tek satırlık
-- override config tablosu. Değerler kısmi override olarak saklanır; eksik/NULL
-- anahtarlar kod tarafındaki varsayılanlarla (catalog.ts / pricingConfig.ts) doldurulur,
-- böylece bu tablo boş veya erişilemez olsa bile ödeme akışı asla kırılmaz.

CREATE TABLE IF NOT EXISTS public.kadexai_pricing_overrides (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tier_monthly_try JSONB NOT NULL DEFAULT '{}'::jsonb,
  period_factor JSONB NOT NULL DEFAULT '{}'::jsonb,
  api_excluded_discount NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

INSERT INTO public.kadexai_pricing_overrides (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.kadexai_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadexai_pricing_overrides FORCE ROW LEVEL SECURITY;

-- payment_orders/payment_events'te olduğu gibi: istemci tarafından hiçbir
-- okuma/yazma politikası tanımlanmıyor. Fiyatlar yalnızca service-role (admin)
-- istemcisiyle, güvenli admin API route'u üzerinden okunup güncellenebilir.
REVOKE ALL ON public.kadexai_pricing_overrides FROM anon, authenticated;
