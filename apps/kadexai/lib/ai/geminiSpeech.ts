/**
 * Gemini ile metin seslendirme (TTS).
 *
 * Dublaj yalnızca OpenAI'nin ses ucuna bağlıydı; canlıda OPENAI_API_KEY
 * tanımlı olmadığı için araç 503 dönüp hiç çalışmıyordu. Gemini'nin TTS
 * modeli tanımlı anahtarla kullanılabiliyor.
 *
 * Gemini ham PCM döndürür (24 kHz, 16 bit, tek kanal). Tarayıcıdaki
 * `decodeAudioData` ham PCM'i çözemez, o yüzden burada WAV başlığı
 * eklenir — WAV'ı hem tarayıcı hem karıştırıcı sorunsuz çözüyor.
 *
 * Model kimliği SABİT YAZILMAZ. Görsel tarafında olduğu gibi TTS model
 * kimlikleri de emekliye ayrılıyor; sabit `gemini-2.5-flash-preview-tts`
 * canlıda 400 döndürüyordu ve Dublaj her parçayı boş sesle geçiyordu.
 * Anahtarın gerçekten erişebildiği TTS modeli Google'ın model listesinden
 * seçilir ve süreç boyunca önbelleklenir.
 */

const ORNEKLEME = 24_000
const BIT = 16
const KANAL = 1

/** Liste çekilemezse denenecek bilinen kimlikler; yeniden eskiye doğru. */
const BILINEN_TTS_MODELLER = [
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
]

/** OpenAI ses adları arayüzde seçili; Gemini'nin hazır seslerine eşlenir. */
const SES_ESLEME: Record<string, string> = {
  alloy: 'Kore',
  echo: 'Charon',
  fable: 'Puck',
  onyx: 'Fenrir',
  nova: 'Aoede',
  shimmer: 'Zephyr',
}

export interface GeminiModelInfo {
  name?: string
  supportedGenerationMethods?: string[]
}

