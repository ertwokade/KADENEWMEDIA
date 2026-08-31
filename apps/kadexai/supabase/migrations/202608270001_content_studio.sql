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
