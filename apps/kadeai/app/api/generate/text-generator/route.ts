import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { rateLimit, getRateLimitKey } from '@/lib/rateLimit'
import { AIModel } from '@/types'

export async function POST(req: NextRequest) {
  const { allowed, remaining } = rateLimit(getRateLimitKey(req))
  if (!allowed) return NextResponse.json({ error: 'Çok fazla istek. 1 dakika bekle.' }, { status: 429 })

  try {
    const { goal, format, platform, audience, tone, keyPoints, model } = await req.json()

    if (!goal || !format || !platform || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      model: model as AIModel,
      maxTokens: 2600,
      systemPrompt:
        'Sen Kade Media için çalışan kıdemli Türkçe metin yazarı ve içerik stratejistisin. Net, satılabilir, doğal ve platforma uygun metinler yaz.',
      prompt: `Amaç: ${goal}
Format: ${format}
Platform/Kanal: ${platform}
Hedef kitle: ${audience || 'belirtilmedi'}
Ton: ${tone || 'net, profesyonel ve samimi'}
Önemli noktalar:
${keyPoints || 'belirtilmedi'}

Bu bilgilerle kullanıma hazır Türkçe metin üret.
Çıktı düzeni:
1. Nihai metin
2. Kısa alternatif başlık/hook seçenekleri
3. CTA önerileri
4. Yayınlamadan önce kontrol listesi`,
    })

    return NextResponse.json(
      { content: result.content, model: result.model, tokensUsed: result.tokensUsed },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
