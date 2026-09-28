-- KadeX Telegram botuna gönderilen Instagram Reels / TikTok bağlantıları.
-- Sohbet kimlikleri ve kayıtlar yalnız service-role tarafından işlenir.

CREATE TABLE IF NOT EXISTS public.telegram_saved_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id TEXT NOT NULL CHECK (chat_id ~ '^-?[0-9]{5,20}$'),
  added_by TEXT NOT NULL CHECK (added_by ~ '^[0-9]{5,20}$'),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  canonical_url TEXT NOT NULL CHECK (canonical_url ~ '^https://'),
  original_url TEXT NOT NULL CHECK (original_url ~ '^https://'),
  external_id TEXT,
  title TEXT CHECK (title IS NULL OR char_length(title) <= 500),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  author_name TEXT CHECK (author_name IS NULL OR char_length(author_name) <= 200),
  author_url TEXT CHECK (author_url IS NULL OR char_length(author_url) <= 1000),
  thumbnail_url TEXT CHECK (thumbnail_url IS NULL OR char_length(thumbnail_url) <= 2000),
  published_at TIMESTAMPTZ,
  views BIGINT CHECK (views IS NULL OR views >= 0),
  likes BIGINT CHECK (likes IS NULL OR likes >= 0),
  comments BIGINT CHECK (comments IS NULL OR comments >= 0),
  shares BIGINT CHECK (shares IS NULL OR shares >= 0),
  saves BIGINT CHECK (saves IS NULL OR saves >= 0),
  metadata_source TEXT NOT NULL CHECK (char_length(metadata_source) <= 160),
  metrics_source TEXT CHECK (metrics_source IS NULL OR char_length(metrics_source) <= 160),
  metrics_status TEXT NOT NULL DEFAULT 'unavailable' CHECK (metrics_status IN ('available', 'partial', 'unavailable')),
  metric_updated_at TIMESTAMPTZ,
  last_fetch_status TEXT NOT NULL DEFAULT 'partial' CHECK (last_fetch_status IN ('success', 'partial', 'failed')),
  last_fetch_error TEXT CHECK (last_fetch_error IS NULL OR char_length(last_fetch_error) <= 500),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chat_id, canonical_url)
);

CREATE INDEX IF NOT EXISTS telegram_saved_content_chat_added_idx
  ON public.telegram_saved_content(chat_id, added_at DESC);
CREATE INDEX IF NOT EXISTS telegram_saved_content_chat_platform_idx
  ON public.telegram_saved_content(chat_id, platform, added_at DESC);

CREATE TABLE IF NOT EXISTS public.telegram_content_digest_deliveries (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL CHECK (chat_id ~ '^-?[0-9]{5,20}$'),
  schedule_key TEXT NOT NULL CHECK (schedule_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T(09|12):00\+03:00$'),
  status TEXT NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed', 'skipped')),
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  error_message TEXT CHECK (error_message IS NULL OR char_length(error_message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE (chat_id, schedule_key)
);

CREATE INDEX IF NOT EXISTS telegram_content_digest_created_idx
  ON public.telegram_content_digest_deliveries(created_at DESC);

ALTER TABLE public.telegram_saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_saved_content FORCE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_content_digest_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_content_digest_deliveries FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.telegram_saved_content, public.telegram_content_digest_deliveries FROM anon, authenticated;
GRANT ALL ON public.telegram_saved_content, public.telegram_content_digest_deliveries TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.telegram_content_digest_deliveries_id_seq TO service_role;
