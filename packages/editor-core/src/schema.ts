import { z } from "zod";

export const includedRangeSchema = z.object({
  id: z.string().min(1),
  sourceStartMs: z.number().int().min(0),
  sourceEndMs: z.number().int().positive(),
});

export const timelineStateSchema = z.object({
  schemaVersion: z.literal(1),
  primaryAssetId: z.string().uuid(),
  fps: z.number().positive().max(240),
  canvas: z.object({
    aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    fitMode: z.enum(["contain", "cover"]),
  }),
  includedRanges: z.array(includedRangeSchema),
  captions: z.object({
    enabled: z.boolean(),
    preset: z.enum(["kade-clean", "kade-bold", "minimal"]),
    language: z.string().min(2).max(12),
  }),
  overlays: z.array(z.object({
    id: z.string().min(1),
    type: z.literal("title"),
    text: z.string().min(1).max(180),
    timelineStartMs: z.number().int().min(0),
    durationMs: z.number().int().positive(),
    position: z.enum(["top", "center", "bottom"]),
  })),
});

export const editOperationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("remove_silences"), minSilenceMs: z.number().int().min(100).max(30_000), paddingMs: z.number().int().min(0).max(2_000) }),
  z.object({ type: z.literal("remove_fillers"), terms: z.array(z.string().min(1)).min(1).max(30), paddingBeforeMs: z.number().int().min(0).max(1_000), paddingAfterMs: z.number().int().min(0).max(1_000) }),
  z.object({ type: z.literal("delete_source_ranges"), ranges: z.array(z.object({ startMs: z.number().int().min(0), endMs: z.number().int().positive() })).min(1) }),
  z.object({ type: z.literal("keep_sentence_ids"), sentenceIds: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal("set_aspect_ratio"), value: z.enum(["16:9", "9:16", "1:1"]), fitMode: z.enum(["contain", "cover"]) }),
  z.object({ type: z.literal("set_captions"), enabled: z.boolean(), preset: z.enum(["kade-clean", "kade-bold", "minimal"]) }),
  z.object({ type: z.literal("add_title"), text: z.string().min(1).max(180), timelineStartMs: z.number().int().min(0), durationMs: z.number().int().positive().max(60_000), position: z.enum(["top", "center", "bottom"]) }),
]);

export const editPlanSchema = z.object({
  operations: z.array(editOperationSchema).min(1).max(12),
});

export type IncludedRange = z.infer<typeof includedRangeSchema>;
export type TimelineState = z.infer<typeof timelineStateSchema>;
export type EditOperation = z.infer<typeof editOperationSchema>;
export type EditPlan = z.infer<typeof editPlanSchema>;

export type TranscriptWord = {
  id?: string;
  wordIndex: number;
  text: string;
  normalizedText: string;
  startMs: number;
  endMs: number;
  confidence?: number | null;
};

export type TranscriptSentence = {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
};

export type CaptionCue = {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  words: Array<TranscriptWord & { timelineStartMs: number; timelineEndMs: number }>;
};
