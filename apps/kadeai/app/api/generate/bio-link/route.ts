import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { BIO_LINK_SYSTEM_PROMPT, buildBioLinkPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'

export async function POST(req: NextRequest) {
  try {
    const { name, niche, platforms, highlights, tone, model } = await req.json()
    if (!name || !niche || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildBioLinkPrompt(name, niche, platforms || [], highlights || '', tone || 'samimi'),
      model: model as AIModel,
      systemPrompt: BIO_LINK_SYSTEM_PROMPT,
      maxTokens: 2500,
    })

    const bio = parseStructuredOutput(result.content)

    return NextResponse.json({ bio, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
