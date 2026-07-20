import type { TimelineState } from "./schema";

const seconds = (ms: number) => (ms / 1000).toFixed(3);
const escapeFilterText = (value: string) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/%/g, "\\%");

export function buildFfmpegFilterScript(state: TimelineState, options: { assPath?: string; fontFile?: string } = {}): string {
  if (!state.includedRanges.length) throw new Error("Timeline export için en az bir aralık içermeli.");
  const lines: string[] = [];
  state.includedRanges.forEach((range, index) => {
    const duration = Math.max(0.001, (range.sourceEndMs - range.sourceStartMs) / 1000);
    const fade = Math.min(0.015, duration / 4).toFixed(3);
    lines.push(`[0:v]trim=start=${seconds(range.sourceStartMs)}:end=${seconds(range.sourceEndMs)},setpts=PTS-STARTPTS[v${index}]`);
    lines.push(`[0:a]atrim=start=${seconds(range.sourceStartMs)}:end=${seconds(range.sourceEndMs)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${fade},afade=t=out:st=${Math.max(0, duration - Number(fade)).toFixed(3)}:d=${fade}[a${index}]`);
  });
  lines.push(`${state.includedRanges.map((_, index) => `[v${index}][a${index}]`).join("")}concat=n=${state.includedRanges.length}:v=1:a=1[cv][ca]`);
  const { width, height, fitMode } = state.canvas;
  const canvas = fitMode === "cover"
    ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
    : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x0b0b0b`;
  let videoLabel = "scaled";
  lines.push(`[cv]${canvas},setsar=1[${videoLabel}]`);
  if (options.assPath && state.captions.enabled) {
    const safePath = options.assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
    lines.push(`[${videoLabel}]subtitles='${safePath}'[captioned]`);
    videoLabel = "captioned";
  }
  state.overlays.forEach((overlay, index) => {
    const nextLabel = `overlay${index}`;
    const y = overlay.position === "top" ? "h*0.12" : overlay.position === "bottom" ? "h*0.78" : "(h-text_h)/2";
    const font = options.fontFile ? `:fontfile='${options.fontFile.replace(/\\/g, "/").replace(/:/g, "\\:")}'` : "";
    lines.push(`[${videoLabel}]drawtext=text='${escapeFilterText(overlay.text)}'${font}:fontcolor=white:fontsize=h*0.06:x=(w-text_w)/2:y=${y}:box=1:boxcolor=black@0.72:boxborderw=24:enable='between(t,${seconds(overlay.timelineStartMs)},${seconds(overlay.timelineStartMs + overlay.durationMs)})'[${nextLabel}]`);
    videoLabel = nextLabel;
  });
  lines.push(`[${videoLabel}]format=yuv420p[vout]`);
  lines.push("[ca]anull[aout]");
  return `${lines.join(";\n")}\n`;
}

export function compileTimeline(state: TimelineState) {
  let outputStartMs = 0;
  return state.includedRanges.map((range) => {
    const durationMs = range.sourceEndMs - range.sourceStartMs;
    const compiled = { ...range, outputStartMs, outputEndMs: outputStartMs + durationMs, durationMs };
    outputStartMs += durationMs;
    return compiled;
  });
}
