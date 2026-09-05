import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CAROUSEL_SYSTEM_PROMPT, buildCarouselPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asNumber, asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { topic, platform, slideCount, tone, model } = await req.json()
    if (!topic || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCarouselPrompt(topic, platform || 'instagram', slideCount || 7, tone || 'bilgilendirici'),
      model: model as AIModel,
      systemPrompt: CAROUSEL_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const slides = asRecordList(parsed?.slayts, (slide, index) => {
      const baslik = asText(slide.baslik, 200)
      const metin = asText(slide.metin, 1_500)
      if (!baslik && !metin) return null
      return {
        no: asNumber(slide.no, index + 1, 1, 50),
        tip: asText(slide.tip, 40) || 'bilgi',
        baslik,
        metin,
        emoji: asText(slide.emoji, 12),
        gorsel_oner: asText(slide.gorsel_oner, 600),
      }
    }, 30)
    if (!parsed || slides.length === 0) return NextResponse.json({ error: 'Model geçerli slayt verisi döndürmedi. Yeniden dene.' }, { status: 502 })
    const carousel = { baslik: asText(parsed.baslik, 300), slayts: slides, caption: asText(parsed.caption, 5_000), hashtags: asTextList(parsed.hashtags, 30, 100) }

    return NextResponse.json({ carousel, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
