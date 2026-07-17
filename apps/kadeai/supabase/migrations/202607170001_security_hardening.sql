-- KADE AI security hardening.
-- Idempotent: safe to re-run after the base schema migration.

CREATE TABLE IF NOT EXISTS public.content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  model TEXT NOT NULL,
  input_data JSONB,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.operations_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_history_user_id_idx ON public.content_history(user_id);
CREATE INDEX IF NOT EXISTS content_history_created_at_idx ON public.content_history(created_at DESC);

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = target_workspace AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_workspace(target_workspace UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = target_workspace
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_kadeai_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  workspace_uuid UUID;
  preferred_name TEXT;
BEGIN
  preferred_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, preferred_name)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.workspaces (owner_id, name, slug)
  VALUES (NEW.id, preferred_name || ' Çalışma Alanı', 'ana-calisma-alani')
  ON CONFLICT (owner_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO workspace_uuid;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (workspace_uuid, NEW.id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

  INSERT INTO public.user_preferences (user_id, active_workspace_id)
  VALUES (NEW.id, workspace_uuid)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_workspace(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_kadeai_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace(UUID) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_state ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.brands FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.integrations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tool_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE public.content_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public.operations_state FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brands_member_all ON public.brands;
DROP POLICY IF EXISTS brands_member_select ON public.brands;
DROP POLICY IF EXISTS brands_manager_insert ON public.brands;
DROP POLICY IF EXISTS brands_manager_update ON public.brands;
DROP POLICY IF EXISTS brands_manager_delete ON public.brands;
CREATE POLICY brands_member_select ON public.brands
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY brands_manager_insert ON public.brands
  FOR INSERT WITH CHECK (public.can_manage_workspace(workspace_id) AND created_by = auth.uid());
CREATE POLICY brands_manager_update ON public.brands
  FOR UPDATE USING (public.can_manage_workspace(workspace_id))
  WITH CHECK (public.can_manage_workspace(workspace_id));
CREATE POLICY brands_manager_delete ON public.brands
  FOR DELETE USING (public.can_manage_workspace(workspace_id));

DROP POLICY IF EXISTS content_history_own_select ON public.content_history;
DROP POLICY IF EXISTS content_history_own_insert ON public.content_history;
DROP POLICY IF EXISTS content_history_own_delete ON public.content_history;
DROP POLICY IF EXISTS "Users can view their own history" ON public.content_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON public.content_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON public.content_history;
CREATE POLICY content_history_own_select ON public.content_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY content_history_own_insert ON public.content_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY content_history_own_delete ON public.content_history
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS operations_state_own_select ON public.operations_state;
DROP POLICY IF EXISTS operations_state_own_insert ON public.operations_state;
DROP POLICY IF EXISTS operations_state_own_update ON public.operations_state;
DROP POLICY IF EXISTS "Users can view their own operations state" ON public.operations_state;
DROP POLICY IF EXISTS "Users can insert their own operations state" ON public.operations_state;
DROP POLICY IF EXISTS "Users can update their own operations state" ON public.operations_state;
CREATE POLICY operations_state_own_select ON public.operations_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY operations_state_own_insert ON public.operations_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY operations_state_own_update ON public.operations_state
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
