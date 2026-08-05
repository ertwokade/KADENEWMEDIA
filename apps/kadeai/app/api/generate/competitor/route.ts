import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COMPETITOR_SYSTEM_PROMPT, buildCompetitorPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { competitorInfo, myNiche, myPlatform, model } = await req.json()
    if (!competitorInfo || !myNiche || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCompetitorPrompt(competitorInfo, myNiche, myPlatform || 'youtube'),
      model: model as AIModel,
      systemPrompt: COMPETITOR_SYSTEM_PROMPT,
      maxTokens: 3000,
    })

    const analysis = parseStructuredOutput(result.content)

    return NextResponse.json({ analysis, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
