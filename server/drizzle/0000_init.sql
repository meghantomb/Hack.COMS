CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  sprite_key TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dialogue_nodes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  background_key TEXT NOT NULL DEFAULT 'pond',
  sprite_expression TEXT NOT NULL DEFAULT 'neutral',
  is_ending BOOLEAN NOT NULL DEFAULT FALSE,
  ending_type TEXT
);

CREATE TABLE IF NOT EXISTS minigames (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  phaser_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dialogue_options (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
  text TEXT NOT NULL,
  next_node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
  friendliness_delta INTEGER NOT NULL DEFAULT 0,
  required_tier TEXT,
  minigame_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS relationships (
  player_id TEXT NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id),
  friendliness INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (player_id, character_id)
);

CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  current_node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
  character_id TEXT NOT NULL REFERENCES characters(id),
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
