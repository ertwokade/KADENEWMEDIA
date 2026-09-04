import type { GenerateRequest, GenerateResult } from '@/types'

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue }

function mockHashtags() {
  return {
    yuksek: ['#dijitalpazarlama', '#sosyalmedya', '#icerikuretimi'],
    orta: ['#markastratejisi', '#sosyalmedyayonetimi', '#icerikstratejisi'],
    dusuk: ['#istanbulajans', '#kreatifekip', '#markanibuyut'],
    niche: ['#kadenewmedia', '#kadexai', '#dijitaldebuyu'],
  }
}

function extractJsonTemplate(source: string): JsonValue | null {
  const jsonIndex = source.toLocaleLowerCase('tr-TR').lastIndexOf('json')
  const searchFrom = jsonIndex >= 0 ? jsonIndex : 0
  const objectStart = source.indexOf('{', searchFrom)
  const arrayStart = source.indexOf('[', searchFrom)
  const start = objectStart < 0 ? arrayStart : arrayStart < 0 ? objectStart : Math.min(objectStart, arrayStart)
  if (start < 0) return null

  const opening = source[start]
  const closing = opening === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < source.length; index += 1) {
    const character = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') {
      inString = true
      continue
    }
    if (character === opening) depth += 1
    if (character === closing) depth -= 1
    if (depth !== 0) continue

    try {
      const candidate = source.slice(start, index + 1).replace(/:\s*0\s*-\s*100/g, ': 72')
      return JSON.parse(candidate) as JsonValue
    } catch {
      return null
    }
  }
  return null
}

function hydrateTemplate(value: JsonValue, key = ''): JsonValue {
  if (Array.isArray(value)) {
    if (value.length > 0) return value.map((item) => hydrateTemplate(item, key))
    if (/hashtag/i.test(key)) return ['#kadenewmedia', '#icerikstratejisi']
    return ['Mock öneri 1', 'Mock öneri 2']
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, hydrateTemplate(childValue, childKey)])
    )
  }
  if (typeof value === 'number') return value === 0 ? 72 : value
  if (typeof value !== 'string') return value
  if (!value.trim()) return 'KadexAI test çıktısı'
  if (value.includes('|')) return value.split('|')[0]
  return value
}

