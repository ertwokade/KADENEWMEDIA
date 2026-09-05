import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COMMENT_ANALYSIS_SYSTEM_PROMPT, buildCommentAnalysisPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asNumber, asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { comments, contentTitle, model } = await req.json()
    if (!comments || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCommentAnalysisPrompt(comments, contentTitle || ''),
      model: model as AIModel,
      systemPrompt: COMMENT_ANALYSIS_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const summary = asRecord(parsed?.ozet)
    const sentiment = asRecord(parsed?.duygu_analizi)
    const health = asRecord(parsed?.topluluk_sagligi)
    const analysis = {
      ozet: {
        toplam_yorum: asNumber(summary?.toplam_yorum, 0, 0, 1_000_000),
        pozitif_oran: asNumber(summary?.pozitif_oran),
        negatif_oran: asNumber(summary?.negatif_oran),
        notr_oran: asNumber(summary?.notr_oran),
        genel_duygu: asText(summary?.genel_duygu, 40) || 'nötr',
      },
      duygu_analizi: {
        en_cok_hissedilen: asText(sentiment?.en_cok_hissedilen, 300),
        pozitif_temalar: asTextList(sentiment?.pozitif_temalar, 30, 500),
        negatif_temalar: asTextList(sentiment?.negatif_temalar, 30, 500),
        notr_sorular: asTextList(sentiment?.notr_sorular, 30, 1_000),
      },
      icerik_firsatlari: asRecordList(parsed?.icerik_firsatlari, (item) => {
        const fikir = asText(item.fikir, 1_000)
        return fikir ? { fikir, kaynak_yorum: asText(item.kaynak_yorum, 1_500), potansiyel: asText(item.potansiyel, 40) || 'orta' } : null
      }, 30),
      topluluk_sagligi: { puan: asNumber(health?.puan), yorum: asText(health?.yorum, 1_000) },
      yanit_oncelikleri: asRecordList(parsed?.yanit_oncelikleri, (item) => {
        const yorum_ozeti = asText(item.yorum_ozeti, 1_000)
        return yorum_ozeti ? { yorum_ozeti, neden_onemli: asText(item.neden_onemli, 800), yanit_tonu: asText(item.yanit_tonu, 80), yanit_taslagi: asText(item.yanit_taslagi, 2_000) } : null
      }, 30),
      genel_oneriler: asTextList(parsed?.genel_oneriler, 30, 1_000),
    }
    if (!parsed || (!analysis.icerik_firsatlari.length && !analysis.yanit_oncelikleri.length && !analysis.genel_oneriler.length && !analysis.duygu_analizi.en_cok_hissedilen)) {
      return NextResponse.json({ error: 'Model geçerli yorum analizi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ analysis, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
