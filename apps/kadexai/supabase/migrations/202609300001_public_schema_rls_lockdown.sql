-- Supabase Security Advisor: rls_disabled_in_public
-- Every current base or partitioned table in the exposed public schema must
-- have RLS enabled. Existing policies and grants are deliberately preserved;
-- tables without a policy become deny-by-default for anon/authenticated users.
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT namespace.nspname AS schema_name, relation.relname AS table_name
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND NOT relation.relrowsecurity
    ORDER BY relation.relname
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      table_record.schema_name,
      table_record.table_name
    );
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND NOT relation.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS lockdown failed: public tables remain without row-level security';
  END IF;
END
$$;
