-- KadeX Telegram botunun sahibi tarafından etkinleştirilen grup sohbetleri.
-- Yalnız service-role erişir; grup kimlikleri istemci API'lerine açılmaz.

CREATE TABLE IF NOT EXISTS public.telegram_bot_chats (
  chat_id TEXT PRIMARY KEY CHECK (chat_id ~ '^-[0-9]{5,20}$'),
  chat_type TEXT NOT NULL CHECK (chat_type IN ('group', 'supergroup')),
  title TEXT CHECK (title IS NULL OR char_length(title) <= 120),
  activated_by TEXT NOT NULL CHECK (activated_by ~ '^[0-9]{5,20}$'),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS telegram_bot_chats_active_idx
  ON public.telegram_bot_chats(active, updated_at DESC);

ALTER TABLE public.telegram_bot_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_chats FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.telegram_bot_chats FROM anon, authenticated;
