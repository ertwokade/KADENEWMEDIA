import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildTitlePrompt } from '@/lib/ai/prompts'
import { extractJsonArray } from '@/lib/ai/json'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { TitleGenerateRequest } from '@/types'

export async function POST(req: NextRequest) {
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
    })

    const parsed = extractJsonArray<unknown[]>(result.content)
    const validated = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 10) : []
    const titles = validated.length
      ? validated
      : result.content.split('\n').map((t) => t.replace(/^[-*\d.)\s]+/, '').trim()).filter(Boolean).slice(0, 5)

    if (titles.length === 0) return NextResponse.json({ error: 'Model kullanılabilir başlık döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ titles, model: result.model, tokensUsed: result.tokensUsed }, {
      headers: { 'X-RateLimit-Remaining': String(remaining) },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