export function geminiSeslendirmeKullanilabilir(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

/** Listeden TTS modelini seçer; önizleme olmayanı ve daha yeni sürümü tercih eder. */
export function pickGeminiTtsModel(models: GeminiModelInfo[]): string | null {
  const adaylar = models
    .map((model) => ({
      id: String(model.name ?? '').replace(/^models\//, ''),
      methods: Array.isArray(model.supportedGenerationMethods) ? model.supportedGenerationMethods : [],
    }))
    .filter((model) => /tts|speech/i.test(model.id) && model.methods.includes('generateContent'))
  if (!adaylar.length) return null
  const surum = (id: string) => Number(id.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0)
  adaylar.sort((a, b) =>
    Number(/preview|exp/i.test(a.id)) - Number(/preview|exp/i.test(b.id))
    || surum(b.id) - surum(a.id))
  return adaylar[0].id
}

/** Sağlayıcı durum kodunu kullanıcıya gösterilebilir, sır içermeyen Türkçe nedene çevirir. */
export function geminiSpeechError(status: number) {
  if (status === 429) return 'Gemini seslendirme kotası doldu; biraz sonra yeniden dene.'
  if (status === 401 || status === 403) return 'Gemini anahtarının seslendirme izni yok.'
  if (status === 404) return 'Tanımlı Gemini seslendirme modeli artık kullanılamıyor.'
  if (status === 400) return 'Gemini seslendirme isteğini reddetti.'
  return `Gemini seslendirme isteği tamamlanamadı (HTTP ${status}).`
}

/** Model kimliği hatası mı (yeniden model seçimi gerekir)? */
export function isGeminiTtsModelUnavailable(status: number, message: string) {
  return status === 404 || (status === 400 && /model|not found|not supported|unsupported/i.test(message))
}

let bulunanModel: string | null = null

async function modelKesfet(anahtar: string): Promise<string | null> {
  try {
    const yanit = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${anahtar}`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!yanit.ok) return null
    const veri = await yanit.json().catch(() => null) as { models?: GeminiModelInfo[] } | null
    return pickGeminiTtsModel(veri?.models ?? [])
  } catch {
    return null
  }
}

/** Ham PCM'i WAV kabına alır (RIFF başlığı + veri). */
function pcmWavaSar(pcm: Buffer): Buffer {
  const bayt = BIT / 8
  const baslik = Buffer.alloc(44)
  baslik.write('RIFF', 0)
  baslik.writeUInt32LE(36 + pcm.length, 4)
  baslik.write('WAVE', 8)
  baslik.write('fmt ', 12)
  baslik.writeUInt32LE(16, 16)          // fmt bloğu uzunluğu
  baslik.writeUInt16LE(1, 20)           // 1 = PCM
  baslik.writeUInt16LE(KANAL, 22)
  baslik.writeUInt32LE(ORNEKLEME, 24)
  baslik.writeUInt32LE(ORNEKLEME * KANAL * bayt, 28) // saniyedeki bayt
  baslik.writeUInt16LE(KANAL * bayt, 32)             // blok hizası
  baslik.writeUInt16LE(BIT, 34)
  baslik.write('data', 36)
  baslik.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([baslik, pcm])
}

async function tekDeneme(anahtar: string, model: string, metin: string, ses: string) {
  const yanit = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': anahtar },
      body: JSON.stringify({
        contents: [{ parts: [{ text: metin }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: SES_ESLEME[ses] ?? 'Aoede' },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  )
  if (!yanit.ok) {
    // Google'ın hata metni sır içermez; model kimliği hatasını ayırmak için okunur.
    const govde = await yanit.text().catch(() => '')
    return { ok: false as const, status: yanit.status, detay: govde.slice(0, 300) }
  }
  return { ok: true as const, veri: await yanit.json() }
}

/** Tek parçayı seslendirir, base64 WAV döndürür. */
export async function geminiSeslendir(metin: string, ses: string): Promise<string> {
  const anahtar = process.env.GEMINI_API_KEY?.trim()
  if (!anahtar) throw new Error('Gemini anahtarı tanımlı değil.')

  const sirali = [bulunanModel, ...BILINEN_TTS_MODELLER].filter(
    (m, i, list): m is string => Boolean(m) && list.indexOf(m) === i,
  )

  let sonStatus = 0
  for (const model of sirali) {
    const sonuc = await tekDeneme(anahtar, model, metin, ses)
    if (sonuc.ok) {
      bulunanModel = model
      const base64 = sonuc.veri?.candidates?.[0]?.content?.parts?.find(
        (p: Record<string, unknown>) => (p?.inlineData as { data?: string } | undefined)?.data,
      )?.inlineData?.data as string | undefined
      if (!base64) throw new Error('Ses verisi alınamadı.')
      return pcmWavaSar(Buffer.from(base64, 'base64')).toString('base64')
    }
    sonStatus = sonuc.status
    // Kota veya izin hatasında model değiştirmek işe yaramaz; hemen bırak.
    if (!isGeminiTtsModelUnavailable(sonuc.status, sonuc.detay)) {
      throw new Error(geminiSpeechError(sonuc.status))
    }
    bulunanModel = null
  }

  // Bilinen kimliklerin hepsi model hatası verdi: anahtarın erişebildiği
  // modeli listeden bul ve bir kez daha dene.
  const kesfedilen = await modelKesfet(anahtar)
  if (kesfedilen && !sirali.includes(kesfedilen)) {
    const sonuc = await tekDeneme(anahtar, kesfedilen, metin, ses)
    if (sonuc.ok) {
      bulunanModel = kesfedilen
      const base64 = sonuc.veri?.candidates?.[0]?.content?.parts?.find(
        (p: Record<string, unknown>) => (p?.inlineData as { data?: string } | undefined)?.data,
      )?.inlineData?.data as string | undefined
      if (!base64) throw new Error('Ses verisi alınamadı.')
      return pcmWavaSar(Buffer.from(base64, 'base64')).toString('base64')
    }
    sonStatus = sonuc.status
  }

  throw new Error(sonStatus ? geminiSpeechError(sonStatus) : 'Seslendirme modeli bulunamadı.')
}
