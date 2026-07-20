import { randomUUID } from "node:crypto";
import { editPlanSchema, type EditOperation, type EditPlan, type TimelineState, type TranscriptSentence, type TranscriptWord } from "./schema";
import { getOutputDuration, keepOnlySourceRanges, subtractSourceRanges } from "./ranges";

export const DEFAULT_FILLERS = ["ııı", "eee", "ee", "şey", "yani", "hani", "işte", "um", "uh", "erm", "like", "you know"];

const normalizeText = (text: string) => text.toLocaleLowerCase("tr-TR").normalize("NFKC");

export function parseDeterministicCommand(userText: string): EditPlan | null {
  const input = normalizeText(userText);
  const operations: EditOperation[] = [];
  const silenceMatch = input.match(/(?:(\d+(?:[.,]\d+)?)\s*saniyeden uzun\s*)?(?:sessizlikleri|silence(?:s)?)\s*(?:kes|kaldır|remove|cut)/);
  if (silenceMatch || /sessizlikleri kaldır|remove (?:long )?silences/.test(input)) {
    operations.push({ type: "remove_silences", minSilenceMs: silenceMatch?.[1] ? Math.round(Number(silenceMatch[1].replace(",", ".")) * 1000) : 700, paddingMs: 80 });
  }
  const explicitFillers = DEFAULT_FILLERS.filter((term) => input.includes(term));
  if (/dolgu kelimelerini (?:temizle|sil)|remove filler/.test(input) || explicitFillers.length) {
    operations.push({ type: "remove_fillers", terms: explicitFillers.length ? explicitFillers : DEFAULT_FILLERS, paddingBeforeMs: 40, paddingAfterMs: 60 });
  }
  if (/altyazıları (?:aç|göster)|enable captions|captions on|kade altyazı/.test(input)) operations.push({ type: "set_captions", enabled: true, preset: /bold/.test(input) ? "kade-bold" : "kade-clean" });
  if (/altyazıları kapat|disable captions|captions off/.test(input)) operations.push({ type: "set_captions", enabled: false, preset: "kade-clean" });
  if (/9\s*:\s*16|dikey|vertical/.test(input)) operations.push({ type: "set_aspect_ratio", value: "9:16", fitMode: "cover" });
  else if (/1\s*:\s*1|kare|square/.test(input)) operations.push({ type: "set_aspect_ratio", value: "1:1", fitMode: "cover" });
  else if (/16\s*:\s*9|yatay|landscape/.test(input)) operations.push({ type: "set_aspect_ratio", value: "16:9", fitMode: "contain" });
  const firstSeconds = input.match(/ilk\s+(\d+(?:[.,]\d+)?)\s*saniyeyi\s*(?:sil|kes)|delete (?:the )?first\s+(\d+(?:[.,]\d+)?)\s*seconds?/);
  if (firstSeconds) operations.push({ type: "delete_source_ranges", ranges: [{ startMs: 0, endMs: Math.round(Number((firstSeconds[1] ?? firstSeconds[2])!.replace(",", ".")) * 1000) }] });
  const title = userText.match(/başına\s+[“\"']?(.+?)[”\"']?\s+(?:yazısı|başlığı|title)/i) ?? userText.match(/add\s+[“\"']?(.+?)[”\"']?\s+(?:title|text)\s+(?:at|to)\s+(?:the\s+)?(?:start|beginning)/i);
  if (title?.[1]) operations.push({ type: "add_title", text: title[1].trim(), timelineStartMs: 0, durationMs: 3000, position: "center" });
  return operations.length ? editPlanSchema.parse({ operations }) : null;
}

export function validateEditPlan(plan: unknown, sentences: TranscriptSentence[], durationMs: number): EditPlan {
  const parsed = editPlanSchema.parse(plan);
  const ids = new Set(sentences.map((sentence) => sentence.id));
  for (const operation of parsed.operations) {
    if (operation.type === "keep_sentence_ids" && operation.sentenceIds.some((id) => !ids.has(id))) throw new Error("Plan mevcut olmayan bir cümle kimliği içeriyor.");
    if (operation.type === "delete_source_ranges" && operation.ranges.some((range) => range.endMs <= range.startMs || range.endMs > durationMs)) throw new Error("Plan geçersiz veya medya dışına taşan bir aralık içeriyor.");
  }
  return parsed;
}

type ApplyContext = { durationMs: number; words: TranscriptWord[]; sentences: TranscriptSentence[]; silences: Array<{ startMs: number; endMs: number }> };

export function applyEditPlan(state: TimelineState, plan: EditPlan, context: ApplyContext) {
  let next = structuredClone(state);
  const report: string[] = [];
  const beforeDurationMs = getOutputDuration(next);
  for (const operation of plan.operations) {
    if (operation.type === "remove_silences") {
      const cuts = context.silences.filter((range) => range.endMs - range.startMs >= operation.minSilenceMs).map((range) => ({ startMs: range.startMs + operation.paddingMs, endMs: range.endMs - operation.paddingMs })).filter((range) => range.endMs > range.startMs);
      next.includedRanges = subtractSourceRanges(next.includedRanges, cuts, context.durationMs);
      report.push(`${cuts.length} sessiz aralık kaldırıldı`);
    } else if (operation.type === "remove_fillers") {
      const terms = new Set(operation.terms.map(normalizeText));
      const cuts = context.words.filter((word) => terms.has(normalizeText(word.normalizedText || word.text).replace(/[.,!?]/g, ""))).map((word) => ({ startMs: Math.max(0, word.startMs - operation.paddingBeforeMs), endMs: Math.min(context.durationMs, word.endMs + operation.paddingAfterMs) }));
      next.includedRanges = subtractSourceRanges(next.includedRanges, cuts, context.durationMs);
      report.push(`${cuts.length} dolgu kelimesi temizlendi`);
    } else if (operation.type === "delete_source_ranges") {
      next.includedRanges = subtractSourceRanges(next.includedRanges, operation.ranges, context.durationMs);
      report.push(`${operation.ranges.length} seçili aralık silindi`);
    } else if (operation.type === "keep_sentence_ids") {
      const wanted = new Set(operation.sentenceIds);
      const ranges = context.sentences.filter((sentence) => wanted.has(sentence.id)).map((sentence) => ({ startMs: sentence.startMs, endMs: sentence.endMs }));
      next.includedRanges = keepOnlySourceRanges(next.includedRanges, ranges, context.durationMs);
      report.push(`${ranges.length} cümle korundu`);
    } else if (operation.type === "set_aspect_ratio") {
      const dimensions = operation.value === "16:9" ? [1920, 1080] : operation.value === "9:16" ? [1080, 1920] : [1080, 1080];
      next.canvas = { aspectRatio: operation.value, width: dimensions[0]!, height: dimensions[1]!, fitMode: operation.fitMode };
      report.push(`Tuval ${operation.value} olarak ayarlandı`);
    } else if (operation.type === "set_captions") {
      next.captions = { ...next.captions, enabled: operation.enabled, preset: operation.preset };
      report.push(`Kade ${operation.preset} altyazıları ${operation.enabled ? "açıldı" : "kapatıldı"}`);
    } else if (operation.type === "add_title") {
      next.overlays.push({ id: randomUUID(), ...operation });
      report.push(`“${operation.text}” başlık kartı eklendi`);
    }
  }
  return { state: next, report, beforeDurationMs, afterDurationMs: getOutputDuration(next) };
}
