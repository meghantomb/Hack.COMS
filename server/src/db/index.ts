import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type pg from "pg";
import * as schema from "./schema";
import { memoryStore } from "./memoryStore";
import { createPgPool } from "./pgPool";

export type Db = NodePgDatabase<typeof schema>;

let db: Db | null = null;
let pool: pg.Pool | null = null;
/** True only when DATABASE_URL is set AND a probe connection succeeded. */
let useDatabase = false;

export function isUsingDatabase(): boolean {
  return useDatabase;
}

export async function initDb(): Promise<"postgres" | "memory"> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    useDatabase = false;
    return "memory";
  }

  try {
    pool = createPgPool(url);
    const client = await pool.connect();
    client.release();
    db = drizzle(pool, { schema });
    useDatabase = true;
    return "postgres";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `DATABASE_URL set but Postgres unreachable (${message}). Falling back to memory mode.`
    );
    if (pool) {
      await pool.end().catch(() => undefined);
      pool = null;
    }
    db = null;
    useDatabase = false;
    return "memory";
  }
}

export function getDb(): Db | null {
  if (!useDatabase) return null;
  return db;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
  useDatabase = false;
}

export { memoryStore, schema };
