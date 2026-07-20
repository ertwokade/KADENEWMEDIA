import { describe, expect, it } from "vitest";
import {
  applyEditPlan,
  buildAssFile,
  buildCaptionCues,
  buildFfmpegFilterScript,
  compileTimeline,
  editPlanSchema,
  escapeAssText,
  getOutputDuration,
  normalizeIncludedRanges,
  parseDeterministicCommand,
  sourceTimeToTimelineTime,
  subtractSourceRanges,
  timelineTimeToSourceTime,
  validateEditPlan,
  type TimelineState,
  type TranscriptWord,
} from "../src";

const ranges = [{ id: "a", sourceStartMs: 0, sourceEndMs: 1000 }, { id: "b", sourceStartMs: 2000, sourceEndMs: 4000 }];
const state: TimelineState = { schemaVersion: 1, primaryAssetId: "00000000-0000-4000-8000-000000000001", fps: 30, canvas: { aspectRatio: "16:9", width: 1920, height: 1080, fitMode: "contain" }, includedRanges: ranges, captions: { enabled: false, preset: "kade-clean", language: "tr" }, overlays: [] };

describe("range engine", () => {
  it("sorts, bounds and merges overlaps or tiny gaps", () => expect(normalizeIncludedRanges([{ id: "x", sourceStartMs: 900, sourceEndMs: 2000 }, { id: "y", sourceStartMs: -20, sourceEndMs: 950 }, { id: "z", sourceStartMs: 2040, sourceEndMs: 2100 }], 2050)).toEqual([{ id: "range-0-2050", sourceStartMs: 0, sourceEndMs: 2050 }]));
  it("subtracts source ranges", () => expect(subtractSourceRanges([{ id: "a", sourceStartMs: 0, sourceEndMs: 5000 }], [{ startMs: 1000, endMs: 2000 }, { startMs: 2500, endMs: 3000 }])).toMatchObject([{ sourceStartMs: 0, sourceEndMs: 1000 }, { sourceStartMs: 2000, sourceEndMs: 2500 }, { sourceStartMs: 3000, sourceEndMs: 5000 }]));
  it("maps in both directions and computes duration", () => { expect(getOutputDuration(ranges)).toBe(3000); expect(sourceTimeToTimelineTime(ranges, 2500)).toBe(1500); expect(sourceTimeToTimelineTime(ranges, 1500)).toBeNull(); expect(timelineTimeToSourceTime(ranges, 1500)).toBe(2500); });
  it("compiles ordered output segments", () => expect(compileTimeline(state)[1]).toMatchObject({ outputStartMs: 1000, outputEndMs: 3000 }));
});

describe("captions", () => {
  const words: TranscriptWord[] = ["Merhaba", "dünya.", "Bu", "bir", "testtir"].map((text, wordIndex) => ({ wordIndex, text, normalizedText: text.toLowerCase(), startMs: wordIndex * 400, endMs: wordIndex * 400 + 300 }));
  it("builds punctuation-aware remapped cues", () => { const cues = buildCaptionCues(words, [{ id: "all", sourceStartMs: 0, sourceEndMs: 3000 }]); expect(cues).toHaveLength(2); expect(cues[0]?.text).toBe("Merhaba dünya."); expect(cues[1]?.startMs).toBe(800); });
  it("drops cut words", () => expect(buildCaptionCues(words, [{ id: "tail", sourceStartMs: 800, sourceEndMs: 3000 }])[0]?.text).toBe("Bu bir testtir"));
  it("escapes ASS control characters", () => expect(escapeAssText("{Kade}\\x\nnext,line")).toBe("\\{Kade\\}\\\\x\\Nnext‚line"));
  it("emits a valid ASS document", () => expect(buildAssFile(buildCaptionCues(words, [{ id: "all", sourceStartMs: 0, sourceEndMs: 3000 }]), 1080, 1920, "kade-bold")).toContain("Dialogue: 0,0:00:00.00"));
});

describe("planner", () => {
  it("parses compound Turkish commands", () => { const plan = parseDeterministicCommand("0.7 saniyeden uzun sessizlikleri kes, ııı ve şey kelimelerini çıkar, 9:16 yap ve Kade altyazılarını aç"); expect(plan?.operations.map((op) => op.type)).toEqual(["remove_silences", "remove_fillers", "set_captions", "set_aspect_ratio"]); });
  it("validates Zod edit plans", () => expect(() => editPlanSchema.parse({ operations: [{ type: "remove_silences", minSilenceMs: -1, paddingMs: 0 }] })).toThrow());
  it("rejects invented sentence ids", () => expect(() => validateEditPlan({ operations: [{ type: "keep_sentence_ids", sentenceIds: ["invented"] }] }, [{ id: "s1", text: "A", startMs: 0, endMs: 500 }], 1000)).toThrow(/olmayan/));
  it("removes fillers and silence with computed report", () => { const plan = editPlanSchema.parse({ operations: [{ type: "remove_silences", minSilenceMs: 700, paddingMs: 80 }, { type: "remove_fillers", terms: ["şey"], paddingBeforeMs: 0, paddingAfterMs: 0 }] }); const result = applyEditPlan({ ...state, includedRanges: [{ id: "all", sourceStartMs: 0, sourceEndMs: 5000 }] }, plan, { durationMs: 5000, silences: [{ startMs: 1000, endMs: 2000 }], words: [{ wordIndex: 0, text: "şey", normalizedText: "şey", startMs: 3000, endMs: 3400 }], sentences: [] }); expect(result.afterDurationMs).toBe(3880); expect(result.report).toEqual(["1 sessiz aralık kaldırıldı", "1 dolgu kelimesi temizlendi"]); });
});

describe("ffmpeg script", () => {
  it("uses trim, audio fades, concat and yuv420p", () => { const script = buildFfmpegFilterScript({ ...state, captions: { ...state.captions, enabled: true } }, { assPath: "/tmp/captions.ass" }); expect(script).toContain("trim=start=0.000:end=1.000"); expect(script).toContain("afade=t=in"); expect(script).toContain("concat=n=2:v=1:a=1"); expect(script).toContain("subtitles="); expect(script).toContain("format=yuv420p[vout]"); });
});
