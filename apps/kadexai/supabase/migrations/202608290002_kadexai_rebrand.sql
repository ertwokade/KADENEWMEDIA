-- KadexAI yeniden adlandırması: mevcut kurulumlarda önceki marka önekli
-- nesneleri veri kaybetmeden yeni öneke taşır. Temiz kurulumlarda no-op'tur.

DO $rebrand$
DECLARE
  previous_prefix TEXT := 'kade' || 'ai';
  current_prefix CONSTANT TEXT := 'kadexai';
  suffix TEXT;
  previous_name TEXT;
  current_name TEXT;
BEGIN
  FOREACH suffix IN ARRAY ARRAY['pricing_overrides', 'quote_requests', 'content_blocks']
  LOOP
    previous_name := previous_prefix || '_' || suffix;
    current_name := current_prefix || '_' || suffix;

    IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
       AND to_regclass(format('public.%I', current_name)) IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
    END IF;
  END LOOP;

  previous_name := 'kade' || '_ai_usage';
  current_name := current_prefix || '_usage';
  IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
     AND to_regclass(format('public.%I', current_name)) IS NULL THEN
    EXECUTE format('ALTER TABLE public.%I RENAME TO %I', previous_name, current_name);
  END IF;

  FOREACH suffix IN ARRAY ARRAY['quote_requests_user_idx', 'quote_requests_status_idx']
  LOOP
    previous_name := previous_prefix || '_' || suffix;
    current_name := current_prefix || '_' || suffix;

    IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
       AND to_regclass(format('public.%I', current_name)) IS NULL THEN
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', previous_name, current_name);
    END IF;
  END LOOP;

  previous_name := 'kade' || '_ai_usage_created_idx';
  current_name := current_prefix || '_usage_created_idx';
  IF to_regclass(format('public.%I', previous_name)) IS NOT NULL
     AND to_regclass(format('public.%I', current_name)) IS NULL THEN
    EXECUTE format('ALTER INDEX public.%I RENAME TO %I', previous_name, current_name);
  END IF;

  previous_name := previous_prefix || '_quote_requests_own_select';
  current_name := current_prefix || '_quote_requests_own_select';
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = current_prefix || '_quote_requests'
      AND policyname = previous_name
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = current_prefix || '_quote_requests'
      AND policyname = current_name
  ) THEN
    EXECUTE format(
      'ALTER POLICY %I ON public.%I RENAME TO %I',
      previous_name,
      current_prefix || '_quote_requests',
      current_name
    );
  END IF;

  previous_name := 'handle_' || previous_prefix || '_new_user';
  current_name := 'handle_' || current_prefix || '_new_user';
  IF to_regprocedure(format('public.%I()', previous_name)) IS NOT NULL
     AND to_regprocedure(format('public.%I()', current_name)) IS NULL THEN
    EXECUTE format('ALTER FUNCTION public.%I() RENAME TO %I', previous_name, current_name);
  END IF;

  previous_name := 'on_auth_user_created_' || previous_prefix;
  current_name := 'on_auth_user_created_' || current_prefix;
  IF EXISTS (
    SELECT 1
    FROM pg_trigger trigger_record
    JOIN pg_class table_record ON table_record.oid = trigger_record.tgrelid
    JOIN pg_namespace schema_record ON schema_record.oid = table_record.relnamespace
    WHERE schema_record.nspname = 'auth'
      AND table_record.relname = 'users'
      AND trigger_record.tgname = previous_name
      AND NOT trigger_record.tgisinternal
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger trigger_record
    JOIN pg_class table_record ON table_record.oid = trigger_record.tgrelid
    JOIN pg_namespace schema_record ON schema_record.oid = table_record.relnamespace
    WHERE schema_record.nspname = 'auth'
      AND table_record.relname = 'users'
      AND trigger_record.tgname = current_name
      AND NOT trigger_record.tgisinternal
  ) THEN
    EXECUTE format('ALTER TRIGGER %I ON auth.users RENAME TO %I', previous_name, current_name);
  END IF;
END
$rebrand$;
