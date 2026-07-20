import type { TimelineState } from "@kade/editor-core/schema";

export type EditorWord = { id: string; wordIndex: number; text: string; normalizedText: string; startMs: number; endMs: number; confidence: string | null };
export type EditorExport = { id: string; status: string; progress: number; width: number; height: number; durationMs: number | null; errorMessage: string | null; createdAt: string };
export type EditorData = {
  project: { id: string; name: string; status: string; updatedAt: string };
  asset: null | { id: string; status: string; durationMs: number | null; originalFilename: string; width: number | null; height: number | null; waveformStorageKey: string | null; errorMessage: string | null };
  timeline: null | { id: string; currentVersion: number; stateJson: TimelineState };
  transcript: null | { id: string; fullText: string; language: string; provider: string };
  words: EditorWord[];
  jobs: Array<{ id: string; status: string; progress: number; type: string; errorMessage: string | null }>;
  exports: EditorExport[];
  snapshots: Array<{ version: number; name: string | null; createdAt: string }>;
  proxyUrl: string | null;
  outputDurationMs: number;
};
