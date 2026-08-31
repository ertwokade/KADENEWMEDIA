-- Tüm kade_* tablolarında updated_at kolonunu her UPDATE'te otomatik bugüne
-- çeken bir trigger ekliyoruz. Route dosyalarının her yerde elle
-- `updated_at: new Date().toISOString()` set etmesine gerek kalmasın diye —
-- taşıma sırasında bazı dosyalar bunu yapıyor bazıları unutuyordu, DB
-- seviyesinde garanti altına almak tutarsızlığı ortadan kaldırır.

CREATE OR REPLACE FUNCTION public.kade_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name LIKE 'kade_%'
      AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; ' ||
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.kade_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;
