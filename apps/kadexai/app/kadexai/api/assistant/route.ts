import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai/provider'
import { SELECTABLE_MODELS } from '@/lib/ai/models'
import { getAvailableModels } from '@/lib/ai/modelRouter'
import { AIModel } from '@/types'
import { requireApiUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'


/**
 * Asistanın modeli.
 *
 * Buradaki liste elle yazılmıştı ve `gemini-flash` (gemini-2.5-flash) ile
 * başlıyordu; o kimlik anahtarımıza kapalı ve canlıda 404 dönüyor — yani
 * GEMINI_API_KEY tanımlı olan her kurulumda asistan hiç çalışmıyordu.
 * Artık ortak yönlendiricinin ÖLÇÜLEREK doğrulanmış listesi kullanılıyor;
 * model listesi bir daha iki yerde ayrı ayrı tutulmuyor.
 */
function selectOperationsModel(): AIModel | null {
  // Tek bir modele sabitlemek yerine 'auto': yönlendirici aday zincirini
  // sırayla dener. Sabit model seçildiğinde sağlayıcı bir kez 503 dönünce
  // asistan hiç cevap veremiyordu; yedek yolu yoktu.
  return getAvailableModels().length > 0 ? 'auto' : null
}

export async function POST(req: NextRequest) {
  const guard = await requireApiUser()
  if (guard) return guard

  try {
    const body = await req.json()
    const question = String(body.question || '').slice(0, 4000)
    const context = String(body.context || '').slice(0, 16000)
    if (!question) return NextResponse.json({ error: 'Soru boş.' }, { status: 400 })

    const requestedModel = String(body.model || '') as AIModel
    const model = SELECTABLE_MODELS.includes(requestedModel)
      ? requestedModel
      : selectOperationsModel()
    if (!model) {
      return NextResponse.json({ error: 'Asistan için yönetici ayarı gerekli: bağlı AI sağlayıcısı yok.' })
    }

    const result = await generateContent({
      model,
      maxTokens: 1200,
      systemPrompt:
        'Sen KadexAI çalışma alanının Türkçe konuşan asistanısın. ' +
        'Aşağıdaki kullanıcı bağlamına dayanarak kısa, net ve uygulanabilir cevap ver. ' +
        'Selamlama veya "ekip olarak" gibi girişler yazma; doğrudan cevaba başla. ' +
        'Araçlar sorulursa bağlamdaki araç kataloğunun TAMAMINI kategorileriyle ver; son kullanılan araçları tam liste gibi sunma. ' +
        'Bağlamda olmayan veriyi varmış gibi anlatma; veri yoksa bunu söyleyip genel öneride bulun.\n\n--- KULLANICI BAĞLAMI ---\n' + context,
      prompt: question,
      // İstek geçilmezse bildirim ve maliyet dökümü aracı "unknown" olarak
      // kaydediyordu; asistan çalıştırmaları kendi adıyla görünsün.
    }, req)

    return NextResponse.json({ answer: result.content, model: result.model, routingReason: result.routingReason, tokensUsed: result.tokensUsed })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sunucu hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
