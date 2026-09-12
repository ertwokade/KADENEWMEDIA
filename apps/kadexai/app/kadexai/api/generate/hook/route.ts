import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildHookPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { HookGenerateRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { normalizeHookOutput } from '@/lib/ai/toolOutput'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: HookGenerateRequest = await req.json()
    const { topic, format, niche, model } = body

    if (!topic || !format || !niche || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildHookPrompt(topic, format, niche),
      model,
      systemPrompt: SYSTEM_PROMPTS.hookGenerator,
      maxTokens: 2500,
    }, req)

    const validated = normalizeHookOutput(result.content)
    if (validated.length === 0) {
      return NextResponse.json({ error: 'Model geçerli hook kartları döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ hooks: validated, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
