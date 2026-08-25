-- KadeSearch içerik onay kuyruğu.
-- Trendler ortak havuzdur; kararlar ve içerik paketleri kullanıcıya özeldir.

CREATE TABLE IF NOT EXISTS public.kade_content_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trend_id    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  idea        JSONB NOT NULL DEFAULT '{}'::jsonb,
  draft       JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes       TEXT NOT NULL DEFAULT '',
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, trend_id)
);

CREATE INDEX IF NOT EXISTS kade_content_approvals_user_status_idx
  ON public.kade_content_approvals(user_id, status, updated_at DESC);

ALTER TABLE public.kade_content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_content_approvals FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kade_content_approvals_own_select ON public.kade_content_approvals;
CREATE POLICY kade_content_approvals_own_select ON public.kade_content_approvals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS kade_content_approvals_own_insert ON public.kade_content_approvals;
CREATE POLICY kade_content_approvals_own_insert ON public.kade_content_approvals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS kade_content_approvals_own_update ON public.kade_content_approvals;
CREATE POLICY kade_content_approvals_own_update ON public.kade_content_approvals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS kade_content_approvals_own_delete ON public.kade_content_approvals;
CREATE POLICY kade_content_approvals_own_delete ON public.kade_content_approvals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.kade_content_approvals FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kade_content_approvals TO authenticated;
GRANT ALL ON public.kade_content_approvals TO service_role;
