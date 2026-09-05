import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COMPETITOR_SYSTEM_PROMPT, buildCompetitorPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextList, asTextRecord } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { competitorInfo, myNiche, myPlatform, model } = await req.json()
    if (!competitorInfo || !myNiche || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCompetitorPrompt(competitorInfo, myNiche, myPlatform || 'youtube'),
      model: model as AIModel,
      systemPrompt: COMPETITOR_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const analysis = {
      rakip_profili: asTextRecord(parsed?.rakip_profili),
      icerik_stratejisi: asTextRecord(parsed?.icerik_stratejisi),
      guclu_yonler: asTextList(parsed?.guclu_yonler, 30, 1_000),
      zayif_yonler: asTextList(parsed?.zayif_yonler, 30, 1_000),
      fırsatlar: asRecordList(parsed?.fırsatlar ?? parsed?.firsatlar, (item) => {
        const firsat = asText(item.firsat, 1_000)
        return firsat ? { firsat, nasil_kullan: asText(item.nasil_kullan, 1_500), oncelik: asText(item.oncelik, 40) || 'orta' } : null
      }, 30),
      farklilasma_stratejisi: asText(parsed?.farklilasma_stratejisi, 4_000),
      hemen_uygulanabilir: asTextList(parsed?.hemen_uygulanabilir, 30, 1_000),
    }
    if (!parsed || (!analysis.guclu_yonler.length && !analysis.zayif_yonler.length && !analysis.fırsatlar.length && !analysis.farklilasma_stratejisi)) {
      return NextResponse.json({ error: 'Model geçerli rakip analizi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ analysis, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
