-- SECURITY DEFINER membership helpers are required to avoid recursive RLS
-- evaluation, but they must not live in a PostgREST-exposed schema. Moving
-- them preserves policy dependencies by object identity while removing the
-- public RPC surface entirely.

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

ALTER FUNCTION public.is_workspace_member(UUID) SET SCHEMA private;
ALTER FUNCTION public.can_manage_workspace(UUID) SET SCHEMA private;

REVOKE ALL ON FUNCTION private.is_workspace_member(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.can_manage_workspace(UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_manage_workspace(UUID) TO authenticated;
