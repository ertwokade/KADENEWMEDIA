import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildDescriptionPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { DescriptionGenerateRequest } from '@/types'

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: DescriptionGenerateRequest = await req.json()
    const { title, summary, platform, targetAudience, model, includeHashtags = false, includeCTA = true } = body

    if (!title || !summary || !platform || !targetAudience || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildDescriptionPrompt(title, summary, platform, targetAudience, includeCTA, includeHashtags),
      model,
      systemPrompt: SYSTEM_PROMPTS.descriptionWriter,
      maxTokens: 2500,
    })

    return NextResponse.json({ description: result.content, model: result.model, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

