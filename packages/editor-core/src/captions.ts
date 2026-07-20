import type { CaptionCue, IncludedRange, TranscriptWord } from "./schema";
import { remapWordsToTimeline } from "./ranges";

export function buildCaptionCues(words: TranscriptWord[], ranges: IncludedRange[], maxWords = 6, maxDurationMs = 2_500): CaptionCue[] {
  const mapped = remapWordsToTimeline(words, ranges);
  const cues: CaptionCue[] = [];
  let group: typeof mapped = [];
  const flush = () => {
    if (!group.length) return;
    cues.push({
      id: `cue-${cues.length}`,
      text: group.map((word) => word.text).join(" ").replace(/\s+([,.!?;:])/g, "$1"),
      startMs: group[0]!.timelineStartMs,
      endMs: group.at(-1)!.timelineEndMs,
      words: group,
    });
    group = [];
  };
  for (const word of mapped) {
    if (group.length && (word.timelineStartMs - group.at(-1)!.timelineEndMs > 450 || word.timelineEndMs - group[0]!.timelineStartMs > maxDurationMs)) flush();
    group.push(word);
    if (group.length >= maxWords || /[.!?]$/.test(word.text)) flush();
  }
  flush();
  return cues;
}

export function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r?\n/g, "\\N")
    .replace(/,/g, "‚");
}

const assTime = (ms: number) => {
  const centiseconds = Math.max(0, Math.round(ms / 10));
  const hours = Math.floor(centiseconds / 360_000);
  const minutes = Math.floor((centiseconds % 360_000) / 6_000);
  const seconds = Math.floor((centiseconds % 6_000) / 100);
  const cs = centiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export function buildAssFile(cues: CaptionCue[], width: number, height: number, preset: "kade-clean" | "kade-bold" | "minimal"): string {
  const size = preset === "kade-bold" ? Math.round(height * 0.055) : preset === "minimal" ? Math.round(height * 0.026) : Math.round(height * 0.038);
  const outline = preset === "minimal" ? 1 : 3;
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: ${width}\nPlayResY: ${height}\nWrapStyle: 2\n\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Default,Arial,${size},&H00FFFFFF,&H0000FFFF,&H00101010,&H80000000,${preset === "kade-bold" ? -1 : 0},0,0,0,100,100,0,0,${preset === "kade-clean" ? 3 : 1},${outline},1,2,80,80,${Math.round(height * 0.08)},1\n\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n${cues.map((cue) => `Dialogue: 0,${assTime(cue.startMs)},${assTime(cue.endMs)},Default,,0,0,0,,${escapeAssText(cue.text)}`).join("\n")}\n`;
}
