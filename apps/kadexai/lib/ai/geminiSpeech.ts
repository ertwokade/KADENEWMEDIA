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
 */

const MODEL = 'gemini-2.5-flash-preview-tts'
const ORNEKLEME = 24_000
const BIT = 16
const KANAL = 1

/** OpenAI ses adları arayüzde seçili; Gemini'nin hazır seslerine eşlenir. */
const SES_ESLEME: Record<string, string> = {
  alloy: 'Kore',
  echo: 'Charon',
  fable: 'Puck',
  onyx: 'Fenrir',
  nova: 'Aoede',
  shimmer: 'Zephyr',
}

export function geminiSeslendirmeKullanilabilir(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
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

/** Tek parçayı seslendirir, base64 WAV döndürür. */
export async function geminiSeslendir(metin: string, ses: string): Promise<string> {
  const anahtar = process.env.GEMINI_API_KEY?.trim()
  if (!anahtar) throw new Error('Gemini anahtarı tanımlı değil.')

  const yanit = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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
    throw new Error(`Seslendirme sağlayıcısı ${yanit.status} döndü.`)
  }

  const veri = await yanit.json()
  const base64 = veri?.candidates?.[0]?.content?.parts?.find(
    (p: Record<string, unknown>) => (p?.inlineData as { data?: string } | undefined)?.data,
  )?.inlineData?.data as string | undefined

  if (!base64) throw new Error('Ses verisi alınamadı.')

  return pcmWavaSar(Buffer.from(base64, 'base64')).toString('base64')
}
