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
    const { accountName, niche, platforms, bio, metrics, recentPosts, goal, model } = await req.json()

    if (!accountName || !niche || !platforms?.length || !model) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }

    const result = await generateContent({
      model: model as AIModel,
      maxTokens: 3600,
      systemPrompt:
        'Sen YouTube, Instagram ve TikTok büyüme danışmanısın. Kişisel marka hesaplarını konumlandırma, içerik sistemi ve büyüme aksiyonları açısından denetlersin.',
      prompt: `Hesap/Kişi: ${accountName}
Niş: ${niche}
Platformlar: ${platforms.join(', ')}
Bio/profil açıklaması:
${bio || 'belirtilmedi'}

Metrikler:
${metrics || 'belirtilmedi'}

Son içerikler / örnek başlıklar:
${recentPosts || 'belirtilmedi'}

Hedef:
${goal || 'büyüme ve satış'}

Kişisel sosyal medya analiz raporu çıkar.
Çıktı düzeni:
1. Konumlandırma puanı ve yorum
2. Profil/bio iyileştirme önerileri
3. Platform bazlı güçlü/zayıf yönler
4. İçerik sütunları
5. YouTube, Instagram, TikTok için ayrı aksiyonlar
6. 30 günlük net plan
7. Satışa bağlanacak teklif/CTA önerileri
8. En öncelikli 5 görev`,
    })

    return NextResponse.json(
      { content: result.content, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
