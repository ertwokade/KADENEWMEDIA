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
    if (!Array.isArray(platforms) || platforms.length > 8) {
      return NextResponse.json({ error: 'Geçersiz platform listesi' }, { status: 400 })
    }

    const fields = { accountName, niche, bio, metrics, recentPosts, goal }
    if (Object.values(fields).some((value) => String(value || '').length > 12_000)) {
      return NextResponse.json({ error: 'Analiz girdisi izin verilen sınırı aşıyor.' }, { status: 413 })
    }

    const missingEvidence = [
      !String(metrics || '').trim() ? 'ölçülebilir metrikler' : '',
      !String(recentPosts || '').trim() ? 'son içerik örnekleri' : '',
    ].filter(Boolean)

    const result = await generateContent({
      model: model as AIModel,
      maxTokens: 3600,
      systemPrompt:
        'Sen YouTube, Instagram ve TikTok büyüme danışmanısın. Yalnızca kullanıcının verdiği kanıtlara dayan. Veri olmayan metrik, oran, rakip sonucu veya trend uydurma. Kanıt olmayan her çıkarımı "Varsayım" olarak etiketle; hesaplanamayan alanı "Veri yok" yaz. Kişisel marka hesaplarını konumlandırma, içerik sistemi ve büyüme aksiyonları açısından denetle.',
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
Verilen metriklerde bulunuyorsa takipçi büyümesi, gösterim, erişim, etkileşim oranı, tıklama, kayıt, yorum, paylaşım, en iyi/en zayıf içerik, format, yayın zamanı, tema, hashtag, caption, rakip sinyali, trend ve anomali başlıklarını ayrı ayrı değerlendir. Verilmeyen alanlarda sadece "Veri yok" yaz.
Çıktı düzeni:
1. Veri kapsamı ve eksikler
2. Performans özeti ve yalnız hesaplanabilen oranlar
3. Sorunlar, anomaliler ve fırsatlar
4. Profil/bio iyileştirme önerileri
5. Platform bazlı güçlü/zayıf yönler
6. İçerik formatları, temalar, caption/hashtag önerileri
7. Platform bazlı paylaşım zamanı (kanıt yoksa test önerisi)
8. 30 günlük içerik takvimi
9. Satışa bağlanacak teklif/CTA önerileri
10. En öncelikli 5 görev`,
    }, req)

    return NextResponse.json(
      {
        content: result.content,
        model: result.model,
        routingReason: result.routingReason,
        tokensUsed: result.tokensUsed,
        evidence: { complete: missingEvidence.length === 0, missing: missingEvidence },
      },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
