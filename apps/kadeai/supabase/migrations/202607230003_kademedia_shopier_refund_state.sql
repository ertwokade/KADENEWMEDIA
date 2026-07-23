-- Faz 3 bulgusu: Shopier webhook'u yalnızca status=1 (başarılı ödeme) işliyor;
-- Shopier'ın herkese açık API'sinde otomatik iade/chargeback webhook'u yok
-- (bu turda server/api/shopier.js ve apps/kadeai/lib/payments/shopierProvider.ts
-- incelenerek doğrulandı — ikisi de yalnızca "ödeme başarılı" callback'i işliyor).
-- Bu yüzden iade, gerçekçi olarak admin tarafından MANUEL işaretlenen bir durum
-- olmalı, otomatik webhook değil. Bu migration bunun için gereken durumları ekler.
--
-- NOT: Bu migration bu oturumda canlı Supabase'e UYGULANMADI (bkz.
-- docs/BLOCKERS_TR.md #1).

ALTER TABLE public.kade_shopier_orders
  DROP CONSTRAINT IF EXISTS kade_shopier_orders_state_check;

ALTER TABLE public.kade_shopier_orders
  ADD CONSTRAINT kade_shopier_orders_state_check CHECK (
    state IN (
      'processing', 'completed', 'completed_reconciled', 'rejected', 'ignored',
      'needs_review', 'completed_with_record_error',
      'refunded', 'partially_refunded'
    )
  );

ALTER TABLE public.kade_shopier_orders
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_by TEXT;
