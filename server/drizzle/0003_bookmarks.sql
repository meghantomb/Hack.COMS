ALTER TABLE player_progress
  ADD COLUMN IF NOT EXISTS bookmarks JSONB NOT NULL DEFAULT '{}'::jsonb;
