-- Merkezi audit trail ve kontrollü feature rollout altyapısı.

CREATE TABLE IF NOT EXISTS public.platform_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  outcome TEXT NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'denied', 'failed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS platform_audit_events_created_idx
  ON public.platform_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS platform_audit_events_actor_idx
  ON public.platform_audit_events(actor_user_id, created_at DESC);

ALTER TABLE public.platform_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_events FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_audit_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,79}$'),
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  admin_only BOOLEAN NOT NULL DEFAULT FALSE,
  beta_only BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_users UUID[] NOT NULL DEFAULT '{}',
  allowed_tiers TEXT[] NOT NULL DEFAULT '{}',
  rollout_percent INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  description TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.feature_flags FROM anon, authenticated;
