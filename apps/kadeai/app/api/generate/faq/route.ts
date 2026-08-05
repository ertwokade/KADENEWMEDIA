import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { FAQ_SYSTEM_PROMPT, buildFAQPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { content, platform, count, model } = await req.json()
    if (!content || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildFAQPrompt(content, platform || 'youtube', count || 8), model: model as AIModel, systemPrompt: FAQ_SYSTEM_PROMPT, maxTokens: 2500 })
    const data = parseStructuredOutput(result.content)
    return NextResponse.json({ data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
