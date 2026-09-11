import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COMMENT_ANALYSIS_SYSTEM_PROMPT, buildCommentAnalysisPrompt, COMMENT_REPLY_SYSTEM_PROMPT, buildCommentReplyPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'
import { SELECTABLE_MODELS } from '@/lib/ai/models'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'

function measuredNumber(value: unknown, max = 100): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  if (!rateLimit(getRateLimitKey(req)).allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const body = asRecord(await req.json().catch(() => null))
    const { comments, contentTitle = '', model, action = 'analyze', tone = '' } = body || {}
    if (typeof action !== 'string' || !['analyze', 'reply'].includes(action) || typeof comments !== 'string' || !comments.trim()
      || comments.length > (action === 'reply' ? 1_000 : 30_000)
      || typeof contentTitle !== 'string' || contentTitle.length > 1_000
      || typeof tone !== 'string' || tone.length > 80
      || typeof model !== 'string' || !SELECTABLE_MODELS.includes(model as AIModel)) {
      return NextResponse.json({ error: 'Geçerli yorum, başlık ve model bilgisi gerekli. Yorumlar en fazla 30.000 karakter olabilir.' }, { status: 400 })
    }

    if (action === 'reply') {
      const result = await generateContent({
        prompt: buildCommentReplyPrompt(comments.trim(), contentTitle, tone || 'samimi'),
        model: model as AIModel, systemPrompt: COMMENT_REPLY_SYSTEM_PROMPT, maxTokens: 1200,
      }, req)
      const parsed = asRecord(parseStructuredOutput(result.content))
      const value = asRecord(parsed?.yanit_1)?.metin
      const draft = typeof value === 'string' ? value.trim().slice(0, 2_000) : ''
      if (!draft) return NextResponse.json({ error: 'Model kullanılabilir yanıt taslağı döndürmedi. Yeniden dene.' }, { status: 502 })
      return NextResponse.json({ draft, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
    }

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
        toplam_yorum: measuredNumber(summary?.toplam_yorum, 1_000_000),
        pozitif_oran: measuredNumber(summary?.pozitif_oran),
        negatif_oran: measuredNumber(summary?.negatif_oran),
        notr_oran: measuredNumber(summary?.notr_oran),
        genel_duygu: asText(summary?.genel_duygu, 40) || 'Belirtilmedi',
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
      topluluk_sagligi: { puan: measuredNumber(health?.puan), yorum: asText(health?.yorum, 1_000) },
      yanit_oncelikleri: asRecordList(parsed?.yanit_oncelikleri, (item) => {
        const yorum_ozeti = asText(item.yorum_ozeti, 1_000)
        return yorum_ozeti ? { yorum_ozeti, neden_onemli: asText(item.neden_onemli, 800), yanit_tonu: asText(item.yanit_tonu, 80), yanit_taslagi: typeof item.yanit_taslagi === 'string' ? asText(item.yanit_taslagi, 2_000) : '' } : null
      }, 30),
      genel_oneriler: asTextList(parsed?.genel_oneriler, 30, 1_000),
    }
    if (!parsed || (!analysis.icerik_firsatlari.length && !analysis.yanit_oncelikleri.length && !analysis.genel_oneriler.length && !analysis.duygu_analizi.en_cok_hissedilen)) {
      return NextResponse.json({ error: 'Model geçerli yorum analizi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ analysis, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch {
    return NextResponse.json({ error: 'Yorum analizi servisi isteği tamamlayamadı. Yeniden dene.' }, { status: 500 })
  }
}
