import { createRedis, storageHealth } from "@kade/shared";
import { databaseHealth } from "@/lib/project-service";

export const dynamic = "force-dynamic";
export async function GET() {
  const checks = { database: false, redis: false, storage: false };
  const errors: Record<string, string> = {};
  await Promise.all([
    databaseHealth().then(() => { checks.database = true; }).catch((error: Error) => { errors.database = error.message; }),
    (async () => { const redis = createRedis(); try { checks.redis = (await redis.ping()) === "PONG"; } catch (error) { errors.redis = error instanceof Error ? error.message : "Redis hatası"; } finally { redis.disconnect(); } })(),
    storageHealth().then(() => { checks.storage = true; }).catch((error: Error) => { errors.storage = error.message; }),
  ]);
  const ok = Object.values(checks).every(Boolean);
  return Response.json({ ok, checks, errors, aiMode: process.env.AI_MODE ?? "mock", timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
