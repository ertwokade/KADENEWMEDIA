import type { IncludedRange, TimelineState, TranscriptWord } from "./schema";

export type SourceRange = { startMs: number; endMs: number };

const idFor = (startMs: number, endMs: number) => `range-${startMs}-${endMs}`;

export function normalizeIncludedRanges(ranges: IncludedRange[], durationMs = Number.POSITIVE_INFINITY, mergeGapMs = 50): IncludedRange[] {
  const bounded = ranges
    .map((range) => ({
      sourceStartMs: Math.max(0, Math.round(range.sourceStartMs)),
      sourceEndMs: Math.min(durationMs, Math.round(range.sourceEndMs)),
    }))
    .filter((range) => range.sourceEndMs > range.sourceStartMs)
    .sort((a, b) => a.sourceStartMs - b.sourceStartMs || a.sourceEndMs - b.sourceEndMs);

  const result: IncludedRange[] = [];
  for (const range of bounded) {
    const previous = result.at(-1);
    if (previous && range.sourceStartMs <= previous.sourceEndMs + mergeGapMs) {
      previous.sourceEndMs = Math.max(previous.sourceEndMs, range.sourceEndMs);
      previous.id = idFor(previous.sourceStartMs, previous.sourceEndMs);
    } else {
      result.push({ id: idFor(range.sourceStartMs, range.sourceEndMs), ...range });
    }
  }
  return result;
}

export function subtractSourceRanges(included: IncludedRange[], removed: SourceRange[], durationMs = Number.POSITIVE_INFINITY): IncludedRange[] {
  const cuts = normalizeIncludedRanges(removed.map((r, index) => ({ id: `cut-${index}`, sourceStartMs: r.startMs, sourceEndMs: r.endMs })), durationMs, 0);
  const pieces: IncludedRange[] = [];
  for (const source of normalizeIncludedRanges(included, durationMs, 0)) {
    let cursor = source.sourceStartMs;
    for (const cut of cuts) {
      if (cut.sourceEndMs <= cursor || cut.sourceStartMs >= source.sourceEndMs) continue;
      if (cut.sourceStartMs > cursor) pieces.push({ id: "pending", sourceStartMs: cursor, sourceEndMs: Math.min(cut.sourceStartMs, source.sourceEndMs) });
      cursor = Math.max(cursor, cut.sourceEndMs);
      if (cursor >= source.sourceEndMs) break;
    }
    if (cursor < source.sourceEndMs) pieces.push({ id: "pending", sourceStartMs: cursor, sourceEndMs: source.sourceEndMs });
  }
  return normalizeIncludedRanges(pieces, durationMs, 0);
}

export function keepOnlySourceRanges(included: IncludedRange[], kept: SourceRange[], durationMs = Number.POSITIVE_INFINITY): IncludedRange[] {
  const result: IncludedRange[] = [];
  for (const source of included) {
    for (const keep of kept) {
      const sourceStartMs = Math.max(source.sourceStartMs, keep.startMs);
      const sourceEndMs = Math.min(source.sourceEndMs, keep.endMs);
      if (sourceEndMs > sourceStartMs) result.push({ id: "pending", sourceStartMs, sourceEndMs });
    }
  }
  return normalizeIncludedRanges(result, durationMs, 0);
}

export function getOutputDuration(input: IncludedRange[] | TimelineState): number {
  const ranges = Array.isArray(input) ? input : input.includedRanges;
  return ranges.reduce((duration, range) => duration + range.sourceEndMs - range.sourceStartMs, 0);
}

export function timelineTimeToSourceTime(ranges: IncludedRange[], timelineMs: number): number | null {
  if (timelineMs < 0 || ranges.length === 0) return null;
  let outputCursor = 0;
  for (const range of ranges) {
    const length = range.sourceEndMs - range.sourceStartMs;
    if (timelineMs <= outputCursor + length) return Math.min(range.sourceEndMs, range.sourceStartMs + timelineMs - outputCursor);
    outputCursor += length;
  }
  return null;
}

export function sourceTimeToTimelineTime(ranges: IncludedRange[], sourceMs: number): number | null {
  let outputCursor = 0;
  for (const range of ranges) {
    if (sourceMs >= range.sourceStartMs && sourceMs <= range.sourceEndMs) return outputCursor + sourceMs - range.sourceStartMs;
    outputCursor += range.sourceEndMs - range.sourceStartMs;
  }
  return null;
}

export function remapWordsToTimeline(words: TranscriptWord[], ranges: IncludedRange[]) {
  return words.flatMap((word) => {
    const timelineStartMs = sourceTimeToTimelineTime(ranges, word.startMs);
    const timelineEndMs = sourceTimeToTimelineTime(ranges, word.endMs);
    return timelineStartMs === null || timelineEndMs === null ? [] : [{ ...word, timelineStartMs, timelineEndMs }];
  });
}
