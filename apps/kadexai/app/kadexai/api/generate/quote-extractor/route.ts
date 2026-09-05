import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { QUOTE_SYSTEM_PROMPT, buildQuotePrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'
export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { content, authorName, model } = await req.json()
    if (!content || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildQuotePrompt(content, authorName || ''), model: model as AIModel, systemPrompt: QUOTE_SYSTEM_PROMPT, maxTokens: 2000 }, req)
    const parsed = asRecord(parseStructuredOutput(result.content))
    const alintilar = asRecordList(parsed?.alintilar, (quote) => {
      const metin = asText(quote.metin, 1_500)
      if (!metin) return null
      return {
        metin,
        tip: asText(quote.tip, 80) || 'bilgi',
        platform_onerisi: asText(quote.platform_onerisi, 80) || 'tümü',
        gorsel_format: asText(quote.gorsel_format, 80),
        hashtag_onerisi: asTextList(quote.hashtag_onerisi, 20, 100),
        neden_guclu: asText(quote.neden_guclu, 600),
      }
    }, 20)
    if (!parsed || alintilar.length === 0) return NextResponse.json({ error: 'Model geçerli alıntı döndürmedi. Yeniden dene.' }, { status: 502 })
    const data = { alintilar }
    return NextResponse.json({ data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
