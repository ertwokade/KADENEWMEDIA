import { defineConfig } from "vitest/config";
import { config } from "dotenv";
config({ path: "../../.env" });
export default defineConfig({ test: { include: ["tests/integration/**/*.test.ts"], testTimeout: 20_000, hookTimeout: 20_000, pool: "forks", maxWorkers: 1 } });
