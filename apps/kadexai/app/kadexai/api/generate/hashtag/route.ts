import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildHashtagPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { HashtagRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { parseHashtagGroups } from '@/lib/ai/hashtags'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: HashtagRequest = await req.json()
    const { topic, platform, niche, model, count = 30 } = body

    if (!topic || !platform || !niche || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }
    if (!Number.isInteger(count) || count < 1 || count > 50) {
      return NextResponse.json({ error: 'Hashtag sayısı 1–50 arasında tam sayı olmalı.' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildHashtagPrompt(topic, platform, niche, count),
      model,
      systemPrompt: SYSTEM_PROMPTS.hashtagExpert,
      maxTokens: 2000,
    }, req)

    const hashtags = parseHashtagGroups(result.content, count)

    if (Object.values(hashtags).every((group) => group.length === 0)) return NextResponse.json({ error: 'Model kullanılabilir hashtag döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ hashtags, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
