CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_exchanges INTEGER NOT NULL DEFAULT 20
);

ALTER TABLE dialogue_nodes ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE dialogue_nodes ADD COLUMN IF NOT EXISTS min_friendliness INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dialogue_nodes ADD COLUMN IF NOT EXISTS guest_character_id TEXT;
ALTER TABLE dialogue_nodes ADD COLUMN IF NOT EXISTS variant_group TEXT;

UPDATE dialogue_nodes
SET ending_type = 'good'
WHERE ending_type IN ('friendship', 'romance');

UPDATE dialogue_nodes
SET ending_type = 'bad'
WHERE ending_type IS NULL OR ending_type NOT IN ('good', 'bad');

ALTER TABLE dialogue_nodes ALTER COLUMN ending_type SET DEFAULT 'bad';
ALTER TABLE dialogue_nodes ALTER COLUMN ending_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dialogue_nodes_conversation_id_fkey'
  ) THEN
    ALTER TABLE dialogue_nodes
      ADD CONSTRAINT dialogue_nodes_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dialogue_nodes_guest_character_id_fkey'
  ) THEN
    ALTER TABLE dialogue_nodes
      ADD CONSTRAINT dialogue_nodes_guest_character_id_fkey
      FOREIGN KEY (guest_character_id) REFERENCES characters(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dialogue_nodes_ending_type_check'
  ) THEN
    ALTER TABLE dialogue_nodes
      ADD CONSTRAINT dialogue_nodes_ending_type_check
      CHECK (ending_type IN ('good', 'bad'));
  END IF;
END $$;

ALTER TABLE dialogue_options ADD COLUMN IF NOT EXISTS min_friendliness INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dialogue_options ADD COLUMN IF NOT EXISTS continues_conversation BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS exchange_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS consecutive_conversations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE player_progress ADD COLUMN IF NOT EXISTS ending_type TEXT;

UPDATE player_progress
SET ending_type = 'bad'
WHERE ending_type IS NULL OR ending_type NOT IN ('good', 'bad');

ALTER TABLE player_progress ALTER COLUMN ending_type SET DEFAULT 'bad';
ALTER TABLE player_progress ALTER COLUMN ending_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_progress_conversation_id_fkey'
  ) THEN
    ALTER TABLE player_progress
      ADD CONSTRAINT player_progress_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'player_progress_ending_type_check'
  ) THEN
    ALTER TABLE player_progress
      ADD CONSTRAINT player_progress_ending_type_check
      CHECK (ending_type IN ('good', 'bad'));
  END IF;
END $$;
