import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | undefined;
export function getPool() {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL ?? "postgresql://kade:kade@localhost:5432/kade_studio", max: process.env.NODE_ENV === "test" ? 4 : 12 });
  return pool;
}
export const getDb = () => drizzle(getPool(), { schema });
export async function closeDb() { if (pool) { await pool.end(); pool = undefined; } }
export * from "./schema";
