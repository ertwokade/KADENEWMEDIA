-- Explicit per-operation RLS policies and provider-neutral payment ledger.
-- Prepared only: do not apply to production without backup and staging validation.

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'shopier')),
  external_id TEXT,
  checkout_url TEXT,
  analytics_consent BOOLEAN NOT NULL DEFAULT FALSE,
  product_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency = 'TRY'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key),
  UNIQUE (provider, external_id)
);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'shopier')),
  event_id TEXT NOT NULL,
  order_id UUID NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_events_order_idx ON public.payment_events(order_id);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_own_all ON public.profiles;
DROP POLICY IF EXISTS profiles_own_select ON public.profiles;
DROP POLICY IF EXISTS profiles_own_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_own_update ON public.profiles;
DROP POLICY IF EXISTS profiles_own_delete ON public.profiles;
CREATE POLICY profiles_own_select ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY profiles_own_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY profiles_own_delete ON public.profiles FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS workspaces_owner_write ON public.workspaces;
DROP POLICY IF EXISTS workspaces_owner_insert ON public.workspaces;
DROP POLICY IF EXISTS workspaces_owner_update ON public.workspaces;
DROP POLICY IF EXISTS workspaces_owner_delete ON public.workspaces;
CREATE POLICY workspaces_owner_insert ON public.workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY workspaces_owner_update ON public.workspaces FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY workspaces_owner_delete ON public.workspaces FOR DELETE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS workspace_members_owner_write ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_owner_insert ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_owner_update ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_owner_delete ON public.workspace_members;
CREATE POLICY workspace_members_owner_insert ON public.workspace_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);
CREATE POLICY workspace_members_owner_update ON public.workspace_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);
CREATE POLICY workspace_members_owner_delete ON public.workspace_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

DROP POLICY IF EXISTS preferences_own_all ON public.user_preferences;
DROP POLICY IF EXISTS preferences_own_select ON public.user_preferences;
DROP POLICY IF EXISTS preferences_own_insert ON public.user_preferences;
DROP POLICY IF EXISTS preferences_own_update ON public.user_preferences;
DROP POLICY IF EXISTS preferences_own_delete ON public.user_preferences;
CREATE POLICY preferences_own_select ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY preferences_own_insert ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY preferences_own_update ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY preferences_own_delete ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS integrations_own_all ON public.integrations;
DROP POLICY IF EXISTS integrations_own_select ON public.integrations;
DROP POLICY IF EXISTS integrations_own_insert ON public.integrations;
DROP POLICY IF EXISTS integrations_own_update ON public.integrations;
DROP POLICY IF EXISTS integrations_own_delete ON public.integrations;
CREATE POLICY integrations_own_select ON public.integrations FOR SELECT USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));
CREATE POLICY integrations_own_insert ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));
CREATE POLICY integrations_own_update ON public.integrations FOR UPDATE USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id)) WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));
CREATE POLICY integrations_own_delete ON public.integrations FOR DELETE USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS tool_runs_own_all ON public.tool_runs;
DROP POLICY IF EXISTS tool_runs_own_select ON public.tool_runs;
DROP POLICY IF EXISTS tool_runs_own_insert ON public.tool_runs;
DROP POLICY IF EXISTS tool_runs_own_update ON public.tool_runs;
DROP POLICY IF EXISTS tool_runs_own_delete ON public.tool_runs;
CREATE POLICY tool_runs_own_select ON public.tool_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY tool_runs_own_insert ON public.tool_runs FOR INSERT WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY tool_runs_own_update ON public.tool_runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY tool_runs_own_delete ON public.tool_runs FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS calendar_own_all ON public.content_calendar_items;
DROP POLICY IF EXISTS calendar_own_select ON public.content_calendar_items;
DROP POLICY IF EXISTS calendar_own_insert ON public.content_calendar_items;
DROP POLICY IF EXISTS calendar_own_update ON public.content_calendar_items;
DROP POLICY IF EXISTS calendar_own_delete ON public.content_calendar_items;
CREATE POLICY calendar_own_select ON public.content_calendar_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY calendar_own_insert ON public.content_calendar_items FOR INSERT WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY calendar_own_update ON public.content_calendar_items FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY calendar_own_delete ON public.content_calendar_items FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS templates_own_all ON public.content_templates;
DROP POLICY IF EXISTS templates_own_select ON public.content_templates;
DROP POLICY IF EXISTS templates_own_insert ON public.content_templates;
DROP POLICY IF EXISTS templates_own_update ON public.content_templates;
DROP POLICY IF EXISTS templates_own_delete ON public.content_templates;
CREATE POLICY templates_own_select ON public.content_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY templates_own_insert ON public.content_templates FOR INSERT WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY templates_own_update ON public.content_templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
CREATE POLICY templates_own_delete ON public.content_templates FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS payment_orders_own_select ON public.payment_orders;
DROP POLICY IF EXISTS payment_orders_own_insert ON public.payment_orders;
CREATE POLICY payment_orders_own_select ON public.payment_orders FOR SELECT USING (auth.uid() = user_id);

-- No client mutation policy is intentionally created for either payment table.
-- Only server-side service role code may create orders, insert verified callbacks
-- or change order state; product/price values therefore cannot be forged through
-- a direct authenticated Supabase client.
REVOKE ALL ON public.payment_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_orders FROM anon, authenticated;
GRANT SELECT ON public.payment_orders TO authenticated;
