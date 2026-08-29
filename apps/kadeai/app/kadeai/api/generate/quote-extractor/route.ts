import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { QUOTE_SYSTEM_PROMPT, buildQuotePrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { content, authorName, model } = await req.json()
    if (!content || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildQuotePrompt(content, authorName || ''), model: model as AIModel, systemPrompt: QUOTE_SYSTEM_PROMPT, maxTokens: 2000 }, req)
    const data = parseStructuredOutput(result.content)
    return NextResponse.json({ data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
