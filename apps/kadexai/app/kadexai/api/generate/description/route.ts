import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildDescriptionPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { DescriptionGenerateRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { asGeneratedText } from '@/lib/ai/outputValidation'
import { removeInventedChapters, removeUnfilledPlaceholders } from '@/lib/ai/outputCleanup'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

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
    }, req)

    const generated = asGeneratedText(result.content, 12_000)
    const description = generated ? removeInventedChapters(removeUnfilledPlaceholders(generated), `${title}\n${summary}`) : null
    if (!description) {
      return NextResponse.json({ error: 'Model kullanılabilir bir açıklama döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ description, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
