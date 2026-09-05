import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { TRENDS_SYSTEM_PROMPT, buildTrendsPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { niche, platform, region, model } = await req.json()
    if (!niche || !platform || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildTrendsPrompt(niche, platform, region || 'Türkiye / Türkçe'),
      model: model as AIModel,
      systemPrompt: TRENDS_SYSTEM_PROMPT,
      maxTokens: 2500,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const mapTrend = (item: Record<string, unknown>) => {
      const konu = asText(item.konu, 500)
      return konu ? {
        konu,
        neden_trend: asText(item.neden_trend, 1_500),
        aciliyet: asText(item.aciliyet, 80),
        icerik_fikri: asText(item.icerik_fikri, 1_500),
        zorluk: asText(item.zorluk, 80),
        potansiyel: asText(item.potansiyel, 80),
        tahmini_pik: asText(item.tahmini_pik, 200),
      } : null
    }
    const trends = {
      sicak_trendler: asRecordList(parsed?.sicak_trendler, mapTrend, 30),
      yukselenler: asRecordList(parsed?.yukselenler, mapTrend, 30),
      format_trendleri: asRecordList(parsed?.format_trendleri, (item) => {
        const format = asText(item.format, 300)
        return format ? { format, aciklama: asText(item.aciklama, 1_000), ornek: asText(item.ornek, 1_000) } : null
      }, 30),
      evergreen_firsatlar: asTextList(parsed?.evergreen_firsatlar, 30, 1_000),
      strateji_ozeti: asText(parsed?.strateji_ozeti, 4_000),
    }
    if (!parsed || (!trends.sicak_trendler.length && !trends.yukselenler.length && !trends.format_trendleri.length)) {
      return NextResponse.json({ error: 'Model geçerli trend verisi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ trends, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
