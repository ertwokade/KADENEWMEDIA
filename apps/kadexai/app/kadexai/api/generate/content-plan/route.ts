import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { CONTENT_PLAN_SYSTEM_PROMPT, buildContentPlanPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asNumber, asRecord, asRecordList, asText, asTextRecord } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { niche, platform, goal, frequency, model } = await req.json()
    if (!niche || !platform || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildContentPlanPrompt(niche, platform, goal || 'takipçi büyümesi', frequency || 'haftada 3'),
      model: model as AIModel,
      systemPrompt: CONTENT_PLAN_SYSTEM_PROMPT,
      maxTokens: 8000,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const days = asRecordList(parsed?.gunler, (day, index) => {
      const baslik = asText(day.baslik, 500)
      if (!baslik) return null
      return {
        gun: asNumber(day.gun, index + 1, 1, 30),
        tarih_onerisi: asText(day.tarih_onerisi, 100),
        icerik_turu: asText(day.icerik_turu, 80) || 'egitici',
        baslik,
        format: asText(day.format, 80),
        aciklama: asText(day.aciklama, 2_000),
        ipucu: asText(day.ipucu, 1_000),
      }
    }, 30)
    if (!parsed || days.length === 0) return NextResponse.json({ error: 'Model geçerli takvim günleri döndürmedi. Yeniden dene.' }, { status: 502 })
    const plan = {
      strateji: asText(parsed.strateji, 4_000),
      haftalik_temalar: asRecordList(parsed.haftalik_temalar, (week, index) => ({ hafta: asNumber(week.hafta, index + 1, 1, 5), tema: asText(week.tema, 300), hedef: asText(week.hedef, 1_000) }), 5),
      gunler: days,
      kpi_hedefleri: asTextRecord(parsed.kpi_hedefleri, 20),
    }

    return NextResponse.json({ plan, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
