import dotenv from "dotenv";
import { resolve } from "path";
import { closeDb, getDb, initDb } from "./index";
import * as schema from "./schema";
import { memoryStore } from "./memoryStore";

dotenv.config({ path: resolve(__dirname, "../../../.env") });
dotenv.config();

/** Wipe every player save (progress + relationships). Story content is left alone. */
async function clearSaves() {
  const mode = await initDb();
  if (mode !== "postgres") {
    memoryStore.progress.clear();
    memoryStore.relationships.clear();
    console.log("Memory mode: cleared in-process progress and relationships.");
    process.exit(0);
  }

  const db = getDb()!;
  await db.delete(schema.relationships);
  await db.delete(schema.playerProgress);
  console.log("Postgres: deleted all player_progress and relationships rows.");
  await closeDb();
}

clearSaves().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
