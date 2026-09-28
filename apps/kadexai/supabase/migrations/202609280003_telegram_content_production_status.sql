ALTER TABLE public.telegram_saved_content
  ADD COLUMN IF NOT EXISTS production_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (production_status IN ('pending', 'shot')),
  ADD COLUMN IF NOT EXISTS shot_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shot_by TEXT
    CHECK (shot_by IS NULL OR shot_by ~ '^[0-9]{5,20}$');

ALTER TABLE public.telegram_saved_content
  DROP CONSTRAINT IF EXISTS telegram_saved_content_shot_consistency;

ALTER TABLE public.telegram_saved_content
  ADD CONSTRAINT telegram_saved_content_shot_consistency CHECK (
    (production_status = 'pending' AND shot_at IS NULL AND shot_by IS NULL)
    OR
    (production_status = 'shot' AND shot_at IS NOT NULL AND shot_by IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS telegram_saved_content_chat_status_added_idx
  ON public.telegram_saved_content(chat_id, production_status, added_at DESC);
