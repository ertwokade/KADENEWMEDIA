-- Admin CMS (§25): kamuya açık KadeAI içeriğinin metinleri.
--
-- Frontend, koddaki varsayılanları taban alır ve bu tablodaki override'ı
-- üzerine bindirir. Böylece tablo boşken (veya erişilemezken) sayfa yine
-- eksiksiz render olur — CMS bir bağımlılık değil, bir katmandır.

CREATE TABLE IF NOT EXISTS public.kadeai_content_blocks (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kadeai_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kadeai_content_blocks FORCE ROW LEVEL SECURITY;

-- İçerik kamuya açık olsa da okuma sunucudan (service-role) yapılır; istemciye
-- doğrudan tablo erişimi verilmez ki yazma yüzeyi hiç oluşmasın.
REVOKE ALL ON public.kadeai_content_blocks FROM anon, authenticated;
