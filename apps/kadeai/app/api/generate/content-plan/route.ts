import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CONTENT_PLAN_SYSTEM_PROMPT, buildContentPlanPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'

export async function POST(req: NextRequest) {
  try {
    const { niche, platform, goal, frequency, model } = await req.json()
    if (!niche || !platform || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildContentPlanPrompt(niche, platform, goal || 'takipçi büyümesi', frequency || 'haftada 3'),
      model: model as AIModel,
      systemPrompt: CONTENT_PLAN_SYSTEM_PROMPT,
      maxTokens: 8000,
    })

    const plan = parseStructuredOutput(result.content)

    return NextResponse.json({ plan, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
