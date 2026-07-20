import { Queue } from "bullmq";
import IORedis from "ioredis";
import { getEnv } from "./env";

export const INGEST_QUEUE = "kade-studio-ingest";
export const EXPORT_QUEUE = "kade-studio-export";

export const createRedis = () => new IORedis(getEnv().REDIS_URL, { maxRetriesPerRequest: null });
export const createIngestQueue = () => new Queue(INGEST_QUEUE, { connection: createRedis() });
export const createExportQueue = () => new Queue(EXPORT_QUEUE, { connection: createRedis() });
