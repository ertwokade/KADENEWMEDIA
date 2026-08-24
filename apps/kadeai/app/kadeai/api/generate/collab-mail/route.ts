import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COLLAB_MAIL_SYSTEM_PROMPT, buildCollabMailPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { senderName, senderChannel, senderNiche, targetName, dealType, extraNotes, model } = await req.json()
    if (!senderName || !targetName || !dealType || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCollabMailPrompt(senderName, senderChannel, senderNiche, targetName, dealType, extraNotes),
      model: model as AIModel,
      systemPrompt: COLLAB_MAIL_SYSTEM_PROMPT,
      maxTokens: 3000,
    })

    const mail = parseStructuredOutput(result.content)

    return NextResponse.json({ mail, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
