-- 15 dakikalık ödeme tekliflerinin ayrı ve geri döndürülemez yaşam döngüsü.

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE public.payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_status_check;

ALTER TABLE public.payment_orders
  ADD CONSTRAINT payment_orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired'));

CREATE INDEX IF NOT EXISTS payment_orders_pending_expiry_idx
  ON public.payment_orders(expires_at)
  WHERE status = 'pending' AND expires_at IS NOT NULL;
