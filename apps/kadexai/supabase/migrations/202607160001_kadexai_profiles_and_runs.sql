-- KadexAI account, workspace, brand and auditable tool-run data model.
-- Safe to re-run: tables, indexes and triggers are created idempotently;
-- policies are replaced deliberately so their definitions stay current.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'tr',
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  communication_tone TEXT NOT NULL DEFAULT 'samimi ve profesyonel',
  expertise TEXT NOT NULL DEFAULT '',
  goals TEXT[] NOT NULL DEFAULT '{}',
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, slug)
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'editor', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  niche TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'tr',
  voice TEXT NOT NULL DEFAULT '',
  forbidden_words TEXT[] NOT NULL DEFAULT '{}',
  products TEXT[] NOT NULL DEFAULT '{}',
  website TEXT NOT NULL DEFAULT '',
  social_accounts JSONB NOT NULL DEFAULT '{}'::jsonb,
  competitors TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  content_goals TEXT[] NOT NULL DEFAULT '{}',
  preferred_platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  active_brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  content_language TEXT NOT NULL DEFAULT 'tr',
  target_platforms TEXT[] NOT NULL DEFAULT '{}',
  average_content_length TEXT NOT NULL DEFAULT 'orta',
  emoji_usage BOOLEAN NOT NULL DEFAULT TRUE,
  formality TEXT NOT NULL DEFAULT 'samimi',
  cta_preference TEXT NOT NULL DEFAULT '',
  hashtag_approach TEXT NOT NULL DEFAULT 'dengeli',
  default_format TEXT NOT NULL DEFAULT 'sosyal medya gönderisi',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_model BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS remember_inputs BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_url TEXT NOT NULL DEFAULT '',
  external_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'pending', 'connected', 'error')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  encrypted_secret BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, workspace_id, provider)
);

CREATE TABLE IF NOT EXISTS tool_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  tool TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'auto',
  provider TEXT,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  profile_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  output TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (request_id)
);

CREATE TABLE IF NOT EXISTS content_calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  publish_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Diğer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Diğer';

CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS brands_workspace_idx ON brands(workspace_id);
CREATE INDEX IF NOT EXISTS integrations_user_workspace_idx ON integrations(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS tool_runs_user_created_idx ON tool_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tool_runs_workspace_tool_idx ON tool_runs(workspace_id, tool, created_at DESC);
CREATE INDEX IF NOT EXISTS calendar_user_publish_idx ON content_calendar_items(user_id, publish_at);
CREATE INDEX IF NOT EXISTS templates_user_created_idx ON content_templates(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = target_workspace AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_kadexai_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_uuid UUID;
  preferred_name TEXT;
BEGIN
  preferred_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  INSERT INTO profiles (user_id, display_name) VALUES (NEW.id, preferred_name)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO workspaces (owner_id, name, slug)
  VALUES (NEW.id, preferred_name || ' Çalışma Alanı', 'ana-calisma-alani')
  ON CONFLICT (owner_id, slug) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO workspace_uuid;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_uuid, NEW.id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

  INSERT INTO user_preferences (user_id, active_workspace_id)
  VALUES (NEW.id, workspace_uuid)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_kadexai ON auth.users;
CREATE TRIGGER on_auth_user_created_kadexai
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_kadexai_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_own_all ON profiles;
CREATE POLICY profiles_own_all ON profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS workspaces_member_select ON workspaces;
CREATE POLICY workspaces_member_select ON workspaces FOR SELECT USING (public.is_workspace_member(id) OR owner_id = auth.uid());
DROP POLICY IF EXISTS workspaces_owner_write ON workspaces;
CREATE POLICY workspaces_owner_write ON workspaces FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS workspace_members_member_select ON workspace_members;
CREATE POLICY workspace_members_member_select ON workspace_members FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS workspace_members_owner_write ON workspace_members;
CREATE POLICY workspace_members_owner_write ON workspace_members FOR ALL USING (EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid()));
DROP POLICY IF EXISTS brands_member_all ON brands;
CREATE POLICY brands_member_all ON brands FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS preferences_own_all ON user_preferences;
CREATE POLICY preferences_own_all ON user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS integrations_own_all ON integrations;
CREATE POLICY integrations_own_all ON integrations FOR ALL USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id)) WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS tool_runs_own_all ON tool_runs;
CREATE POLICY tool_runs_own_all ON tool_runs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
DROP POLICY IF EXISTS calendar_own_all ON content_calendar_items;
CREATE POLICY calendar_own_all ON content_calendar_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));
DROP POLICY IF EXISTS templates_own_all ON content_templates;
CREATE POLICY templates_own_all ON content_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (workspace_id IS NULL OR public.is_workspace_member(workspace_id)));

-- Backfill account records for users created before this migration.
INSERT INTO profiles (user_id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

DO $$
DECLARE
  account RECORD;
  workspace_uuid UUID;
  preferred_name TEXT;
BEGIN
  FOR account IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    preferred_name := COALESCE(account.raw_user_meta_data->>'display_name', account.raw_user_meta_data->>'username', split_part(account.email, '@', 1), 'Kullanıcı');
    INSERT INTO workspaces (owner_id, name, slug)
    VALUES (account.id, preferred_name || ' Çalışma Alanı', 'ana-calisma-alani')
    ON CONFLICT (owner_id, slug) DO UPDATE SET name = workspaces.name
    RETURNING id INTO workspace_uuid;

    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (workspace_uuid, account.id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

    INSERT INTO user_preferences (user_id, active_workspace_id)
    VALUES (account.id, workspace_uuid)
    ON CONFLICT (user_id) DO UPDATE
      SET active_workspace_id = COALESCE(user_preferences.active_workspace_id, EXCLUDED.active_workspace_id);
  END LOOP;
END;
$$;
