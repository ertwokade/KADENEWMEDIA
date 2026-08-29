import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SYSTEM_PROMPTS, buildHookPrompt } from '@/lib/ai/prompts'
import { extractJsonArray } from '@/lib/ai/json'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { HookGenerateRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

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

    const parsed = extractJsonArray<unknown[]>(result.content)
    const validated = Array.isArray(parsed) ? parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const value = item as Record<string, unknown>
      const hook = String(value.hook || '').trim()
      if (!hook) return []
      return [{ hook: hook.slice(0, 800), tip: String(value.tip || 'genel').slice(0, 80), neden: String(value.neden || '').slice(0, 600) }]
    }).slice(0, 20) : []
    const hooks = validated.length ? validated : (result.content.trim() ? [{ hook: result.content.trim(), tip: 'genel', neden: 'Modelin düz metin yanıtı' }] : [])
    if (hooks.length === 0) return NextResponse.json({ error: 'Model kullanılabilir hook döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ hooks, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
