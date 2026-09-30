-- Supabase Security Advisor:
--   * anon_security_definer_function_executable
--   * auth_users_security_definer_function_executable
--   * function_search_path_mutable
--
-- Membership helpers are intentionally SECURITY DEFINER so RLS policies can
-- inspect workspace membership without recursively re-entering those same
-- policies. They are available only to signed-in users. Trigger-only helpers
-- must never be exposed as PostgREST RPC endpoints.

REVOKE ALL ON FUNCTION public.is_workspace_member(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_workspace(UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_workspace(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_kadexai_new_user()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kade_unique_workspace_slug(TEXT, UUID)
  FROM PUBLIC, anon, authenticated;

-- Some older managed projects still contain the pre-KadexAI trigger name.
-- Fresh installations do not, so keep the cleanup conditional.
DO $$
BEGIN
  IF to_regprocedure('public.handle_kadeai_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.handle_kadeai_new_user() FROM PUBLIC, anon, authenticated';
  END IF;
END
$$;

-- This trigger uses only NEW and built-in functions; an empty search path is
-- both sufficient and resistant to object-shadowing attacks.
ALTER FUNCTION public.kade_set_updated_at() SET search_path = '';
REVOKE ALL ON FUNCTION public.kade_set_updated_at()
  FROM PUBLIC, anon, authenticated;
