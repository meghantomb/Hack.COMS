import pg from "pg";

/**
 * Current node-pg treats sslmode=require as verify-full, which rejects
 * Tiger Cloud's certificate chain. uselibpqcompat opts into libpq's
 * require mode: the session is encrypted, and the CA is not verified.
 */
export function createPgPool(connectionString: string): pg.Pool {
  const url = new URL(connectionString);
  if (!url.password) {
    throw new Error(
      "DATABASE_URL has no password. Tiger's service URL is often postgres://tsdbadmin@HOST:PORT/tsdb?sslmode=require. Insert the password from the credentials file: postgres://tsdbadmin:PASSWORD@HOST:PORT/tsdb?sslmode=require. URL-encode any @, #, %, or ? in the password."
    );
  }
  return new pg.Pool({ connectionString: withLibpqSsl(connectionString) });
}

export function withLibpqSsl(connectionString: string): string {
  if (/[?&]uselibpqcompat=/i.test(connectionString)) return connectionString;
  if (!/[?&]sslmode=(require|prefer|verify-ca)(?:&|$)/i.test(connectionString)) {
    return connectionString;
  }
  const joiner = connectionString.includes("?") ? "&" : "?";
  return `${connectionString}${joiner}uselibpqcompat=true`;
}
