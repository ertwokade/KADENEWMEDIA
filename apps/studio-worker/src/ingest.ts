import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import type { Job } from "bullmq";
import { getDb, assets, processingJobs, projects, timelines, timelineSnapshots, transcripts, transcriptWords } from "@kade/db";
import { getEnv } from "@kade/shared";
import type { TimelineState } from "@kade/editor-core";
import { createDerivatives, createMockTranscript, createOpenAiTranscript, detectSilences, downloadObject, probeMedia, uploadObject } from "./media";

export type IngestData = { assetId: string; processingJobId: string };

const progress = async (job: Job<IngestData>, value: number, status = "processing") => {
  await job.updateProgress(value);
  await getDb().update(processingJobs).set({ progress: value, status, updatedAt: new Date() }).where(eq(processingJobs.id, job.data.processingJobId));
};

export async function ingestProcessor(job: Job<IngestData>) {
  const db = getDb();
  const asset = await db.query.assets.findFirst({ where: eq(assets.id, job.data.assetId) });
  if (!asset) throw new Error("Ingest asset bulunamadı.");
  const temp = await mkdtemp(join(tmpdir(), "kade-ingest-"));
  try {
    await db.update(assets).set({ status: "processing", updatedAt: new Date() }).where(eq(assets.id, asset.id));
    await progress(job, 5);
    const input = join(temp, "original");
    await downloadObject(asset.originalStorageKey, input);
    const probe = await probeMedia(input);
    const durationMs = Math.round(Number(probe.format.duration ?? 0) * 1000);
    if (!durationMs) throw new Error("Medya süresi ffprobe ile belirlenemedi.");
    const video = probe.streams.find((stream) => stream.codec_type === "video");
    const audioStream = probe.streams.find((stream) => stream.codec_type === "audio");
    await progress(job, 15);
    const output = await createDerivatives(input, join(temp, "output"), Boolean(video), durationMs);
    await progress(job, 55);
    const silences = await detectSilences(output.audio);
    const base = `projects/${asset.projectId}/assets/${asset.id}`;
    const proxyStorageKey = `${base}/proxy.mp4`;
    const mezzanineStorageKey = `${base}/mezzanine.mp4`;
    const waveformStorageKey = `${base}/waveform.png`;
    await Promise.all([uploadObject(proxyStorageKey, output.proxy, "video/mp4"), uploadObject(mezzanineStorageKey, output.mezzanine, "video/mp4"), uploadObject(waveformStorageKey, output.waveform, "image/png"), ...output.thumbnails.map((path, index) => uploadObject(`${base}/thumb-${index + 1}.jpg`, path, "image/jpeg"))]);
    await progress(job, 70);
    const transcriptResult = getEnv().AI_MODE === "openai" ? await createOpenAiTranscript(output.audio) : { language: "tr", words: createMockTranscript(durationMs) };
    const [transcript] = await db.insert(transcripts).values({ assetId: asset.id, language: transcriptResult.language, fullText: transcriptResult.words.map((word) => word.text).join(" "), provider: getEnv().AI_MODE }).returning();
    if (!transcript) throw new Error("Transkript kaydı oluşturulamadı.");
    if (transcriptResult.words.length) await db.insert(transcriptWords).values(transcriptResult.words.map((word) => ({ transcriptId: transcript.id, wordIndex: word.wordIndex, text: word.text, normalizedText: word.normalizedText, startMs: word.startMs, endMs: word.endMs, confidence: word.confidence?.toString() })));
    const fpsParts = (video?.avg_frame_rate ?? "30/1").split("/").map(Number);
    const fps = fpsParts[1] ? fpsParts[0]! / fpsParts[1] : 30;
    const initialState: TimelineState = { schemaVersion: 1, primaryAssetId: asset.id, fps, canvas: { aspectRatio: "16:9", width: 1920, height: 1080, fitMode: "contain" }, includedRanges: [{ id: `range-0-${durationMs}`, sourceStartMs: 0, sourceEndMs: durationMs }], captions: { enabled: false, preset: "kade-clean", language: transcriptResult.language }, overlays: [] };
    const [timeline] = await db.insert(timelines).values({ projectId: asset.projectId, currentVersion: 0, stateJson: initialState }).returning();
    if (!timeline) throw new Error("Timeline oluşturulamadı.");
    await db.insert(timelineSnapshots).values({ timelineId: timeline.id, version: 0, name: "İlk kurgu", stateJson: initialState });
    await db.update(assets).set({ proxyStorageKey, mezzanineStorageKey, waveformStorageKey, durationMs, width: video?.width ?? 1920, height: video?.height ?? 1080, fps, audioChannels: audioStream?.channels ?? 1, analysisJson: { silences, thumbnails: output.thumbnails.map((_, index) => `${base}/thumb-${index + 1}.jpg`) }, status: "ready", updatedAt: new Date() }).where(eq(assets.id, asset.id));
    await db.update(projects).set({ status: "ready", updatedAt: new Date() }).where(eq(projects.id, asset.projectId));
    await progress(job, 100, "completed");
    return { assetId: asset.id, durationMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen ingest hatası";
    await db.update(assets).set({ status: "failed", errorMessage: message, updatedAt: new Date() }).where(eq(assets.id, asset.id));
    await db.update(processingJobs).set({ status: "failed", errorMessage: message, updatedAt: new Date() }).where(eq(processingJobs.id, job.data.processingJobId));
    throw error;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
