-- Reddit Atom/RSS does not expose views, likes or comments. Older collector
-- runs stored rank-derived estimates before these rows were explicitly marked
-- as inferred. Correct the historical flag so discovery never presents those
-- estimates as measured popularity.

UPDATE public.kade_trends
SET inferred = TRUE,
    raw = raw || '{"inferred": true}'::jsonb
WHERE platform = 'reddit'
  AND COALESCE(raw->>'source', '') = 'rss'
  AND inferred = FALSE;
