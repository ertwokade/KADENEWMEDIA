import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { THREAD_SYSTEM_PROMPT, buildThreadPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { topic, platform, style, tweetCount, model } = await req.json()
    if (!topic || !platform || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildThreadPrompt(topic, platform, style || 'bilgilendirici', tweetCount || 7),
      model: model as AIModel,
      systemPrompt: THREAD_SYSTEM_PROMPT,
      maxTokens: 4000,
    }, req)

    const thread = parseStructuredOutput(result.content)

    return NextResponse.json({ thread, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
