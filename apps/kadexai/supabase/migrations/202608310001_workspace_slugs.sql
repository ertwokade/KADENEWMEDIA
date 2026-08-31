-- Çalışma alanı adresleri (slug).
--
-- Panel artık her kullanıcı için kendi adresinde açılıyor:
--   /kadexai/<slug>/dashboard/...
--
-- Slug bugüne kadar herkese sabit 'ana-calisma-alani' olarak yazılıyordu ve
-- yalnızca (owner_id, slug) çifti benzersizdi. Adres olarak kullanılacağı için
-- global benzersiz olması gerekiyor.
--
-- Slug bir YETKİ DEĞİL, yalnızca adrestir. Erişim her zaman oturumdan
-- doğrulanır; bu geçiş hiçbir RLS kuralını gevşetmez.

BEGIN;

-- 1) Ayrılmış adresler. Panelin kendi rotalarıyla çakışan adlar alan adı
--    olarak kullanılamaz; uygulama katmanındaki liste ile aynı tutulmalı.
CREATE TABLE IF NOT EXISTS public.reserved_workspace_slugs (
  slug TEXT PRIMARY KEY
);

INSERT INTO public.reserved_workspace_slugs (slug)
VALUES
  ('api'), ('dashboard'), ('login'), ('logout'), ('onboarding'), ('auth'),
  ('legal'), ('reset-password'), ('admin'), ('settings'), ('kadexai'),
  ('kadeai'), ('assets'), ('static'), ('_next'), ('public'), ('demo')
ON CONFLICT (slug) DO NOTHING;

-- 2) Adres üretici. Türkçe harfleri karşılıklarına çevirir, geri kalanı
--    tireye indirger. Uygulamadaki slugifyWorkspaceName ile aynı sonucu verir.
CREATE OR REPLACE FUNCTION public.kade_slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT NULLIF(
    SUBSTRING(
      TRIM(BOTH '-' FROM
        REGEXP_REPLACE(
          LOWER(TRANSLATE(COALESCE(input, ''), 'çğıöşüÇĞİIÖŞÜ', 'cgiosucgiiosu')),
          '[^a-z0-9]+', '-', 'g'
        )
      ),
      1, 32
    ),
    ''
  );
$$;

-- 3) Mevcut alanlara adres ata. Sıra kararlı olsun diye created_at'e göre
--    yürünür; çakışanlara sayaç eklenir, üretilemeyenler kimlikten türetilir.
WITH aday AS (
  SELECT
    w.id,
    COALESCE(
      NULLIF(public.kade_slugify(p.display_name), ''),
      NULLIF(public.kade_slugify(SPLIT_PART(u.email, '@', 1)), ''),
      'alan-' || SUBSTRING(REPLACE(w.owner_id::TEXT, '-', ''), 1, 8)
    ) AS taban,
    w.created_at
  FROM public.workspaces w
  LEFT JOIN public.profiles p ON p.user_id = w.owner_id
  LEFT JOIN auth.users u ON u.id = w.owner_id
),
gecerli AS (
  -- Ayrılmış ya da çok kısa adlar doğrudan yedeğe düşer.
  SELECT
    a.id,
    CASE
      WHEN LENGTH(a.taban) < 2 OR r.slug IS NOT NULL
        THEN 'alan-' || SUBSTRING(REPLACE(w.owner_id::TEXT, '-', ''), 1, 8)
      ELSE a.taban
    END AS taban,
    a.created_at
  FROM aday a
  JOIN public.workspaces w ON w.id = a.id
  LEFT JOIN public.reserved_workspace_slugs r ON r.slug = a.taban
),
numarali AS (
  SELECT
    id,
    taban,
    ROW_NUMBER() OVER (PARTITION BY taban ORDER BY created_at, id) AS sira
  FROM gecerli
)
UPDATE public.workspaces w
SET slug = CASE WHEN n.sira = 1 THEN n.taban ELSE n.taban || '-' || n.sira END,
    updated_at = NOW()
FROM numarali n
WHERE w.id = n.id;

-- 4) Artık adres olduğu için global benzersiz. Eski (owner_id, slug) kısıtı
--    bunun altında kalıyor, ayrıca kaldırmaya gerek yok.
CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_uidx
  ON public.workspaces (slug);

-- 5) Ayrılmış adresler yalnızca okunur; kimse kendine 'dashboard' diyemesin.
ALTER TABLE public.reserved_workspace_slugs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reserved_workspace_slugs_read ON public.reserved_workspace_slugs;
CREATE POLICY reserved_workspace_slugs_read
  ON public.reserved_workspace_slugs
  FOR SELECT
  TO authenticated
  USING (TRUE);

REVOKE ALL ON public.reserved_workspace_slugs FROM anon, authenticated;
GRANT SELECT ON public.reserved_workspace_slugs TO authenticated;

-- 6) Yeni kullanıcı tetikleyicisi. Eski hâli herkese sabit
--    'ana-calisma-alani' yazıyordu; global benzersiz indeksle birlikte bu,
--    ikinci kayıttan itibaren kullanıcı oluşturmayı düşürürdü.
--    Adres addan türetilir, çakışırsa kimlikten üretilen yedeğe düşer.
CREATE OR REPLACE FUNCTION public.kade_unique_workspace_slug(
  preferred_name TEXT,
  owner UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  taban TEXT;
  yedek TEXT;
BEGIN
  yedek := 'alan-' || SUBSTRING(REPLACE(owner::TEXT, '-', ''), 1, 8);
  taban := public.kade_slugify(preferred_name);

  IF taban IS NULL
     OR LENGTH(taban) < 2
     OR taban = 'kade'
     OR EXISTS (SELECT 1 FROM public.reserved_workspace_slugs r WHERE r.slug = taban)
     OR EXISTS (SELECT 1 FROM public.workspaces w WHERE w.slug = taban)
  THEN
    RETURN yedek;
  END IF;

  RETURN taban;
END;
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
  workspace_slug TEXT;
BEGIN
  preferred_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO profiles (user_id, display_name) VALUES (NEW.id, preferred_name)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT w.id INTO workspace_uuid
  FROM workspaces w WHERE w.owner_id = NEW.id
  ORDER BY w.created_at LIMIT 1;

  IF workspace_uuid IS NULL THEN
    workspace_slug := public.kade_unique_workspace_slug(preferred_name, NEW.id);
    INSERT INTO workspaces (owner_id, name, slug)
    VALUES (NEW.id, preferred_name || ' Çalışma Alanı', workspace_slug)
    RETURNING id INTO workspace_uuid;
  END IF;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_uuid, NEW.id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

  INSERT INTO user_preferences (user_id, active_workspace_id)
  VALUES (NEW.id, workspace_uuid)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMIT;
