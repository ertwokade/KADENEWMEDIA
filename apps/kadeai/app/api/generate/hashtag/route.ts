import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildHashtagPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { HashtagRequest } from '@/types'

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: HashtagRequest = await req.json()
    const { topic, platform, niche, model, count = 30 } = body

    if (!topic || !platform || !niche || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildHashtagPrompt(topic, platform, niche, count),
      model,
      systemPrompt: SYSTEM_PROMPTS.hashtagExpert,
      maxTokens: 2000,
    })

    let hashtags: { yuksek: string[]; orta: string[]; dusuk: string[]; niche: string[] } = {
      yuksek: [], orta: [], dusuk: [], niche: [],
    }
    try {
      const parsed: unknown = JSON.parse(result.content)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const value = parsed as Record<string, unknown>
        const tags = (key: string) => Array.isArray(value[key]) ? value[key].filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter((item) => item.startsWith('#')).slice(0, 50) : []
        hashtags = { yuksek: tags('yuksek'), orta: tags('orta'), dusuk: tags('dusuk'), niche: tags('niche') }
      }
    } catch {
      const allTags = result.content.match(/#\w+/g) || []
      hashtags.niche = allTags.slice(0, 50)
    }

    if (Object.values(hashtags).every((group) => group.length === 0)) return NextResponse.json({ error: 'Model kullanılabilir hashtag döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ hashtags, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
