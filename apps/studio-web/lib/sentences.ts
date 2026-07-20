import type { TranscriptSentence, TranscriptWord } from "@kade/editor-core";

export function buildSentences(words: TranscriptWord[]): TranscriptSentence[] {
  const result: TranscriptSentence[] = [];
  let group: TranscriptWord[] = [];
  const flush = () => {
    if (!group.length) return;
    result.push({ id: `sentence-${result.length}`, text: group.map((word) => word.text).join(" ").replace(/\s+([,.!?])/g, "$1"), startMs: group[0]!.startMs, endMs: group.at(-1)!.endMs });
    group = [];
  };
  for (const word of words) {
    if (group.length && word.startMs - group.at(-1)!.endMs > 900) flush();
    group.push(word);
    if (/[.!?]$/.test(word.text) || group.length >= 18) flush();
  }
  flush();
  return result;
}
