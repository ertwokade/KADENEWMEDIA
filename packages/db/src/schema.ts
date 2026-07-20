import type { TimelineState } from "@kade/editor-core";
import { index, integer, jsonb, numeric, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() };

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(), name: text("name").notNull(), status: text("status").notNull().default("draft"), ...timestamps,
}, (table) => [index("projects_updated_at_idx").on(table.updatedAt)]);

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("primary"), originalFilename: text("original_filename").notNull(), mimeType: text("mime_type").notNull(),
  originalStorageKey: text("original_storage_key").notNull(), proxyStorageKey: text("proxy_storage_key"), mezzanineStorageKey: text("mezzanine_storage_key"), waveformStorageKey: text("waveform_storage_key"),
  durationMs: integer("duration_ms"), width: integer("width"), height: integer("height"), fps: real("fps"), audioChannels: integer("audio_channels"),
  status: text("status").notNull().default("uploaded"), errorMessage: text("error_message"), analysisJson: jsonb("analysis_json").$type<{ silences: Array<{ startMs: number; endMs: number }>; thumbnails: string[] }>(), ...timestamps,
}, (table) => [index("assets_project_id_idx").on(table.projectId), index("assets_status_idx").on(table.status)]);

export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(), assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }), language: text("language").notNull(), fullText: text("full_text").notNull(), provider: text("provider").notNull(), ...timestamps,
}, (table) => [uniqueIndex("transcripts_asset_id_unique").on(table.assetId)]);

export const transcriptWords = pgTable("transcript_words", {
  id: uuid("id").primaryKey().defaultRandom(), transcriptId: uuid("transcript_id").notNull().references(() => transcripts.id, { onDelete: "cascade" }), wordIndex: integer("word_index").notNull(), text: text("text").notNull(), normalizedText: text("normalized_text").notNull(), startMs: integer("start_ms").notNull(), endMs: integer("end_ms").notNull(), confidence: numeric("confidence", { precision: 5, scale: 4 }),
}, (table) => [uniqueIndex("transcript_words_transcript_index_unique").on(table.transcriptId, table.wordIndex), index("transcript_words_time_idx").on(table.transcriptId, table.startMs)]);

export const timelines = pgTable("timelines", {
  id: uuid("id").primaryKey().defaultRandom(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), currentVersion: integer("current_version").notNull().default(0), stateJson: jsonb("state_json").$type<TimelineState>().notNull(), ...timestamps,
}, (table) => [uniqueIndex("timelines_project_id_unique").on(table.projectId)]);

export const editCommands = pgTable("edit_commands", {
  id: uuid("id").primaryKey().defaultRandom(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), userText: text("user_text").notNull(), plannerMode: text("planner_mode").notNull(), planJson: jsonb("plan_json").notNull(), status: text("status").notNull().default("planning"), errorMessage: text("error_message"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [index("edit_commands_project_created_idx").on(table.projectId, table.createdAt)]);

export const timelineSnapshots = pgTable("timeline_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(), timelineId: uuid("timeline_id").notNull().references(() => timelines.id, { onDelete: "cascade" }), version: integer("version").notNull(), name: text("name"), stateJson: jsonb("state_json").$type<TimelineState>().notNull(), commandId: uuid("command_id").references(() => editCommands.id, { onDelete: "set null" }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("timeline_snapshots_timeline_version_unique").on(table.timelineId, table.version)]);

export const processingJobs = pgTable("processing_jobs", {
  id: uuid("id").primaryKey().defaultRandom(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }), type: text("type").notNull(), bullJobId: text("bull_job_id"), status: text("status").notNull().default("queued"), progress: integer("progress").notNull().default(0), errorMessage: text("error_message"), ...timestamps,
}, (table) => [index("processing_jobs_project_status_idx").on(table.projectId, table.status)]);

export const exportsTable = pgTable("exports", {
  id: uuid("id").primaryKey().defaultRandom(), projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }), timelineVersion: integer("timeline_version").notNull(), status: text("status").notNull().default("queued"), progress: integer("progress").notNull().default(0), outputStorageKey: text("output_storage_key"), width: integer("width").notNull(), height: integer("height").notNull(), durationMs: integer("duration_ms"), errorMessage: text("error_message"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [index("exports_project_created_idx").on(table.projectId, table.createdAt)]);

export type Asset = typeof assets.$inferSelect;
export type Project = typeof projects.$inferSelect;
