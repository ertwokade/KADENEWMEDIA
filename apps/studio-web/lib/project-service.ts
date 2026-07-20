import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { applyEditPlan, editPlanSchema, getOutputDuration, parseDeterministicCommand, timelineStateSchema, validateEditPlan, type EditPlan, type TranscriptWord } from "@kade/editor-core";
import { assets, editCommands, exportsTable, getDb, processingJobs, projects, timelineSnapshots, timelines, transcripts, transcriptWords } from "@kade/db";
import { createExportQueue, createIngestQueue, createPresignedDownload } from "@kade/shared";
import { buildSentences } from "./sentences";
import { planWithOpenAi } from "./openai-planner";

export async function listProjects() { return getDb().select().from(projects).orderBy(desc(projects.updatedAt)); }

export async function createProject(name: string) {
  const clean = name.trim(); if (clean.length < 2 || clean.length > 120) throw new Error("Proje adı 2–120 karakter olmalı.");
  const [project] = await getDb().insert(projects).values({ name: clean, status: "draft" }).returning();
  return project!;
}

export async function completeUpload(input: { projectId: string; key: string; filename: string; mimeType: string }) {
  if (!input.key.startsWith(`projects/${input.projectId}/original/`)) throw new Error("Storage key bu projeye ait değil.");
  const db = getDb();
  const project = await db.query.projects.findFirst({ where: eq(projects.id, input.projectId) }); if (!project) throw new Error("Proje bulunamadı.");
  const [asset] = await db.insert(assets).values({ projectId: project.id, originalFilename: input.filename.slice(0, 255), mimeType: input.mimeType, originalStorageKey: input.key }).returning();
  const [processing] = await db.insert(processingJobs).values({ projectId: project.id, assetId: asset!.id, type: "ingest" }).returning();
  const queue = createIngestQueue();
  try { const job = await queue.add("ingest", { assetId: asset!.id, processingJobId: processing!.id }, { attempts: 2, backoff: { type: "exponential", delay: 1500 }, removeOnComplete: 100 }); await db.update(processingJobs).set({ bullJobId: job.id }).where(eq(processingJobs.id, processing!.id)); } finally { await queue.close(); }
  await db.update(projects).set({ status: "processing", updatedAt: new Date() }).where(eq(projects.id, project.id));
  return asset!;
}

export async function getProjectData(projectId: string) {
  const db = getDb();
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) }); if (!project) return null;
  const asset = await db.query.assets.findFirst({ where: eq(assets.projectId, projectId), orderBy: desc(assets.createdAt) });
  const timeline = await db.query.timelines.findFirst({ where: eq(timelines.projectId, projectId) });
  const transcript = asset ? await db.query.transcripts.findFirst({ where: eq(transcripts.assetId, asset.id) }) : null;
  const words = transcript ? await db.select().from(transcriptWords).where(eq(transcriptWords.transcriptId, transcript.id)).orderBy(asc(transcriptWords.wordIndex)) : [];
  const jobs = await db.select().from(processingJobs).where(eq(processingJobs.projectId, projectId)).orderBy(desc(processingJobs.createdAt));
  const exports = await db.select().from(exportsTable).where(eq(exportsTable.projectId, projectId)).orderBy(desc(exportsTable.createdAt));
  const snapshots = timeline ? await db.select({ version: timelineSnapshots.version, name: timelineSnapshots.name, createdAt: timelineSnapshots.createdAt }).from(timelineSnapshots).where(eq(timelineSnapshots.timelineId, timeline.id)).orderBy(asc(timelineSnapshots.version)) : [];
  const proxyUrl = asset?.proxyStorageKey ? await createPresignedDownload(asset.proxyStorageKey) : null;
  return { project, asset, timeline, transcript, words, jobs, exports, snapshots, proxyUrl, outputDurationMs: timeline ? getOutputDuration(timelineStateSchema.parse(timeline.stateJson)) : 0 };
}

