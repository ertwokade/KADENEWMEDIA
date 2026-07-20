import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { execa } from "execa";
import type { Job } from "bullmq";
import { assets, exportsTable, getDb, timelines, timelineSnapshots, transcripts, transcriptWords } from "@kade/db";
import { buildAssFile, buildCaptionCues, buildFfmpegFilterScript, getOutputDuration, timelineStateSchema } from "@kade/editor-core";
import { downloadObject, probeMedia, uploadObject, writeAss } from "./media";

export type ExportData = { exportId: string };

export async function assertFfmpegCapabilities() {
  const filters = await execa("ffmpeg", ["-hide_banner", "-filters"]);
  if (!filters.stdout.includes("subtitles")) throw new Error("FFmpeg build içinde gerekli subtitles/libass filtresi bulunamadı.");
}

export async function exportProcessor(job: Job<ExportData>) {
  const db = getDb();
  const record = await db.query.exportsTable.findFirst({ where: eq(exportsTable.id, job.data.exportId) });
  if (!record) throw new Error("Export kaydı bulunamadı.");
  const timeline = await db.query.timelines.findFirst({ where: eq(timelines.projectId, record.projectId) });
  if (!timeline) throw new Error("Timeline bulunamadı.");
  const snapshot = await db.query.timelineSnapshots.findFirst({ where: and(eq(timelineSnapshots.timelineId, timeline.id), eq(timelineSnapshots.version, record.timelineVersion)) });
  const state = timelineStateSchema.parse(snapshot?.stateJson ?? timeline.stateJson);
  const asset = await db.query.assets.findFirst({ where: eq(assets.id, state.primaryAssetId) });
  if (!asset?.mezzanineStorageKey) throw new Error("Export için mezzanine hazır değil.");
  const temp = await mkdtemp(join(tmpdir(), "kade-export-"));
  try {
    await db.update(exportsTable).set({ status: "processing", progress: 2 }).where(eq(exportsTable.id, record.id));
    const input = join(temp, "input.mp4"); const output = join(temp, "output.mp4"); const script = join(temp, "filter.txt"); const ass = join(temp, "captions.ass");
    await downloadObject(asset.mezzanineStorageKey, input);
    const transcript = await db.query.transcripts.findFirst({ where: eq(transcripts.assetId, asset.id) });
    const words = transcript ? await db.select().from(transcriptWords).where(eq(transcriptWords.transcriptId, transcript.id)).orderBy(transcriptWords.wordIndex) : [];
    if (state.captions.enabled) await writeAss(ass, buildAssFile(buildCaptionCues(words.map((word) => ({ ...word, confidence: word.confidence ? Number(word.confidence) : null })), state.includedRanges), state.canvas.width, state.canvas.height, state.captions.preset));
    await writeAss(script, buildFfmpegFilterScript(state, state.captions.enabled ? { assPath: ass } : {}));
    const durationMs = getOutputDuration(state);
    const subprocess = execa("ffmpeg", ["-hide_banner", "-y", "-i", input, "-filter_complex_script", script, "-map", "[vout]", "-map", "[aout]", "-c:v", "libx264", "-preset", process.env.NODE_ENV === "test" ? "ultrafast" : "medium", "-crf", "20", "-c:a", "aac", "-b:a", "192k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-progress", "pipe:1", "-nostats", output], { stdout: "pipe", stderr: "pipe" });
    for await (const chunk of subprocess.stdout) {
      const match = String(chunk).match(/out_time_ms=(\d+)/);
      if (match) {
        const progress = Math.min(95, Math.max(5, Math.round((Number(match[1]) / 1000 / durationMs) * 90)));
        await job.updateProgress(progress); await db.update(exportsTable).set({ progress }).where(eq(exportsTable.id, record.id));
      }
    }
    await subprocess;
    const verified = await probeMedia(output);
    const video = verified.streams.find((stream) => stream.codec_type === "video");
    if (video?.codec_name !== "h264" || video.width !== state.canvas.width || video.height !== state.canvas.height) throw new Error("Export ffprobe doğrulaması codec veya çözünürlük uyuşmazlığı buldu.");
    const outputStorageKey = `projects/${record.projectId}/exports/${record.id}.mp4`;
    await uploadObject(outputStorageKey, output, "video/mp4");
    await db.update(exportsTable).set({ status: "completed", progress: 100, outputStorageKey, width: video.width, height: video.height, durationMs: Math.round(Number(verified.format.duration ?? 0) * 1000), completedAt: new Date() }).where(eq(exportsTable.id, record.id));
    return { outputStorageKey };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen export hatası";
    await db.update(exportsTable).set({ status: "failed", errorMessage: message }).where(eq(exportsTable.id, record.id));
    throw error;
  } finally { await rm(temp, { recursive: true, force: true }); }
}
