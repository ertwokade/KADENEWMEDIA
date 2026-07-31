import { NextRequest, NextResponse } from 'next/server'
import { CLIP_EXTRACTION_SYSTEM_PROMPT, buildClipExtractionPrompt } from '@/lib/ai/prompts'
import { generateContent } from '@/lib/ai/provider'

export const maxDuration = 120

export interface ClipSuggestion {
  id: number
  start: number
  end: number
  title: string
  hook: string
  reason: string
  viralScore: number
  category: string
  words: Array<{ word: string; start: number; end: number }>
}

interface GroqWord { word: string; start: number; end: number }

// Transkripsiyon route'undan gelen metin ve zaman damgalarını analiz eder.
export async function POST(req: NextRequest) {
  try {
    const { transcript, words, videoDuration } = await req.json() as {
      transcript: string
      words: GroqWord[]
      videoDuration: number
    }

    if (!transcript || transcript.trim().length < 1) {
      return NextResponse.json({ error: 'Transkripsiyon boş. Videoda konuşma var mı?' }, { status: 400 })
    }

    const result = await generateContent({
      model: 'auto',
      maxTokens: 3000,
      systemPrompt: CLIP_EXTRACTION_SYSTEM_PROMPT,
      prompt: buildClipExtractionPrompt(transcript, videoDuration),
    })
    const raw = result.content

    let clips: Omit<ClipSuggestion, 'words'>[] = []
    try {
      const match = raw.match(/\[[\s\S]*\]/)
      if (match) {
        const parsed: unknown = JSON.parse(match[0])
        if (Array.isArray(parsed)) {
          clips = parsed.flatMap((item, index) => {
            if (!item || typeof item !== 'object') return []
            const value = item as Record<string, unknown>
            const start = Number(value.start)
            const end = Number(value.end)
            const title = String(value.title || '').trim()
            if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || !title) return []
            if (Number.isFinite(videoDuration) && end > videoDuration + 1) return []
            return [{
              id: Number.isFinite(Number(value.id)) ? Number(value.id) : index + 1,
              start,
              end,
              title: title.slice(0, 240),
              hook: String(value.hook || '').slice(0, 600),
              reason: String(value.reason || '').slice(0, 1000),
              viralScore: Math.max(0, Math.min(100, Number(value.viralScore) || 0)),
              category: String(value.category || 'bilgi').slice(0, 40),
            }]
          }).slice(0, 12)
        }
      }
    } catch {
      return NextResponse.json({ error: 'AI yanıtı JSON parse edilemedi. Tekrar dene.' }, { status: 500 })
    }

    if (!clips.length) {
      return NextResponse.json({ error: 'Hiç klip bulunamadı. Video yeterince uzun mu?' }, { status: 400 })
    }

    const clipsWithWords: ClipSuggestion[] = clips.map((clip) => ({
      ...clip,
      words: (words ?? []).filter((w) => w.start >= clip.start - 1.5 && w.end <= clip.end + 1.5),
    }))

    return NextResponse.json({ clips: clipsWithWords, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
