import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { IDEAS_SYSTEM_PROMPT, buildIdeasPrompt } from '@/lib/ai/prompts'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { IdeasRequest } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body: IdeasRequest = await req.json()
    const { niche, platform, model, count = 20, style = 'karışık' } = body

    if (!niche || !platform || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      prompt: buildIdeasPrompt(niche, platform, count, style),
      model,
      systemPrompt: IDEAS_SYSTEM_PROMPT,
      maxTokens: 4000,
    })

    let ideas: Array<{ baslik: string; aciklama: string; tip: string; viral_neden: string; zorluk: string }> = []
    try {
      const jsonMatch = result.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed: unknown = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          ideas = parsed.flatMap((item) => {
            if (!item || typeof item !== 'object') return []
            const value = item as Record<string, unknown>
            const baslik = String(value.baslik || '').trim()
            const aciklama = String(value.aciklama || '').trim()
            if (!baslik || !aciklama) return []
            const rawTip = String(value.tip || 'evergreen').toLocaleLowerCase('tr-TR')
            const rawDifficulty = String(value.zorluk || 'orta').toLocaleLowerCase('tr-TR')
            return [{
              baslik: baslik.slice(0, 300),
              aciklama: aciklama.slice(0, 1200),
              tip: ['trend', 'evergreen', 'mevsimsel'].includes(rawTip) ? rawTip : 'evergreen',
              viral_neden: String(value.viral_neden || '').slice(0, 600),
              zorluk: ['kolay', 'orta', 'zor'].includes(rawDifficulty) ? rawDifficulty : 'orta',
            }]
          }).slice(0, Math.min(Math.max(count, 1), 30))
        }
      }
    } catch {
      ideas = []
    }

    if (ideas.length === 0) return NextResponse.json({ error: 'Model geçerli fikir kartları döndürmedi. Yeniden dene.' }, { status: 502 })
    return NextResponse.json({ ideas, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
