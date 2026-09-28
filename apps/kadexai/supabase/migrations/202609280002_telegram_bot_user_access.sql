-- KadeX Telegram botuna ikinci cihaz/hesap erişim istekleri.
-- Ortam değişkenindeki ana sahipler kalıcıdır; bu tablo yalnız devredilmiş erişimleri tutar.

CREATE TABLE IF NOT EXISTS public.telegram_bot_users (
  user_id TEXT PRIMARY KEY CHECK (user_id ~ '^[0-9]{5,20}$'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  display_name TEXT CHECK (display_name IS NULL OR char_length(display_name) <= 120),
  username TEXT CHECK (username IS NULL OR char_length(username) <= 32),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by TEXT CHECK (approved_by IS NULL OR approved_by ~ '^[0-9]{5,20}$'),
  approved_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telegram_bot_users_status_updated_idx
  ON public.telegram_bot_users(status, updated_at DESC);

ALTER TABLE public.telegram_bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_users FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_bot_users FROM anon, authenticated;
GRANT ALL ON public.telegram_bot_users TO service_role;
