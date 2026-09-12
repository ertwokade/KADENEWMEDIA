import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { DUBBING_SYSTEM_PROMPT, buildTranslatePrompt } from '@/lib/ai/prompts'
import { TranslateRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { normalizeTranslationOutput } from '@/lib/ai/toolOutput'
import { SELECTABLE_MODELS } from '@/lib/ai/models'

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'İngilizce',
  german: 'Almanca',
  french: 'Fransızca',
  spanish: 'İspanyolca',
  arabic: 'Arapça',
  japanese: 'Japonca',
  korean: 'Korece',
  russian: 'Rusça',
  portuguese: 'Portekizce',
  italian: 'İtalyanca',
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const body: TranslateRequest = await req.json()
    const {
      content,
      sourceLang = 'Türkçe',
      targetLang,
      model,
      includePronunciation = true,
      includeTimingNotes = true,
      includeCulturalNotes = true,
    } = body

    if (typeof content !== 'string' || !content.trim() || content.length > 20_000 ||
        typeof targetLang !== 'string' || !targetLang || !Object.prototype.hasOwnProperty.call(LANGUAGE_LABELS, targetLang) ||
        typeof model !== 'string' || !SELECTABLE_MODELS.includes(model)) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildTranslatePrompt(
        content,
        sourceLang,
        LANGUAGE_LABELS[targetLang],
        includePronunciation,
        includeTimingNotes,
        includeCulturalNotes
      ),
      model,
      systemPrompt: DUBBING_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const translation = normalizeTranslationOutput(result.content)
    if (!translation) {
      return NextResponse.json({ error: 'Model geçerli bir çeviri şeması döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ translation, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Çeviri hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
