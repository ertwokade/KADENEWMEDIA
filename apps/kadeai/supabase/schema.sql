-- ContentAI Studio — Supabase Schema
-- Supabase Dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS content_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool        TEXT NOT NULL,
  model       TEXT NOT NULL,
  input_data  JSONB,
  output      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history"
  ON content_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON content_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
  ON content_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS content_history_user_id_idx ON content_history(user_id);
CREATE INDEX IF NOT EXISTS content_history_created_at_idx ON content_history(created_at DESC);

-- Operasyon Merkezi: kullanıcıya ait çalışma alanını cihazlar arasında senkronize eder.
CREATE TABLE IF NOT EXISTS operations_state (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE operations_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own operations state"
  ON operations_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own operations state"
  ON operations_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operations state"
  ON operations_state FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
