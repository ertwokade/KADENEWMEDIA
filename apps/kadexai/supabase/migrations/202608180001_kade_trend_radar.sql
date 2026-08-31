-- KADE SEARCH -> KadexAI "Trend Radar" veri katmani.
--
-- Trend verisi KULLANICIYA OZEL DEGILDIR: tek bir toplama havuzu tum calisma
-- alanlari tarafindan okunur. Bu yuzden trends/snapshots/scores/links/runs/alerts
-- tablolarinda yazma yetkisi yalnizca service-role'dedir (toplama isi sunucuda
-- calisir); authenticated roller sadece okur. Izleme listesi ise kisiye ozeldir.
--
-- Sema SQLite surumunun birebir karsiligidir; skor motoru ayni alanlari bekler.

-- 1) Trend varliklari -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trends (
  id            TEXT PRIMARY KEY,
  platform      TEXT NOT NULL,
  kind          TEXT NOT NULL,
  external_id   TEXT,
  title         TEXT NOT NULL DEFAULT '',
  normalized    TEXT NOT NULL DEFAULT '',
  url           TEXT,
  thumbnail     TEXT,
  author        TEXT,
  author_url    TEXT,
  description   TEXT,
  category      TEXT,
  subcategories JSONB NOT NULL DEFAULT '[]'::jsonb,
  formats       JSONB NOT NULL DEFAULT '[]'::jsonb,
  country       TEXT,
  language      TEXT,
  duration_sec  INTEGER,
  published_at  TIMESTAMPTZ,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inferred      BOOLEAN NOT NULL DEFAULT FALSE,
  raw           JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS kade_trends_platform_idx  ON public.kade_trends(platform, kind);
CREATE INDEX IF NOT EXISTS kade_trends_category_idx  ON public.kade_trends(category);
CREATE INDEX IF NOT EXISTS kade_trends_country_idx   ON public.kade_trends(country);
CREATE INDEX IF NOT EXISTS kade_trends_last_seen_idx ON public.kade_trends(last_seen DESC);
CREATE INDEX IF NOT EXISTS kade_trends_normalized_idx ON public.kade_trends(normalized text_pattern_ops);

-- 2) Toplama calismalari ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_runs (
  id           TEXT PRIMARY KEY,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'running',
  sources      JSONB NOT NULL DEFAULT '[]'::jsonb,
  countries    JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_found  INTEGER NOT NULL DEFAULT 0,
  items_new    INTEGER NOT NULL DEFAULT 0,
  errors       JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms  INTEGER
);

CREATE INDEX IF NOT EXISTS kade_trend_runs_started_idx ON public.kade_trend_runs(started_at DESC);

-- 3) Olcum anlik goruntuleri (zaman serisi) --------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_snapshots (
  id          BIGSERIAL PRIMARY KEY,
  trend_id    TEXT NOT NULL REFERENCES public.kade_trends(id) ON DELETE CASCADE,
  run_id      TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rank        INTEGER,
  views       BIGINT NOT NULL DEFAULT 0,
  likes       BIGINT NOT NULL DEFAULT 0,
  comments    BIGINT NOT NULL DEFAULT 0,
  shares      BIGINT NOT NULL DEFAULT 0,
  saves       BIGINT NOT NULL DEFAULT 0,
  posts       BIGINT NOT NULL DEFAULT 0,
  followers   BIGINT NOT NULL DEFAULT 0,
  extra       JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS kade_trend_snapshots_trend_idx ON public.kade_trend_snapshots(trend_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS kade_trend_snapshots_run_idx   ON public.kade_trend_snapshots(run_id);

-- 4) Hesaplanan skorlar -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_scores (
  id            BIGSERIAL PRIMARY KEY,
  trend_id      TEXT NOT NULL REFERENCES public.kade_trends(id) ON DELETE CASCADE,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score         REAL NOT NULL DEFAULT 0,
  velocity      REAL NOT NULL DEFAULT 0,
  acceleration  REAL NOT NULL DEFAULT 0,
  engagement    REAL NOT NULL DEFAULT 0,
  volume_score  REAL NOT NULL DEFAULT 0,
  rank_score    REAL NOT NULL DEFAULT 0,
  cross_score   REAL NOT NULL DEFAULT 0,
  freshness     REAL NOT NULL DEFAULT 0,
  stage         TEXT,
  breakdown     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS kade_trend_scores_trend_idx ON public.kade_trend_scores(trend_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS kade_trend_scores_value_idx ON public.kade_trend_scores(score DESC);

-- 5) Platformlar arasi eslesme ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_links (
  id          BIGSERIAL PRIMARY KEY,
  a_id        TEXT NOT NULL REFERENCES public.kade_trends(id) ON DELETE CASCADE,
  b_id        TEXT NOT NULL REFERENCES public.kade_trends(id) ON DELETE CASCADE,
  confidence  REAL NOT NULL DEFAULT 0,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (a_id, b_id)
);

CREATE INDEX IF NOT EXISTS kade_trend_links_a_idx ON public.kade_trend_links(a_id);
CREATE INDEX IF NOT EXISTS kade_trend_links_b_idx ON public.kade_trend_links(b_id);

-- 6) Uyarilar ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_alerts (
  id         BIGSERIAL PRIMARY KEY,
  trend_id   TEXT REFERENCES public.kade_trends(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS kade_trend_alerts_created_idx ON public.kade_trend_alerts(created_at DESC);

-- Ayni trend + tur icin tek uyari satiri tutulur: izleme/capraz eslesme tekrari
-- yazilmaz, patlama uyarisi ise yerinde guncellenir.
--
-- Kosullu (partial) indeks KULLANILMAZ: PostgREST'in upsert'i ON CONFLICT
-- hedefine yuklem ekleyemedigi icin kosullu indeksle eslesmez ve yazma patlar.
-- trend_id NULL olan satirlar Postgres'te zaten birbirine esit sayilmaz, bu
-- yuzden genel kisit dogru davranir.
ALTER TABLE public.kade_trend_alerts
  DROP CONSTRAINT IF EXISTS kade_trend_alerts_trend_type_key;
ALTER TABLE public.kade_trend_alerts
  ADD CONSTRAINT kade_trend_alerts_trend_type_key UNIQUE (trend_id, type);

-- 7) Kisiye ozel izleme listesi --------------------------------------------
CREATE TABLE IF NOT EXISTS public.kade_trend_watchlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term       TEXT NOT NULL,
  normalized TEXT NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, normalized)
);

