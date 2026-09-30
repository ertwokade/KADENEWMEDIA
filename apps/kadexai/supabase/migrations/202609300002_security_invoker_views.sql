-- Supabase Security Advisor: security_definer_view
--
-- PostgreSQL views run with the view owner's permissions by default. For an
-- API-facing view this can bypass the caller's RLS restrictions. Make the
-- active-entitlements view evaluate permissions and RLS as the querying user.
ALTER VIEW public.active_entitlements
  SET (security_invoker = true);
