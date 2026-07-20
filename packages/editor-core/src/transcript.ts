import type { TranscriptWord } from "./schema";

const mockVocabulary = ["Kade", "Studio", "ile", "ııı", "fikrini", "anlat", "şey", "sonra", "kurguyu", "timeline", "üzerinde", "kontrol", "et", "yani", "hikâyeni", "güçlendir."];
export function createMockTranscript(durationMs: number): TranscriptWord[] {
  const usable = Math.max(1_000, durationMs - 200);
  const count = Math.max(4, Math.min(80, Math.floor(usable / 650)));
  const slot = usable / count;
  return Array.from({ length: count }, (_, wordIndex) => {
    const text = mockVocabulary[wordIndex % mockVocabulary.length]!;
    return { wordIndex, text, normalizedText: text.toLocaleLowerCase("tr-TR").replace(/[.,!?]/g, ""), startMs: Math.round(wordIndex * slot), endMs: Math.min(durationMs, Math.round(wordIndex * slot + slot * 0.72)), confidence: 0.99 };
  });
}
