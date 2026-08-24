import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { TRENDS_SYSTEM_PROMPT, buildTrendsPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { niche, platform, region, model } = await req.json()
    if (!niche || !platform || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildTrendsPrompt(niche, platform, region || 'Türkiye / Türkçe'),
      model: model as AIModel,
      systemPrompt: TRENDS_SYSTEM_PROMPT,
      maxTokens: 2500,
    })

    const trends = parseStructuredOutput(result.content)

    return NextResponse.json({ trends, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
