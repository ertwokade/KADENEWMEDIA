-- İşlem akışı: WhatsApp bildirimlerinin kaynağı ve gün sonu özetinin defteri.
--
-- Bildirim doğrudan gönderilip unutulmuyor; önce buraya yazılıyor. Böylece
-- anlık gönderim başarısız olsa da (sağlayıcı sınırı, ağ hatası) olay kaybolmaz
-- ve gün sonu özetinde görünür.

CREATE TABLE IF NOT EXISTS public.operation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (char_length(kind) BETWEEN 1 AND 60),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  detail TEXT CHECK (detail IS NULL OR char_length(detail) <= 500),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Anlık bildirim gönderildiyse zamanı; NULL ise yalnız özete girer.
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS operation_events_created_idx
  ON public.operation_events(created_at DESC);
-- Saatlik gönderim bütçesini saymak için.
CREATE INDEX IF NOT EXISTS operation_events_notified_idx
  ON public.operation_events(notified_at DESC) WHERE notified_at IS NOT NULL;

ALTER TABLE public.operation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_events FORCE ROW LEVEL SECURITY;
-- Yalnız sunucu yazar ve okur; işlem akışı sahibe aittir.
REVOKE ALL ON public.operation_events FROM anon, authenticated;
