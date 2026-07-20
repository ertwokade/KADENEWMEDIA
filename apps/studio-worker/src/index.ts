import "dotenv/config";
import { Worker } from "bullmq";
import { createRedis, EXPORT_QUEUE, INGEST_QUEUE } from "@kade/shared";
import { assertFfmpegCapabilities, exportProcessor } from "./export";
import { ingestProcessor } from "./ingest";

await assertFfmpegCapabilities();
const ingest = new Worker(INGEST_QUEUE, ingestProcessor, { connection: createRedis(), concurrency: 1 });
const exporter = new Worker(EXPORT_QUEUE, exportProcessor, { connection: createRedis(), concurrency: 1 });
for (const worker of [ingest, exporter]) worker.on("failed", (job, error) => console.error(`[worker:${worker.name}] job=${job?.id ?? "unknown"} failed: ${error.message}`));
console.log("Kade Studio worker ingest ve export kuyruklarını dinliyor.");

const shutdown = async () => { await Promise.all([ingest.close(), exporter.close()]); process.exit(0); };
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
