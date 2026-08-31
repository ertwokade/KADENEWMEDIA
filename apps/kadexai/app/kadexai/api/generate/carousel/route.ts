import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CAROUSEL_SYSTEM_PROMPT, buildCarouselPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { topic, platform, slideCount, tone, model } = await req.json()
    if (!topic || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCarouselPrompt(topic, platform || 'instagram', slideCount || 7, tone || 'bilgilendirici'),
      model: model as AIModel,
      systemPrompt: CAROUSEL_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const carousel = parseStructuredOutput(result.content)

    return NextResponse.json({ carousel, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
