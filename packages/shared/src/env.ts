import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://kade:kade@localhost:5432/kade_studio"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_PUBLIC_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().default("kade"),
  S3_SECRET_ACCESS_KEY: z.string().default("kade-local-secret"),
  S3_BUCKET: z.string().default("kade-studio"),
  S3_FORCE_PATH_STYLE: z.string().default("true").transform((value) => value === "true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EDIT_MODEL: z.string().default("gpt-5-mini"),
  OPENAI_TRANSCRIPTION_MODEL: z.string().default("whisper-1"),
  AI_MODE: z.enum(["mock", "openai"]).default("mock"),
  APP_PASSWORD: z.string().optional(),
  SESSION_SECRET: z.string().min(16).default("kade-studio-local-session-secret"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(10_240).default(1024),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;
export function getEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}

export function assertAiConfiguration(env = getEnv()) {
  if (env.AI_MODE === "openai" && !env.OPENAI_API_KEY) throw new Error("AI_MODE=openai için OPENAI_API_KEY gerekli.");
}
