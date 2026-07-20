import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { editPlanSchema, type EditPlan, type TimelineState, type TranscriptSentence } from "@kade/editor-core";
import { getEnv } from "@kade/shared";

export async function planWithOpenAi(input: { userText: string; durationMs: number; state: TimelineState; sentences: TranscriptSentence[] }): Promise<EditPlan> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) throw new Error("Bu komut deterministik parser tarafından tanınmadı. OpenAI modu için API anahtarı gerekli.");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.responses.parse({
    model: env.OPENAI_EDIT_MODEL,
    store: false,
    input: [
      { role: "system", content: "You are a non-destructive video edit planner. Return only supported operations. For semantic shortening, only select sentence IDs from the supplied list. Never invent timestamps or IDs." },
      { role: "user", content: JSON.stringify({ command: input.userText, durationMs: input.durationMs, aspectRatio: input.state.canvas.aspectRatio, captions: input.state.captions, sentences: input.sentences }) },
    ],
    text: { format: zodTextFormat(editPlanSchema, "kade_edit_plan") },
  });
  if (!response.output_parsed) throw new Error("OpenAI geçerli bir edit planı döndürmedi.");
  return response.output_parsed;
}
