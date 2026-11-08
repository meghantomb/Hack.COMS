import dotenv from "dotenv";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { createPgPool } from "./pgPool";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config();


async function migrate() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("No DATABASE_URL set — skipping migrate (memory mode).");
    process.exit(0);
  }

  const pool = createPgPool(url);
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = join(__dirname, "../../drizzle");
    if (!existsSync(migrationsDir)) {
      console.log("No drizzle/ folder yet — applying inline schema SQL.");
      await client.query(INLINE_SQL);
      await client.query(
        `INSERT INTO _migrations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
        ["0000_inline"]
      );
      console.log("Applied inline migration.");
      return;
    }

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        `SELECT 1 FROM _migrations WHERE id = $1`,
        [file]
      );
      if (rows.length) continue;
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO _migrations (id) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

const INLINE_SQL = `
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  personality TEXT NOT NULL,
  sprite_key TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_exchanges INTEGER NOT NULL DEFAULT 20
);

CREATE TABLE IF NOT EXISTS dialogue_nodes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  conversation_id TEXT REFERENCES conversations(id),
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  background_key TEXT NOT NULL DEFAULT 'pond',
  sprite_expression TEXT NOT NULL DEFAULT 'neutral',
  is_ending BOOLEAN NOT NULL DEFAULT FALSE,
  ending_type TEXT NOT NULL DEFAULT 'bad' CHECK (ending_type IN ('good', 'bad')),
  min_friendliness INTEGER NOT NULL DEFAULT 0,
  guest_character_id TEXT REFERENCES characters(id),
  variant_group TEXT
);

CREATE TABLE IF NOT EXISTS minigames (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dialogue_options (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
  text TEXT NOT NULL,
  next_node_id TEXT NOT NULL REFERENCES dialogue_nodes(id),
  friendliness_delta INTEGER NOT NULL DEFAULT 0,
  required_tier TEXT,
  min_friendliness INTEGER NOT NULL DEFAULT 0,
  minigame_id TEXT,
  requires_minigame_win BOOLEAN NOT NULL DEFAULT FALSE,
  continues_conversation BOOLEAN NOT NULL DEFAULT FALSE,
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
  conversation_id TEXT REFERENCES conversations(id),
  exchange_count INTEGER NOT NULL DEFAULT 0,
  consecutive_conversations INTEGER NOT NULL DEFAULT 0,
  ending_type TEXT NOT NULL DEFAULT 'bad' CHECK (ending_type IN ('good', 'bad')),
  flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  bookmarks JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
