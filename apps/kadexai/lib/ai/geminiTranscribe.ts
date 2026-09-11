import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateTranscript } from './transcription'

/**
 * Gemini ile ses çözümleme.
 *
 * Altyazı ve dublaj Groq'un Whisper ucuna bağlıydı; canlıda GROQ_API_KEY ve
 * OPENAI_API_KEY tanımlı değil, bu yüzden her iki araç da "Transkripsiyon
 * sağlayıcısı yapılandırılmamış" diyerek hiç çalışmıyordu. GEMINI_API_KEY
 * ise tanımlı ve Gemini sesi doğrudan okuyabiliyor.
 *
 * Gemini kelime bazlı zaman damgasını güvenilir vermiyor; bölüm (segment)
 * bazlı istiyoruz ve kelime zamanlarını bölüm içinde karakter uzunluğuna
 * göre dağıtıyoruz. Altyazı satırları bölüm sınırlarında oluştuğu için
 * görünen sonuç doğru; kelime içi hassasiyet Whisper kadar keskin değil.
 */

export type CozulmusKelime = { word: string; start: number; end: number }
export type CozumSonucu = { text: string; words: CozulmusKelime[]; language: string }

type Bolum = { start: number; end: number; text: string }

/**
 * Sürüm numarası yazan kimlikler zamanla kapatılıyor: canlıda
 * `gemini-2.5-flash` "no longer available to new users" diyerek 404 döndü.
 * Google'ın takma adları (`-latest`) hep yaşayan sürüme işaret ediyor;
 * yine de bir tanesi düşerse diye zincir var.
 */
const MODELLER = ['gemini-flash-latest', 'gemini-flash-lite-latest']

const TALIMAT = `Sen bir ses çözümleme aracısın. Verilen sesi olduğu gibi yaz.
Yanıtı YALNIZCA şu biçimde bir JSON nesnesi olarak ver, başka hiçbir şey yazma:
{"dil":"tr","bolumler":[{"baslangic":0.0,"bitis":2.4,"metin":"..."}]}
- "baslangic" ve "bitis" saniye cinsinden ondalık sayı olsun.
- Her bölüm bir cümle ya da doğal bir duraklamaya kadar olan parça olsun; 8 saniyeyi geçmesin.
- Konuşulan dili olduğu gibi yaz, çevirme.
- Konuşma yoksa "bolumler" boş dizi olsun.`

function jsonAyikla(ham: string): unknown {
  const kod = ham.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const bas = kod.indexOf('{')
  const son = kod.lastIndexOf('}')
  if (bas === -1 || son <= bas) return null
  try {
    return JSON.parse(kod.slice(bas, son + 1))
  } catch {
    return null
  }
}

/** Bölümü kelimelere böler ve süreyi karakter uzunluğuna göre paylaştırır. */
function bolumuKelimelereDagit(bolum: Bolum): CozulmusKelime[] {
  const kelimeler = bolum.text.split(/\s+/).filter(Boolean)
  if (!kelimeler.length) return []

  const sure = Math.max(bolum.end - bolum.start, 0.001)
  const toplamHarf = kelimeler.reduce((t, k) => t + k.length, 0) || kelimeler.length

  let imlec = bolum.start
  return kelimeler.map((kelime, i) => {
    const pay = (kelime.length || 1) / toplamHarf
    const bas = imlec
    // Son kelime bölümün bitişine tam otursun; yuvarlama kayması birikmesin.
    const bit = i === kelimeler.length - 1 ? bolum.end : Math.min(bas + sure * pay, bolum.end)
    imlec = bit
    return { word: kelime, start: bas, end: bit }
  })
}

export function geminiTranscribeKullanilabilir(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim())
}

export async function geminiTranscribe(dosya: File, vocabulary: string[] = []): Promise<CozumSonucu> {
  const anahtar = process.env.GEMINI_API_KEY?.trim()
  if (!anahtar) throw new Error('Gemini anahtarı tanımlı değil.')

  const veri = Buffer.from(await dosya.arrayBuffer()).toString('base64')
  const istemci = new GoogleGenerativeAI(anahtar)

  let ham = ''
  let sonHata: unknown = null
  for (const ad of MODELLER) {
    try {
      const yanit = await istemci.getGenerativeModel({ model: ad }).generateContent([
        { inlineData: { mimeType: dosya.type.split(';')[0].trim() || 'audio/webm', data: veri } },
        { text: `${TALIMAT}\n- Özel isim sözlüğü: ${vocabulary.join(', ') || 'yok'}. Yalnız sesle eşleştiğinde bu yazımı aynen kullan; seste yoksa ekleme.` },
      ])
      ham = yanit.response.text()
      break
    } catch (e) {
      sonHata = e
    }
  }
  if (!ham) {
    throw new Error(sonHata instanceof Error ? sonHata.message : 'Ses çözümlenemedi.')
  }

  const cozum = jsonAyikla(ham) as
    | { dil?: unknown; bolumler?: unknown }
    | null
  if (!cozum) throw new Error('Ses çözümlenemedi.')

  if (!Array.isArray(cozum.bolumler) || cozum.bolumler.length > 10_000) throw new Error('Geçersiz ses bölümleri.')
  let previousEnd = 0
  const bolumler: Bolum[] = cozum.bolumler.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Geçersiz ses bölümü.')
    const { baslangic, bitis, metin } = value as Record<string, unknown>
    if (typeof baslangic !== 'number' || typeof bitis !== 'number' ||
        !Number.isFinite(baslangic) || !Number.isFinite(bitis) || baslangic < previousEnd || bitis <= baslangic ||
        typeof metin !== 'string' || !metin.trim() || metin.length > 10_000) throw new Error('Geçersiz ses bölümü.')
    previousEnd = bitis
    return { start: baslangic, end: bitis, text: metin.trim() }
  })

  const words = bolumler.flatMap(bolumuKelimelereDagit)

  return validateTranscript({
    text: bolumler.map((b) => b.text).join(' '),
    words,
    language: typeof cozum.dil === 'string' ? cozum.dil : '',
  })
}
