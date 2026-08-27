-- KadeAI "Teklif Al" akışı (§15) ve tekliften ödemeye dönüşüm (§16).
--
-- Ana sitedeki public.kade_quotes ajans/danışmanlık talepleri içindir
-- (hizmetler, platformlar, aylık bütçe). KadeAI'nin ihtiyacı farklı: ekip
-- büyüklüğü, API gereksinimi, tahmini kullanım, istenen özellikler. Bu yüzden
-- o tabloya sütun eklemek yerine ayrı bir tablo kullanılıyor; iki ürünün
-- pipeline'ları da birbirinden bağımsız ilerliyor.

CREATE TABLE IF NOT EXISTS public.kadeai_quote_requests (
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

CREATE INDEX IF NOT EXISTS kadeai_quote_requests_user_idx
  ON public.kadeai_quote_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kadeai_quote_requests_status_idx
  ON public.kadeai_quote_requests(status, created_at DESC);

ALTER TABLE public.kadeai_quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadeai_quote_requests FORCE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi taleplerini GÖRÜR. Yazma tamamen sunucudadır:
-- status/payment_order_id gibi alanlar istemciden gelemesin diye INSERT bile
-- service-role ile yapılır.
DROP POLICY IF EXISTS kadeai_quote_requests_own_select ON public.kadeai_quote_requests;
CREATE POLICY kadeai_quote_requests_own_select ON public.kadeai_quote_requests
  FOR SELECT USING (auth.uid() = user_id);

REVOKE ALL ON public.kadeai_quote_requests FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.kadeai_quote_requests FROM anon, authenticated;
GRANT SELECT ON public.kadeai_quote_requests TO authenticated;