export async function applyCommand(projectId: string, userText: string, suppliedPlan?: unknown) {
  const data = await getProjectData(projectId); if (!data?.timeline || !data.asset?.durationMs) throw new Error("Proje henüz kurguya hazır değil.");
  const state = timelineStateSchema.parse(data.timeline.stateJson);
  const words: TranscriptWord[] = data.words.map((word) => ({ ...word, confidence: word.confidence ? Number(word.confidence) : null }));
  const sentences = buildSentences(words);
  let mode = suppliedPlan ? "manual" : "deterministic";
  let plan: EditPlan;
  if (suppliedPlan) plan = editPlanSchema.parse(suppliedPlan);
  else { const deterministic = parseDeterministicCommand(userText); if (deterministic) plan = deterministic; else { mode = "openai"; plan = await planWithOpenAi({ userText, durationMs: data.asset.durationMs, state, sentences }); } }
  plan = validateEditPlan(plan, sentences, data.asset.durationMs);
  const [command] = await getDb().insert(editCommands).values({ projectId, userText, plannerMode: mode, planJson: plan, status: "validating" }).returning();
  try {
    const result = applyEditPlan(state, plan, { durationMs: data.asset.durationMs, words, sentences, silences: data.asset.analysisJson?.silences ?? [] });
    if (!result.state.includedRanges.length || result.afterDurationMs < 250) throw new Error("Edit planı oynatılabilir içerik bırakmıyor.");
    const nextVersion = data.timeline.currentVersion + 1;
    await getDb().transaction(async (tx) => {
      await tx.delete(timelineSnapshots).where(and(eq(timelineSnapshots.timelineId, data.timeline!.id), gt(timelineSnapshots.version, data.timeline!.currentVersion)));
      await tx.insert(timelineSnapshots).values({ timelineId: data.timeline!.id, version: nextVersion, stateJson: result.state, commandId: command!.id });
      await tx.update(timelines).set({ stateJson: result.state, currentVersion: nextVersion, updatedAt: new Date() }).where(eq(timelines.id, data.timeline!.id));
      await tx.update(editCommands).set({ status: "completed", completedAt: new Date() }).where(eq(editCommands.id, command!.id));
      await tx.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
    });
    return { ...result, version: nextVersion, plannerMode: mode, operations: plan.operations };
  } catch (error) { await getDb().update(editCommands).set({ status: "failed", errorMessage: error instanceof Error ? error.message : "Edit başarısız" }).where(eq(editCommands.id, command!.id)); throw error; }
}

export async function moveHistory(projectId: string, direction: "undo" | "redo") {
  const db = getDb(); const timeline = await db.query.timelines.findFirst({ where: eq(timelines.projectId, projectId) }); if (!timeline) throw new Error("Timeline bulunamadı.");
  const targetVersion = timeline.currentVersion + (direction === "undo" ? -1 : 1); if (targetVersion < 0) throw new Error("Geri alınacak işlem yok.");
  const snapshot = await db.query.timelineSnapshots.findFirst({ where: and(eq(timelineSnapshots.timelineId, timeline.id), eq(timelineSnapshots.version, targetVersion)) }); if (!snapshot) throw new Error(direction === "undo" ? "Geri alınacak işlem yok." : "Yinelenecek işlem yok.");
  await db.update(timelines).set({ currentVersion: targetVersion, stateJson: snapshot.stateJson, updatedAt: new Date() }).where(eq(timelines.id, timeline.id)); return { version: targetVersion, state: snapshot.stateJson };
}

export async function nameVersion(projectId: string, name: string) { const db = getDb(); const timeline = await db.query.timelines.findFirst({ where: eq(timelines.projectId, projectId) }); if (!timeline) throw new Error("Timeline bulunamadı."); await db.update(timelineSnapshots).set({ name: name.trim().slice(0, 80) }).where(and(eq(timelineSnapshots.timelineId, timeline.id), eq(timelineSnapshots.version, timeline.currentVersion))); }

export async function createExport(projectId: string) {
  const db = getDb(); const timeline = await db.query.timelines.findFirst({ where: eq(timelines.projectId, projectId) }); if (!timeline) throw new Error("Timeline bulunamadı."); const state = timelineStateSchema.parse(timeline.stateJson);
  const [record] = await db.insert(exportsTable).values({ projectId, timelineVersion: timeline.currentVersion, width: state.canvas.width, height: state.canvas.height }).returning();
  const queue = createExportQueue(); try { await queue.add("export", { exportId: record!.id }, { attempts: 1, removeOnComplete: 100 }); } finally { await queue.close(); } return record!;
}

export async function getExportDownload(exportId: string) { const record = await getDb().query.exportsTable.findFirst({ where: eq(exportsTable.id, exportId) }); if (!record?.outputStorageKey || record.status !== "completed") throw new Error("Export henüz indirilmeye hazır değil."); return createPresignedDownload(record.outputStorageKey); }

export async function databaseHealth() { await getDb().execute(sql`select 1`); return true; }
