import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type pg from "pg";
import * as schema from "./schema";
import { memoryStore } from "./memoryStore";
import { createPgPool } from "./pgPool";

export type Db = NodePgDatabase<typeof schema>;

let db: Db | null = null;
let pool: pg.Pool | null = null;

export function isUsingDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Db | null {
  if (!isUsingDatabase()) return null;
  if (!db) {
    pool = createPgPool(process.env.DATABASE_URL!);
    db = drizzle(pool, { schema });
  }
  return db;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export { memoryStore, schema };
