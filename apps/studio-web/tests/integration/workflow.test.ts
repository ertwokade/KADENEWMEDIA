import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { assets, closeDb, exportsTable, getDb, timelineSnapshots, timelines, transcripts, transcriptWords } from "@kade/db";
import { createMockTranscript, type TimelineState } from "@kade/editor-core";
import { createExportQueue } from "@kade/shared";
import { applyCommand, createExport, createProject, moveHistory } from "../../lib/project-service";

describe("Kade Studio database workflow", () => {
  let projectId = "";
  let exportId = "";
  beforeAll(async () => { await getDb().execute(sql`TRUNCATE TABLE projects CASCADE`); });
  afterAll(async () => {
    if (exportId) {
      const queue = createExportQueue();
      const jobs = await queue.getJobs(["waiting", "active", "delayed", "completed", "failed"]);
      const job = jobs.find((candidate) => candidate.data.exportId === exportId);
      if (job) {
        for (let attempt = 0; attempt < 50 && await job.getState() === "active"; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (await job.getState() !== "active") await job.remove();
      }
      await queue.close();
    }
    await closeDb();
  });

  it("creates a project and ready asset with deterministic mock transcript", async () => {
    const project = await createProject("Integration Demo"); projectId = project.id;
    const [asset] = await getDb().insert(assets).values({ projectId, originalFilename: "fixture.mp4", mimeType: "video/mp4", originalStorageKey: `projects/${projectId}/original/mock.mp4`, proxyStorageKey: "proxy.mp4", mezzanineStorageKey: "mezzanine.mp4", durationMs: 14_000, width: 960, height: 540, fps: 30, audioChannels: 2, status: "ready", analysisJson: { silences: [{ startMs: 3000, endMs: 4000 }, { startMs: 8000, endMs: 10_000 }], thumbnails: [] } }).returning();
    const words = createMockTranscript(14_000); expect(createMockTranscript(14_000)).toEqual(words); expect(words.some((word) => word.text === "ııı")).toBe(true);
    const [transcript] = await getDb().insert(transcripts).values({ assetId: asset!.id, language: "tr", fullText: words.map((word) => word.text).join(" "), provider: "mock" }).returning();
    await getDb().insert(transcriptWords).values(words.map((word) => ({ transcriptId: transcript!.id, wordIndex: word.wordIndex, text: word.text, normalizedText: word.normalizedText, startMs: word.startMs, endMs: word.endMs, confidence: String(word.confidence) })));
    const state: TimelineState = { schemaVersion: 1, primaryAssetId: asset!.id, fps: 30, canvas: { aspectRatio: "16:9", width: 1920, height: 1080, fitMode: "contain" }, includedRanges: [{ id: "all", sourceStartMs: 0, sourceEndMs: 14_000 }], captions: { enabled: false, preset: "kade-clean", language: "tr" }, overlays: [] };
    const [timeline] = await getDb().insert(timelines).values({ projectId, stateJson: state }).returning(); await getDb().insert(timelineSnapshots).values({ timelineId: timeline!.id, version: 0, name: "İlk kurgu", stateJson: state });
    expect(asset?.projectId).toBe(projectId);
  });

  it("applies a compound command, snapshots, undo and redo", async () => {
    const result = await applyCommand(projectId, "0.7 saniyeden uzun sessizlikleri kes, ııı ve şey kelimelerini çıkar, 9:16 yap ve Kade altyazılarını aç");
    expect(result.afterDurationMs).toBeLessThan(result.beforeDurationMs); expect(result.state.canvas.aspectRatio).toBe("9:16"); expect(result.state.captions.enabled).toBe(true); expect(result.version).toBe(1);
    const timeline = await getDb().query.timelines.findFirst({ where: eq(timelines.projectId, projectId) }); const snapshots = await getDb().select().from(timelineSnapshots).where(eq(timelineSnapshots.timelineId, timeline!.id)); expect(snapshots).toHaveLength(2);
    expect((await moveHistory(projectId, "undo")).version).toBe(0); expect((await moveHistory(projectId, "redo")).version).toBe(1);
  });

  it("creates an export database row and BullMQ job", async () => { const record = await createExport(projectId); exportId = record.id; const stored = await getDb().query.exportsTable.findFirst({ where: eq(exportsTable.id, record.id) }); expect(stored?.status).toBe("queued"); expect(stored?.width).toBe(1080); expect(stored?.height).toBe(1920); });
});
