import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { closeDb, getDb } from "./index";

try {
  await migrate(getDb(), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  console.log("Kade Studio veritabanı migration'ları uygulandı.");
} finally {
  await closeDb();
}
