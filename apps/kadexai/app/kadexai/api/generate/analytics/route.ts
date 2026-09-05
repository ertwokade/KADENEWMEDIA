import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { parseStructuredOutput } from '@/lib/ai/structured'
import { AIModel } from '@/types'
import { requireApiUser } from '@/lib/auth/server'
import { asRecord, asRecordList, asText, asTextList, asTextRecord } from '@/lib/ai/outputValidation'

const metricLabels: Record<string, string> = {
  followers: 'Takipçi / Abone',
  avg_views: 'Ortalama Görüntüleme',
  engagement_rate: 'Etkileşim Oranı (%)',
  monthly_growth: 'Aylık Değişim (%)',
  ctr: 'Tıklama Oranı (%)',
  avg_watch_time: 'Ortalama İzlenme Süresi (%)',
  total_content: 'Toplam İçerik Sayısı',
  shares: 'Paylaşım / Kaydetme',
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const { platform, niche, metrics, model } = await req.json() as {
      platform?: string
      niche?: string
      metrics?: Record<string, string>
      model?: AIModel
    }

    if (!platform || !niche?.trim() || !model) {
      return NextResponse.json({ error: 'Platform, niş ve model gerekli.' }, { status: 400 })
    }

    const metricLines = Object.entries(metrics || {})
      .filter(([, value]) => String(value).trim())
      .map(([key, value]) => `${metricLabels[key] || key}: ${value}`)

    if (metricLines.length === 0) {
      return NextResponse.json({ error: 'Analiz için en az bir metrik gir.' }, { status: 400 })
    }

    const result = await generateContent({
      model,
      maxTokens: 2000,
      systemPrompt: 'Sen sosyal medya performans analistisin. Yalnızca verilen metriklerden çıkarım yap, olmayan veriyi uydurma ve yanıtını sadece geçerli JSON olarak ver.',
      prompt: `Platform: ${platform}\nNiş: ${niche}\nMetrikler:\n${metricLines.join('\n')}\n\nBu hesabın performansını analiz et. Platform ve niş bağlamına göre güçlü alanları, sorunları ve ölçülebilir sonraki adımları üret.\nJSON: {"genel_durum":"2-3 cümlelik kanıta dayalı özet","guclu_metrikler":[{"metrik":"","yorum":""}],"iyilestirme_alanlari":[{"metrik":"","sorun":"","oneri":""}],"oncelikli_aksiyonlar":["somut aksiyon"],"hedef_metrikler":{"metrik adı":"gerçekçi hedef aralığı"},"buyume_stratejisi":"önümüzdeki 30 gün için ölçülebilir iyileştirme planı","icerik_stratejisi":"platforma ve nişe uygun içerik önerisi"}`,
    }, req)

    const parsed = asRecord(parseStructuredOutput(result.content))
    const analysis = {
      genel_durum: asText(parsed?.genel_durum, 2_000),
      guclu_metrikler: asRecordList(parsed?.guclu_metrikler, (item) => {
        const metrik = asText(item.metrik, 200)
        return metrik ? { metrik, yorum: asText(item.yorum, 1_000) } : null
      }),
      iyilestirme_alanlari: asRecordList(parsed?.iyilestirme_alanlari, (item) => {
        const metrik = asText(item.metrik, 200)
        return metrik ? { metrik, sorun: asText(item.sorun, 1_000), oneri: asText(item.oneri, 1_000) } : null
      }),
      oncelikli_aksiyonlar: asTextList(parsed?.oncelikli_aksiyonlar, 30, 1_000),
      hedef_metrikler: asTextRecord(parsed?.hedef_metrikler, 30),
      buyume_stratejisi: asText(parsed?.buyume_stratejisi, 4_000),
      icerik_stratejisi: asText(parsed?.icerik_stratejisi, 4_000),
    }
    if (!parsed || (!analysis.genel_durum && !analysis.oncelikli_aksiyonlar.length && !analysis.buyume_stratejisi)) {
      return NextResponse.json({ error: 'Model geçerli performans analizi döndürmedi. Yeniden dene.' }, { status: 502 })
    }
    return NextResponse.json({
      analysis,
      model: result.model,
      routingReason: result.routingReason,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analiz oluşturulamadı.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
