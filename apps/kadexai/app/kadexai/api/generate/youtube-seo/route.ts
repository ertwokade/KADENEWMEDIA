import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { YOUTUBE_SEO_SYSTEM_PROMPT, buildYoutubeSeoPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'
import { asBoolean, asNumber, asRecord, asRecordList, asText, asTextList } from '@/lib/ai/outputValidation'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { title, description, tags, niche, model } = await req.json()
    if (!title || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })

    const result = await generateContent({
      prompt: buildYoutubeSeoPrompt(title, description || '', tags || '', niche || ''),
      model: model as AIModel,
      systemPrompt: YOUTUBE_SEO_SYSTEM_PROMPT,
      maxTokens: 2500,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const titleAnalysis = asRecord(parsed?.baslik_analizi)
    const descriptionAnalysis = asRecord(parsed?.aciklama_analizi)
    const tagAnalysis = asRecord(parsed?.tag_analizi)
    const seo = {
      seo_skoru: asNumber(parsed?.seo_skoru),
      baslik_analizi: { puan: asNumber(titleAnalysis?.puan), sorunlar: asTextList(titleAnalysis?.sorunlar), optimize_edilmis: asText(titleAnalysis?.optimize_edilmis, 500) },
      aciklama_analizi: { puan: asNumber(descriptionAnalysis?.puan), sorunlar: asTextList(descriptionAnalysis?.sorunlar), optimize_edilmis: asText(descriptionAnalysis?.optimize_edilmis, 5_000) },
      tag_analizi: { puan: asNumber(tagAnalysis?.puan), mevcut_iyi: asTextList(tagAnalysis?.mevcut_iyi), eklenecek: asTextList(tagAnalysis?.eklenecek), cikarilacak: asTextList(tagAnalysis?.cikarilacak) },
      anahtar_kelimeler: asRecordList(parsed?.anahtar_kelimeler, (item) => {
        const kelime = asText(item.kelime, 200)
        return kelime ? { kelime, hacim: asText(item.hacim, 40), rekabet: asText(item.rekabet, 40), kullan: asBoolean(item.kullan) } : null
      }, 100),
      thumbnail_ipuclari: asTextList(parsed?.thumbnail_ipuclari, 30, 1_000),
      genel_oneriler: asTextList(parsed?.genel_oneriler, 30, 1_000),
    }
    if (!parsed || (!seo.baslik_analizi.optimize_edilmis && !seo.aciklama_analizi.optimize_edilmis && !seo.genel_oneriler.length)) {
      return NextResponse.json({ error: 'Model geçerli SEO analizi döndürmedi. Yeniden dene.' }, { status: 502 })
    }

    return NextResponse.json({ seo, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 })
  }
}
