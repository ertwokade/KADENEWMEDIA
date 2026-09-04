import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { FAQ_SYSTEM_PROMPT, buildFAQPrompt } from '@/lib/ai/prompts'
import { AIModel } from '@/types'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { requireApiUser } from '@/lib/auth/server'

const FAQ_CATEGORIES = new Set(['teknik', 'genel', 'fiyat', 'kullanim'])

function normalizeFaqOutput(value: Record<string, unknown>) {
  if (!Array.isArray(value.faqs)) return null
  const faqs = value.faqs.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const soru = typeof row.soru === 'string' ? row.soru.trim() : ''
    const cevap = typeof row.cevap === 'string' ? row.cevap.trim() : ''
    if (!soru || !cevap) return []
    const rawCategory = typeof row.kategori === 'string'
      ? row.kategori.toLocaleLowerCase('tr-TR').replace('kullanım', 'kullanim')
      : 'genel'
    return [{
      soru: soru.slice(0, 500),
      cevap: cevap.slice(0, 2_000),
      kategori: FAQ_CATEGORIES.has(rawCategory) ? rawCategory : 'genel',
    }]
  }).slice(0, 20)
  if (!faqs.length) return null
  return {
    faqs,
    schema_markup: typeof value.schema_markup === 'string' ? value.schema_markup : '',
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { content, platform, count, model } = await req.json()
    if (!content || !model) return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    const result = await generateContent({ prompt: buildFAQPrompt(content, platform || 'youtube', count || 8), model: model as AIModel, systemPrompt: FAQ_SYSTEM_PROMPT, maxTokens: 2500 }, req)
    const data = normalizeFaqOutput(parseStructuredOutput(result.content))
    if (!data) {
      return NextResponse.json({ error: 'Model geçerli soru-cevaplar döndürmedi. Lütfen yeniden dene.' }, { status: 502 })
    }
    return NextResponse.json({ data, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Sunucu hatası' }, { status: 500 }) }
}
