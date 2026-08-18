-- Materyal kutuphanesi: arsivhub.com (ve ileride YouTube/TikTok) uzerinden
-- toplanan medya kayitlarinin ortak havuzu.
--
-- Trend tablolariyla ayni mantik: havuz kullaniciya ozel degildir, yazma
-- yalnizca service-role'dedir (toplama sunucuda calisir), authenticated roller
-- yalnizca okur. Kisiye ozel olan tek sey koleksiyon (favori) kayitlaridir.

CREATE TABLE IF NOT EXISTS public.kade_materials (
  id            TEXT PRIMARY KEY,
  source        TEXT NOT NULL,
  kind          TEXT NOT NULL,
  external_id   TEXT,
  title         TEXT NOT NULL DEFAULT '',
  normalized    TEXT NOT NULL DEFAULT '',
  description   TEXT,
  page_url      TEXT NOT NULL,
  media_url     TEXT,
  thumbnail     TEXT,
  duration_sec  INTEGER,
  width         INTEGER,
  height        INTEGER,
  view_count    BIGINT,
  tags          JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_at  TIMESTAMPTZ,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw           JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS kade_materials_source_idx     ON public.kade_materials(source, kind);
CREATE INDEX IF NOT EXISTS kade_materials_published_idx  ON public.kade_materials(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS kade_materials_last_seen_idx  ON public.kade_materials(last_seen DESC);
CREATE INDEX IF NOT EXISTS kade_materials_normalized_idx ON public.kade_materials(normalized text_pattern_ops);
CREATE INDEX IF NOT EXISTS kade_materials_views_idx      ON public.kade_materials(view_count DESC NULLS LAST);

-- Toplama kosularinin kaydi: hangi kaynak, ne zaman, kac kayit, hata var mi.
CREATE TABLE IF NOT EXISTS public.kade_material_runs (
  id           BIGSERIAL PRIMARY KEY,
  source       TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  found        INTEGER NOT NULL DEFAULT 0,
  inserted     INTEGER NOT NULL DEFAULT 0,
  updated      INTEGER NOT NULL DEFAULT 0,
  ok           BOOLEAN NOT NULL DEFAULT TRUE,
  error        TEXT
);

CREATE INDEX IF NOT EXISTS kade_material_runs_source_idx ON public.kade_material_runs(source, started_at DESC);

-- Kisiye ozel koleksiyon.
CREATE TABLE IF NOT EXISTS public.kade_material_saves (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES public.kade_materials(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, material_id)
);

ALTER TABLE public.kade_materials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_material_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kade_material_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kade_materials_read ON public.kade_materials;
CREATE POLICY kade_materials_read ON public.kade_materials
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_material_runs_read ON public.kade_material_runs;
CREATE POLICY kade_material_runs_read ON public.kade_material_runs
  FOR SELECT TO authenticated USING (TRUE);

DROP POLICY IF EXISTS kade_material_saves_rw ON public.kade_material_saves;
CREATE POLICY kade_material_saves_rw ON public.kade_material_saves
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.kade_materials, public.kade_material_runs TO authenticated;
GRANT ALL    ON public.kade_material_saves TO authenticated;
GRANT ALL    ON public.kade_materials, public.kade_material_runs, public.kade_material_saves TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
