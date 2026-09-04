import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { THREAD_SYSTEM_PROMPT, buildThreadPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

function normalizeThread(value: Record<string, unknown>, platform: string) {
  const limit = platform === 'linkedin' ? 1300 : 280
  const posts = Array.isArray(value.posts) ? value.posts.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const content = typeof row.icerik === 'string' ? row.icerik.trim() : ''
    if (!content || content.length > limit) return []
    return [{
      no: Number.isFinite(Number(row.no)) ? Number(row.no) : index + 1,
      icerik: content,
      tip: typeof row.tip === 'string' ? row.tip : 'bilgi',
    }]
  }) : []
  if (!posts.length) throw new Error('Model geçerli bir thread döndürmedi. Lütfen yeniden dene.')
  return {
    hook: typeof value.hook === 'string' ? value.hook.trim() : posts[0].icerik,
    posts,
    hashtags: Array.isArray(value.hashtags) ? value.hashtags.filter((tag): tag is string => typeof tag === 'string') : [],
  }
}

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
      toolId: 'thread',
    }, req)

    const thread = normalizeThread(parseStructuredOutput(result.content), platform)

    return NextResponse.json({ thread, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: message.startsWith('Model geçerli') ? 502 : 500 })
  }
}
