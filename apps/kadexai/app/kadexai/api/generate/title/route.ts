import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildTitlePrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { TitleGenerateRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { normalizeTitleOutput } from '@/lib/ai/toolOutput'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed, remaining } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: TitleGenerateRequest = await req.json()
    const { topic, platform, tone, model, keywords } = body

    if (!topic || !platform || !tone || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildTitlePrompt(topic, platform, tone, keywords),
      model,
      systemPrompt: SYSTEM_PROMPTS.titleGenerator,
      maxTokens: 2000,
    }, req)

    const validated = normalizeTitleOutput(result.content)
    if (validated.length === 0) {
      return NextResponse.json({ error: 'Model geçerli bir başlık listesi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ titles: validated, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
