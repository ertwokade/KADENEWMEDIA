import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { execa } from "execa";
import OpenAI from "openai";
import { createStorageClient, getEnv } from "@kade/shared";
import type { TranscriptWord } from "@kade/editor-core";

export type Probe = { format: { duration?: string; format_name?: string }; streams: Array<{ codec_type?: string; codec_name?: string; width?: number; height?: number; avg_frame_rate?: string; channels?: number }> };

export async function downloadObject(key: string, target: string) {
  const { Body } = await createStorageClient().send(new GetObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }));
  if (!Body) throw new Error("Storage nesnesi boş döndü.");
  await pipeline(Body as NodeJS.ReadableStream, createWriteStream(target));
}

export async function uploadObject(key: string, path: string, contentType: string) {
  await createStorageClient().send(new PutObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key, Body: createReadStream(path), ContentType: contentType }));
}

export async function probeMedia(path: string): Promise<Probe> {
  const result = await execa("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", path]);
  const probe = JSON.parse(result.stdout) as Probe;
  const supported = new Set(["mov,mp4,m4a,3gp,3g2,mj2", "matroska,webm", "mp3", "wav"]);
  if (![...supported].some((format) => probe.format.format_name?.split(",").some((name) => format.includes(name)))) throw new Error(`Gerçek medya formatı desteklenmiyor: ${probe.format.format_name ?? "bilinmiyor"}`);
  if (!probe.streams.some((stream) => stream.codec_type === "video" || stream.codec_type === "audio")) throw new Error("Dosyada geçerli video veya ses akışı bulunamadı.");
  return probe;
}

const run = (args: string[]) => execa("ffmpeg", ["-hide_banner", "-y", ...args], { stderr: "pipe" });

export async function createDerivatives(input: string, outputDir: string, hasVideo: boolean) {
  await mkdir(outputDir, { recursive: true });
  const proxy = `${outputDir}/proxy.mp4`;
  const mezzanine = `${outputDir}/mezzanine.mp4`;
  const audio = `${outputDir}/audio.wav`;
  const waveform = `${outputDir}/waveform.png`;
  if (hasVideo) {
    await run(["-i", input, "-vf", "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", proxy]);
    await run(["-i", input, "-vf", "scale='min(1920,iw)':-2:force_original_aspect_ratio=decrease,format=yuv420p", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", mezzanine]);
  } else {
    for (const [target, size] of [[proxy, "1280x720"], [mezzanine, "1920x1080"]] as const) {
      await run(["-f", "lavfi", "-i", `color=c=0x101010:s=${size}:r=30`, "-i", input, "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", target]);
    }
  }
  await run(["-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", audio]);
  await run(["-i", audio, "-filter_complex", "showwavespic=s=1400x220:colors=0xE9FF70", "-frames:v", "1", waveform]);
  const thumbnails: string[] = [];
  if (hasVideo) {
    for (const [index, position] of ["10%", "50%", "90%"].entries()) {
      const target = `${outputDir}/thumb-${index + 1}.jpg`;
      await run(["-ss", position, "-i", input, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3", target]);
      thumbnails.push(target);
    }
  }
  return { proxy, mezzanine, audio, waveform, thumbnails };
}

export async function detectSilences(audioPath: string) {
  const result = await run(["-i", audioPath, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"]);
  const starts = [...result.stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map((match) => Number(match[1]) * 1000);
  const ends = [...result.stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map((match) => Number(match[1]) * 1000);
  return starts.map((startMs, index) => ({ startMs: Math.round(startMs), endMs: Math.round(ends[index] ?? startMs) })).filter((range) => range.endMs > range.startMs);
}

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

async function transcribeOne(client: OpenAI, audioPath: string, offsetMs: number): Promise<{ language: string; words: TranscriptWord[] }> {
  const response = await client.audio.transcriptions.create({ file: createReadStream(audioPath), model: getEnv().OPENAI_TRANSCRIPTION_MODEL, response_format: "verbose_json", timestamp_granularities: ["word", "segment"], language: "tr" });
  const rawWords = "words" in response && Array.isArray(response.words) ? response.words : [];
  return { language: "language" in response && typeof response.language === "string" ? response.language : "tr", words: rawWords.map((word, wordIndex) => ({ wordIndex, text: word.word, normalizedText: word.word.toLocaleLowerCase("tr-TR").replace(/[.,!?]/g, ""), startMs: Math.round(word.start * 1000) + offsetMs, endMs: Math.round(word.end * 1000) + offsetMs, confidence: null })) };
}

export async function createOpenAiTranscript(audioPath: string) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI transkripsiyonu için API anahtarı tanımlı değil.");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const size = (await import("node:fs/promises")).stat(audioPath).then((value) => value.size);
  if ((await size) < 24 * 1024 * 1024) return transcribeOne(client, audioPath, 0);
  const chunkDir = `${audioPath}.chunks`;
  await mkdir(chunkDir, { recursive: true });
  await run(["-i", audioPath, "-f", "segment", "-segment_time", "900", "-reset_timestamps", "1", "-c:a", "libmp3lame", "-b:a", "64k", `${chunkDir}/chunk-%03d.mp3`]);
  const files = (await import("node:fs/promises")).readdir(chunkDir).then((items) => items.sort());
  const merged: TranscriptWord[] = [];
  let language = "tr";
  for (const [index, filename] of (await files).entries()) {
    const chunk = await transcribeOne(client, `${chunkDir}/${filename}`, index * 900_000);
    language = chunk.language;
    for (const word of chunk.words) {
      const previous = merged.at(-1);
      if (previous && previous.normalizedText === word.normalizedText && Math.abs(previous.endMs - word.startMs) < 1_500) continue;
      merged.push({ ...word, wordIndex: merged.length });
    }
  }
  return { language, words: merged };
}

export async function writeAss(path: string, contents: string) { await writeFile(path, contents, "utf8"); }
export async function readUtf8(path: string) { return readFile(path, "utf8"); }
