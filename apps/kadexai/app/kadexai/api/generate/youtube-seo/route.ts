import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { YOUTUBE_SEO_SYSTEM_PROMPT, buildYoutubeSeoPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { title, description, tags, niche, model } = await req.json()
    if (!title || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildYoutubeSeoPrompt(title, description || '', tags || '', niche || ''),
      model: model as AIModel,
      systemPrompt: YOUTUBE_SEO_SYSTEM_PROMPT,
      maxTokens: 2500,
    }, req)

    const seo = parseStructuredOutput(result.content)

    return NextResponse.json({ seo, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
