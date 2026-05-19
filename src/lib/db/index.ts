import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "@/lib/env";
import * as schema from "@/lib/db/schema";

function createDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof createDb>;

const globalDb = globalThis as unknown as { __sheelonimDb?: Db };

export function getDb(): Db {
  if (!globalDb.__sheelonimDb) {
    globalDb.__sheelonimDb = createDb();
  }
  return globalDb.__sheelonimDb;
}

export { isDatabaseEnabled } from "@/lib/env";
