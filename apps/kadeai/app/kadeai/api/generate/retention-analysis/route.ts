import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { AIModel } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  const { allowed, remaining } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const { title, platform, content, metrics, audience, model } = await req.json()

    if (!platform || !content || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      model: model as AIModel,
      maxTokens: 3200,
      systemPrompt:
        'Sen kısa/uzun video retention analisti ve sosyal medya performans uzmanısın. İçeriğin neden izlendiğini, neden terk edildiğini ve nasıl düzeleceğini açıkça çıkarırsın.',
      prompt: `Platform: ${platform}
Başlık/Konu: ${title || 'belirtilmedi'}
Hedef kitle: ${audience || 'belirtilmedi'}
Varsa metrikler: ${metrics || 'belirtilmedi'}

İçerik metni, hook, script veya transkript:
${content}

Bu içeriği analiz et.
Çıktı düzeni:
- İzlenme nedeni: güçlü taraflar
- İzlenmeme/terk edilme nedeni: zayıf taraflar
- İlk 3 saniye analizi
- Orta bölüm retention riski
- CTA ve kapanış analizi
- Platforma göre düzeltme reçetesi
- Revize hook ve revize akış önerisi
- 100 üzerinden retention skoru`,
    }, req)

    return NextResponse.json(
      { content: result.content, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
