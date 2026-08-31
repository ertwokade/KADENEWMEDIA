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
