import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { DUBBING_SYSTEM_PROMPT, buildTranslatePrompt } from '@/lib/ai/prompts'
import { TranslateRequest } from '@/types'

export async function POST(req: NextRequest) {
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

    if (!content?.trim() || !targetLang || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const langLabels: Record<string, string> = {
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

    const result = await generateContent({
      prompt: buildTranslatePrompt(
        content,
        sourceLang,
        langLabels[targetLang] || targetLang,
        includePronunciation,
        includeTimingNotes,
        includeCulturalNotes
      ),
      model,
      systemPrompt: DUBBING_SYSTEM_PROMPT,
      maxTokens: 3000,
    })

    let translation: Record<string, unknown> = {}
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) translation = JSON.parse(jsonMatch[0])
    } catch {
      translation = { ceviri: result.content, bolumler: [], kulturel_notlar: [], genel_yonerge: '' }
    }

    return NextResponse.json({ translation, model: result.model, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Çeviri hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