function structuredMock(request: GenerateRequest): JsonValue | null {
  const prompt = request.prompt
  const instructions = `${request.systemPrompt || ''}\n${prompt}`

  if (/hashtag stratejisti/i.test(instructions)) return mockHashtags()

  if (/clickbait_skoru/i.test(prompt)) {
    return {
      clickbait_skoru: 42,
      seviye: 'dikkatli',
      sorunlar: ['Vaat, içerikle daha açık eşleştirilebilir.'],
      guclu_yonler: ['Başlık merak uyandırıyor.'],
      alternatifler: [
        { baslik: 'Bu yöntemle içerik performansını adım adım artır', clickbait_skoru: 24, aciklama: 'Vaat daha ölçülü ve net.' },
        { baslik: 'İçerik performansını artıran 5 uygulanabilir adım', clickbait_skoru: 18, aciklama: 'Somut fayda sunuyor.' },
      ],
      genel_tavsiye: 'Başlıktaki vaadi içerikte sunulan somut sonuçla sınırla.',
      platform_normu: 'Platformda güçlü merak unsuru normal; yanıltıcı vaat önerilmez.',
    }
  }

  if (/"topluluk_sagligi"/i.test(prompt)) {
    return {
      ozet: { toplam_yorum: 4, pozitif_oran: 75, negatif_oran: 0, notr_oran: 25, genel_duygu: 'pozitif' },
      duygu_analizi: {
        en_cok_hissedilen: 'memnuniyet',
        pozitif_temalar: ['Faydalı anlatım', 'Net örnekler'],
        negatif_temalar: [],
        notr_sorular: ['Kaynaklar nerede paylaşılacak?'],
      },
      icerik_firsatlari: [{ fikir: 'Konuyu örneklerle derinleştiren devam videosu', kaynak_yorum: 'Bu konuyu daha detaylı anlat.', potansiyel: 'yüksek' }],
      topluluk_sagligi: { puan: 84, yorum: 'Topluluk yapıcı ve ilgili.' },
      yanit_oncelikleri: [{ yorum_ozeti: 'Kaynak talebi', neden_onemli: 'Güveni artırır', yanit_tonu: 'yardımcı ve net', yanit_taslagi: 'Elbette! Kullandığım kaynakları açıklamaya ve sabit yoruma ekliyorum.' }],
      genel_oneriler: ['Kaynak bağlantılarını sabit yorumda paylaş.', 'Devam içeriğini yorumlardan besle.'],
    }
  }

  if (/"slayts"/i.test(prompt)) {
    return {
      baslik: 'Markanı dijitalde büyütmenin 5 adımı',
      slayts: [
        { no: 1, tip: 'hook', baslik: 'Büyüme tesadüf değildir', metin: 'Doğru sistem, iyi fikri sürdürülebilir sonuca dönüştürür.', emoji: '✨', gorsel_oner: 'Güçlü tipografi ve tek odak noktası' },
        { no: 2, tip: 'bilgi', baslik: 'Önce hedefi netleştir', metin: 'Kime, hangi mesajla ve hangi sonuç için ulaştığını belirle.', emoji: '🎯', gorsel_oner: 'Hedef tahtası metaforu' },
        { no: 3, tip: 'liste', baslik: 'İçerik sistemini kur', metin: 'Fikir, üretim, yayın ve ölçüm adımlarını aynı takvimde birleştir.', emoji: '🧩', gorsel_oner: 'Birbirine bağlanan modüller' },
        { no: 4, tip: 'istatistik', baslik: 'Veriyi düzenli oku', metin: 'Etkileşim kadar dönüşüm ve elde tutma sinyallerini de izle.', emoji: '📊', gorsel_oner: 'Sade performans grafiği' },
        { no: 5, tip: 'cta', baslik: 'Şimdi ilk adımı seç', metin: 'Bugün tek bir hedef belirle ve ilk içeriğini ona göre üret.', emoji: '🚀', gorsel_oner: 'İleri hareket hissi veren ok' },
      ],
      caption: 'Dijital büyüme tek bir viral içerikten değil, tekrar edilebilir bir sistemden gelir.',
      hashtags: ['#kadenewmedia', '#dijitalpazarlama', '#icerikstratejisi'],
    }
  }

  if (/"viral_neden"/i.test(prompt) && /"zorluk"/i.test(prompt)) {
    return [
      { baslik: 'Bir markanın 30 günlük dönüşümü', aciklama: 'Öncesi ve sonrası verileriyle kısa bir vaka anlatımı.', tip: 'evergreen', viral_neden: 'Somut dönüşüm ve merak duygusu yaratır.', zorluk: 'orta' },
      { baslik: 'Sektörde herkesin yaptığı 3 hata', aciklama: 'Yaygın yanlışları hızlı örneklerle göster.', tip: 'trend', viral_neden: 'İzleyiciyi kendini kontrol etmeye yöneltir.', zorluk: 'kolay' },
      { baslik: 'Bir içeriği fikirden yayına taşıyoruz', aciklama: 'Ekibin gerçek üretim sürecini perde arkasından göster.', tip: 'mevsimsel', viral_neden: 'Şeffaf ve insani içerik güven oluşturur.', zorluk: 'orta' },
    ]
  }

  if (/başlık yazma konusunda uzman/i.test(instructions)) {
    return [
      'Markanı Dijitalde Büyüten 5 Net Adım',
      'İçerik Stratejini Bugün Nasıl Güçlendirirsin?',
      'Daha İyi Sonuç İçin Bu Sistemi Kur',
      'Sosyal Medyada Büyümeyi Kolaylaştıran Yöntem',
      'İçerikten Sonuca: Uygulanabilir Yol Haritası',
    ]
  }

  const template = extractJsonTemplate(instructions)
  return template ? hydrateTemplate(template) : null
}

export function generateMockContent(request: GenerateRequest): GenerateResult {
  const prompt = request.prompt.trim()
  if (!prompt) throw new Error('İstek metni boş olamaz.')
  if (prompt.length > 24_000) throw new Error('İstek metni 24.000 karakter sınırını aşıyor.')

  const structured = structuredMock(request)

  return {
    content: structured
      ? JSON.stringify(structured)
      : `[MOCK] KadexAI test çıktısı\n\nİstek güvenli biçimde işlendi (${prompt.length} karakter).`,
    model: request.model === 'auto' ? 'groq-llama-70b' : request.model,
    tokensUsed: 0,
    routingReason: 'Test ortamı mock sağlayıcısı; harici AI çağrısı yapılmadı.',
  }
}
