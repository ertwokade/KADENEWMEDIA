import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, getDb } from "./index";

try {
  await migrate(getDb(), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
  console.log("Kade Studio veritabanı migration'ları uygulandı.");
} finally {
  await closeDb();
}
