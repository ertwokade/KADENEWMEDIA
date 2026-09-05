import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { BIO_LINK_SYSTEM_PROMPT, buildBioLinkPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextRecord } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { name, niche, platforms, highlights, tone, model } = await req.json()
    if (!name || !niche || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildBioLinkPrompt(name, niche, platforms || [], highlights || '', tone || 'samimi'),
      model: model as AIModel,
      systemPrompt: BIO_LINK_SYSTEM_PROMPT,
      maxTokens: 2500,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const platformData = asRecord(parsed?.platformlar)
    const platformlar = Object.fromEntries(Object.entries(platformData || {}).flatMap(([platform, value]) => {
      const fields = asTextRecord(value, 20)
      return Object.keys(fields).length ? [[platform.slice(0, 40), fields]] : []
    }))
    const linkData = asRecord(parsed?.link_sayfasi)
    const linkler = asRecordList(linkData?.linkler, (link) => {
      const baslik = asText(link.baslik, 200)
      if (!baslik) return null
      return { baslik, aciklama: asText(link.aciklama, 500) }
    }, 20)
    if (!parsed || Object.keys(platformlar).length === 0) return NextResponse.json({ error: 'Model geçerli biyografi verisi döndürmedi. Yeniden dene.' }, { status: 502 })
    const bio = { platformlar, link_sayfasi: { baslik: asText(linkData?.baslik, 200), aciklama: asText(linkData?.aciklama, 800), linkler } }

    return NextResponse.json({ bio, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