CREATE INDEX IF NOT EXISTS kade_trend_watchlist_user_idx ON public.kade_trend_watchlist(user_id, created_at DESC);

-- 8) "Guncel durum" gorunumu -----------------------------------------------
-- SQLite surumundeki queryTrends() JOIN'inin karsiligi: her trendin en son
-- skoru + en son olcumu tek satirda. PostgREST bu gorunum uzerinden filtreler.
CREATE OR REPLACE VIEW public.kade_trend_current AS
SELECT
  t.id, t.platform, t.kind, t.external_id, t.title, t.normalized, t.url, t.thumbnail,
  t.author, t.author_url, t.description, t.category, t.subcategories, t.formats,
  t.country, t.language, t.duration_sec, t.published_at, t.first_seen, t.last_seen, t.inferred,
  s.score, s.velocity, s.acceleration, s.engagement, s.volume_score, s.rank_score,
  s.cross_score, s.freshness, s.stage, s.breakdown, s.computed_at,
  sn.views, sn.likes, sn.comments, sn.shares, sn.saves, sn.posts, sn.followers, sn.rank,
  COALESCE(sc.snapshot_count, 0) AS snapshot_count,
  COALESCE(lc.link_count, 0) AS link_count
FROM public.kade_trends t
LEFT JOIN LATERAL (
  SELECT * FROM public.kade_trend_scores z
  WHERE z.trend_id = t.id ORDER BY z.computed_at DESC, z.id DESC LIMIT 1
) s ON TRUE
LEFT JOIN LATERAL (
  SELECT * FROM public.kade_trend_snapshots z
  WHERE z.trend_id = t.id ORDER BY z.captured_at DESC, z.id DESC LIMIT 1
) sn ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS snapshot_count FROM public.kade_trend_snapshots z WHERE z.trend_id = t.id
) sc ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS link_count FROM public.kade_trend_links l WHERE l.a_id = t.id OR l.b_id = t.id
) lc ON TRUE;

-- Gorunum cagiranin yetkileriyle calissin (altindaki RLS gecerli kalsin).
ALTER VIEW public.kade_trend_current SET (security_invoker = on);

-- 9) RLS --------------------------------------------------------------------
ALTER TABLE public.kade_trends           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_watchlist  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.kade_trends           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_runs       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_snapshots  FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_scores     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_links      FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_alerts     FORCE ROW LEVEL SECURITY;
ALTER TABLE public.kade_trend_watchlist  FORCE ROW LEVEL SECURITY;

-- Ortak trend havuzu: oturum acmis herkes okur, kimse yazamaz (yazma service-role).
DROP POLICY IF EXISTS kade_trends_read ON public.kade_trends;
CREATE POLICY kade_trends_read ON public.kade_trends FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_trend_runs_read ON public.kade_trend_runs;
CREATE POLICY kade_trend_runs_read ON public.kade_trend_runs FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_trend_snapshots_read ON public.kade_trend_snapshots;
CREATE POLICY kade_trend_snapshots_read ON public.kade_trend_snapshots FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_trend_scores_read ON public.kade_trend_scores;
CREATE POLICY kade_trend_scores_read ON public.kade_trend_scores FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_trend_links_read ON public.kade_trend_links;
CREATE POLICY kade_trend_links_read ON public.kade_trend_links FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_trend_alerts_read ON public.kade_trend_alerts;
CREATE POLICY kade_trend_alerts_read ON public.kade_trend_alerts FOR SELECT TO authenticated USING (TRUE);

-- Izleme listesi: yalnizca sahibi.
DROP POLICY IF EXISTS kade_trend_watchlist_own ON public.kade_trend_watchlist;
CREATE POLICY kade_trend_watchlist_own ON public.kade_trend_watchlist
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10) Grants ----------------------------------------------------------------
REVOKE ALL ON public.kade_trends, public.kade_trend_runs, public.kade_trend_snapshots,
              public.kade_trend_scores, public.kade_trend_links, public.kade_trend_alerts,
              public.kade_trend_watchlist, public.kade_trend_current
  FROM anon, authenticated;

GRANT SELECT ON public.kade_trends, public.kade_trend_runs, public.kade_trend_snapshots,
                public.kade_trend_scores, public.kade_trend_links, public.kade_trend_alerts,
                public.kade_trend_current
  TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kade_trend_watchlist TO authenticated;

-- Toplama isi service-role ile calisir; yazma yetkisi acikca verilir.
GRANT ALL ON public.kade_trends, public.kade_trend_runs, public.kade_trend_snapshots,
             public.kade_trend_scores, public.kade_trend_links, public.kade_trend_alerts,
             public.kade_trend_watchlist
  TO service_role;
GRANT SELECT ON public.kade_trend_current TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
