import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { COLLAB_MAIL_SYSTEM_PROMPT, buildCollabMailPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asText, asTextList } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { senderName, senderChannel, senderNiche, targetName, dealType, extraNotes, model } = await req.json()
    if (!senderName || !targetName || !dealType || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildCollabMailPrompt(senderName, senderChannel, senderNiche, targetName, dealType, extraNotes),
      model: model as AIModel,
      systemPrompt: COLLAB_MAIL_SYSTEM_PROMPT,
      maxTokens: 3000,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const short = asRecord(parsed?.kisa_versiyon)
    const long = asRecord(parsed?.uzun_versiyon)
    const mail = {
      kisa_versiyon: { konu: asText(short?.konu, 300), metin: asText(short?.metin, 8_000) },
      uzun_versiyon: { konu: asText(long?.konu, 300), metin: asText(long?.metin, 12_000) },
      takip_maili: asText(parsed?.takip_maili, 8_000),
      ipuclari: asTextList(parsed?.ipuclari, 20, 1_000),
    }
    if (!parsed || (!mail.kisa_versiyon.metin && !mail.uzun_versiyon.metin)) return NextResponse.json({ error: 'Model geçerli e-posta metni döndürmedi. Yeniden dene.' }, { status: 502 })

    return NextResponse.json({ mail, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
