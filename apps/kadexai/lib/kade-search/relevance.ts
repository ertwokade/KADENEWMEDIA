import type { CurrentTrendRow } from './types'

/**
 * İçerik tarama sonuçlarının ayıklanması.
 *
 * Tarama YouTube TR trend listesini çekiyor; o liste büyük ölçüde şarkı
 * klipleri, dizi bölümleri ve Türkiye ile ilgisi olmayan yabancı dildeki
 * shorts'lardan oluşuyor. Ham hâliyle günlük özete düştüğünde "içerik fikri"
 * değil, televizyon reytingi gibi bir liste çıkıyordu.
 *
 * Buradaki kurallar bir içerik üreticisinin işine yaramayacak satırları eler.
 * Eleme tek tek gerekçelendirilebilir olsun diye ayrı ayrı yazıldı; hepsi
 * başlığa bakar, gizli bir puanlama yoktur.
 */

/** Şarkı listesi bir içerik fikri değil; ayrı bir platform olarak geliyor. */
const HARIC_PLATFORMLAR = new Set(['music'])

/** "Daha 17 | 14. Bölüm", "Sahtekârlar 3. Bölüm Fragmanı" gibi dizi kayıtları. */
const DIZI_DESENI = /(\d+\s*\.\s*bölüm|bölüm\s*\d+|fragman|full hd izle|tek parça)/i

/** Klip/şarkı kayıtları: "Sanatçı - Şarkı", "(Official Video)" vb. */
const MUZIK_DESENI = /(official\s*(music\s*)?video|lyrics?|klip|audio|feat\.|remix|prod\.)/i

/**
 * Latin dışı yazı sistemleri. Türkiye'deki bir üreticinin uyarlayamayacağı
 * Hintçe/Arapça/Kiril/CJK başlıklar listeyi dolduruyordu.
 */
const LATIN_DISI = /[Ѐ-ӿ؀-ۿऀ-ॿ一-鿿぀-ヿ가-힯]/

/** Türkçeye özgü harfler; başlığın Türkçe olduğuna dair en güçlü sinyal. */
const TURKCE_HARF = /[çğıöşüÇĞİÖŞÜ]/

/** Sık geçen Türkçe kelimeler — Türkçe harf içermeyen başlıkları da yakalar. */
const TURKCE_KELIME = /\b(ve|ile|için|nasıl|neden|bir|bu|çok|daha|en|kim|ne|var|yok|oldu|yeni)\b/i

function baslikOf(row: CurrentTrendRow): string {
  return String(row.normalized || row.title || '').replace(/\s+/g, ' ').trim()
}

/** Latin dışı karakterlerin oranı; tek emoji yüzünden başlık elenmesin. */
function latinDisiOrani(text: string): number {
  const harfler = [...text].filter((ch) => /\p{L}/u.test(ch))
  if (harfler.length === 0) return 0
  const disi = harfler.filter((ch) => LATIN_DISI.test(ch)).length
  return disi / harfler.length
}

export type ElemeSebebi =
  | 'baslik-yok'
  | 'muzik-platformu'
  | 'dizi-kaydi'
  | 'muzik-kaydi'
  | 'yabanci-dil'

/** Satır listeye girmeli mi? Girmemeliyse sebebi döner. */
export function elemeSebebi(row: CurrentTrendRow): ElemeSebebi | null {
  const baslik = baslikOf(row)
  // Kısa olmak alakasızlık göstergesi değil (bir hashtag ya da marka adı iki
  // harf olabilir); yalnızca boş başlık elenir.
  if (baslik.length === 0) return 'baslik-yok'
  if (HARIC_PLATFORMLAR.has(String(row.platform))) return 'muzik-platformu'
  if (DIZI_DESENI.test(baslik)) return 'dizi-kaydi'
  if (MUZIK_DESENI.test(baslik)) return 'muzik-kaydi'
  // Harflerin yarıdan fazlası Latin dışıysa bu içerik buradaki kitleye uymuyor.
  if (latinDisiOrani(baslik) > 0.5) return 'yabanci-dil'
  return null
}

/** Türkçe olduğu anlaşılan başlıklar listede öne alınır. */
export function turkceGorunuyor(row: CurrentTrendRow): boolean {
  const baslik = baslikOf(row)
  return TURKCE_HARF.test(baslik) || TURKCE_KELIME.test(baslik)
}

/**
 * Ayıklanmış liste: elenecekler çıkarılır, Türkçe olanlar öne alınır, geri
 * kalanlar skor sırasını korur.
 *
 * Sıralama kararlı: aynı gruptaki satırlar girdi sırasını (skor sırası)
 * korur, böylece iki çalıştırma aynı listeyi verir.
 */
export function ayiklanmisTrendler(rows: CurrentTrendRow[]): CurrentTrendRow[] {
  const kalanlar = rows.filter((row) => elemeSebebi(row) === null)
  const turkce = kalanlar.filter(turkceGorunuyor)
  const digerleri = kalanlar.filter((row) => !turkceGorunuyor(row))
  return [...turkce, ...digerleri]
}

/** Neyin neden elendiğini görebilmek için; günlük özet loglarında kullanılır. */
export function elemeOzeti(rows: CurrentTrendRow[]): Record<string, number> {
  const sayac: Record<string, number> = {}
  for (const row of rows) {
    const sebep = elemeSebebi(row)
    if (sebep) sayac[sebep] = (sayac[sebep] ?? 0) + 1
  }
  return sayac
}
