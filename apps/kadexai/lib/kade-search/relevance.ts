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

/**
 * Kategori, başlık desenlerinden çok daha güvenilir bir sinyal: "Mabel Matiz
 * - Ha Leylim" hiçbir müzik işareti taşımıyor ama kategorisi `muzik`.
 * Dizi/film bölümleri de aynı şekilde `film` kategorisiyle geliyor.
 */
const HARIC_KATEGORILER = new Set(['muzik', 'müzik', 'film', 'dizi'])

/**
 * "Daha 17 | 14. Bölüm", "Sahtekârlar 3. Bölüm Fragmanı" gibi dizi kayıtları.
 *
 * Desen hem Türkçe hem ASCII'ye düşürülmüş biçimi tanımalı: eşleştirme
 * `normalized` sütununa da uygulanıyordu ve orada "bölüm" → "bolum" olduğu
 * için desen HİÇ tutmuyordu; dizi kayıtları listeye giriyordu.
 */
const DIZI_DESENI = /(\d+\s*\.\s*b[öo]l[üu]m|b[öo]l[üu]m\s*\d+|fragman|full hd izle|tek par[çc]a|sezon\s*\d+|\d+\s*\.\s*sezon)/i

/**
 * Klip/şarkı kayıtları. Yalnızca İngilizce işaretler aranıyordu; Türkçe
 * müzik kayıtları ("Sanatçı - Şarkı", "ft.", "şarkı sözleri") listeye
 * giriyordu.
 */
const MUZIK_DESENI = /(official\s*(music\s*|audio\s*)?video|official\s*audio|lyrics?|\bklip\b|\baudio\b|feat\.|\bft\.|remix|prod\.|s[öo]zleri|akustik|cover)/i

/**
 * Latin dışı yazı sistemleri. Türkiye'deki bir üreticinin uyarlayamayacağı
 * Hintçe/Arapça/Kiril/CJK başlıklar listeyi dolduruyordu.
 */
const LATIN_DISI = /[Ѐ-ӿ؀-ۿऀ-ॿ一-鿿぀-ヿ가-힯]/

/** Türkçeye özgü harfler; başlığın Türkçe olduğuna dair en güçlü sinyal. */
const TURKCE_HARF = /[çğıöşüÇĞİÖŞÜ]/

/** Sık geçen Türkçe kelimeler — Türkçe harf içermeyen başlıkları da yakalar. */
const TURKCE_KELIME = /\b(ve|ile|için|nasıl|neden|bir|bu|çok|daha|en|kim|ne|var|yok|oldu|yeni)\b/i

/**
 * Eleme ve dil tespiti HAM başlığa bakar.
 *
 * Önceden `normalized` tercih ediliyordu; o sütun küçük harfe indirilmiş ve
 * Türkçe harfleri soyulmuş hâlde tutuluyor ("bölüm" → "bolum"). Sonuç:
 * Türkçe harf araması hiçbir zaman eşleşmiyor, dizi deseni tutmuyordu.
 * `normalized` yalnızca tekilleştirme için doğru alan.
 */
function baslikOf(row: CurrentTrendRow): string {
  return String(row.title || row.normalized || '').replace(/\s+/g, ' ').trim()
}

/**
 * Hashtag ve @etiketler dil ölçümünün dışında bırakılır.
 *
 * "रक्षाबंधन पर ननद की विदाई #anandraja #comedy #funny #shorts" başlığında
 * Devanagari harfler azınlıkta kalıyor çünkü İngilizce hashtag'ler oranı
 * seyreltiyordu; içerik Hintçe olmasına rağmen listeye giriyordu.
 */
function dilOlcumMetni(text: string): string {
  return text.replace(/[#@][\p{L}\p{N}_]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

/** Latin dışı karakterlerin oranı; tek emoji yüzünden başlık elenmesin. */
function latinDisiOrani(text: string): number {
  const harfler = [...text].filter((ch) => /\p{L}/u.test(ch))
  if (harfler.length === 0) return 0
  const disi = harfler.filter((ch) => LATIN_DISI.test(ch)).length
  return disi / harfler.length
}

/** Latin dışı oran eşiği. Hashtag'ler ölçüm dışı olduğu için düşürüldü. */
const LATIN_DISI_ESIGI = 0.35

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
  if (HARIC_KATEGORILER.has(String(row.category ?? '').toLocaleLowerCase('tr-TR'))) return 'muzik-kaydi'
  if (DIZI_DESENI.test(baslik)) return 'dizi-kaydi'
  if (MUZIK_DESENI.test(baslik)) return 'muzik-kaydi'
  // Harflerin yarıdan fazlası Latin dışıysa bu içerik buradaki kitleye uymuyor.
  if (latinDisiOrani(dilOlcumMetni(baslik)) > LATIN_DISI_ESIGI) return 'yabanci-dil'
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
