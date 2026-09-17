/**
 * Model çıktısındaki JSON anahtarlarını ve kodlanmış değerleri kullanıcıya
 * okunur Türkçe etiketlere çevirir.
 *
 * Canlı denetimde anahtarlar CSS ile büyük harfe çevriliyordu; ASCII yazılmış
 * "baslik" Türkçe yerel ayarda "BASLİK" oldu, İngilizce anahtarlar ("ideas")
 * "İDEAS" göründü ve "veri_yok", "zayif" gibi kodlar ham kaldı. Çeviri kelime
 * düzeyinde yapılır; sözlükte olmayan kelime olduğu gibi (ASCII) bırakılır,
 * fakat asla Türkçe büyük harf kuralıyla bozulmaz.
 */

const WORDS: Record<string, string> = {
  // Türkçe ASCII yazımlar
  aciklama: 'açıklama', aciklamasi: 'açıklaması', acilis: 'açılış', aciliyet: 'aciliyet', acisi: 'açısı',
  adi: 'adı', aksiyonlar: 'aksiyonlar', aktivitesi: 'aktivitesi', alanlari: 'alanları', aliskanligi: 'alışkanlığı',
  alintilar: 'alıntılar', alinti: 'alıntı', alma: 'alma', alt: 'alt', alternatif: 'alternatif', alternatifler: 'alternatifler',
  alternatifleri: 'alternatifleri', ana: 'ana', anahtar: 'anahtar', analizi: 'analizi', analiz: 'analiz', araligi: 'aralığı',
  arac: 'araç', aracadi: 'araç adı', arka: 'arka', arsiv: 'arşiv', artisi: 'artışı', avantajlar: 'avantajlar',
  baglanti: 'bağlantı', baslamak: 'başlamak', baslik: 'başlık', basliklar: 'başlıklar', benzer: 'benzer',
  bolumler: 'bölümler', boyutlar: 'boyutlar', bu: 'bu', buyume: 'büyüme', cekimler: 'çekimler', cevap: 'cevap',
  ceviri: 'çeviri', cikarilacak: 'çıkarılacak', cinsiyet: 'cinsiyet', cok: 'çok', cumle: 'cümle', cumlesi: 'cümlesi',
  dagilimi: 'dağılımı', davranisi: 'davranışı', degeri: 'değeri', degisiklikler: 'değişiklikler', ders: 'ders',
  dersler: 'dersler', dikkat: 'dikkat', dil: 'dil', donem: 'dönem', durum: 'durum', dusuk: 'düşük', duygu: 'duygu',
  edilen: 'edilen', edilmis: 'edilmiş', efekti: 'efekti', egitici: 'eğitici', egitim: 'eğitim', eglenceli: 'eğlenceli',
  eklenecek: 'eklenecek', eksigi: 'eksiği', en: 'en', enerji: 'enerji', erisi: 'erişim', erisim: 'erişim',
  etkilesim: 'etkileşim', etkili: 'etkili', farklilasma: 'farklılaşma', faktoru: 'faktörü', fikir: 'fikir',
  fikirleri: 'fikirleri', fikri: 'fikri', firsat: 'fırsat', firsatlar: 'fırsatlar', firsatlari: 'fırsatları',
  fiyat: 'fiyat', formulleri: 'formülleri', gecis: 'geçiş', gelir: 'gelir', genel: 'genel', gerekcesi: 'gerekçesi',
  giris: 'giriş', gonderim: 'gönderim', gorsel: 'görsel', guc: 'güç', guclu: 'güçlü', gun: 'gün', gunler: 'günler',
  gunu: 'günü', hacim: 'hacim', hafta: 'hafta', hazir: 'hazır', haftalik: 'haftalık', hakkinda: 'hakkında', haritasi: 'haritası',
  hedef: 'hedef', hedefleri: 'hedefleri', hemen: 'hemen', hesaplama: 'hesaplama', hikaye: 'hikâye', hikayeler: 'hikâyeler',
  his: 'his', hissedilen: 'hissedilen', hizli: 'hızlı', ic: 'iç', icerik: 'içerik', icin: 'için', ifadeler: 'ifadeler',
  ilgi: 'ilgi', ilkeleri: 'ilkeleri', iletisim: 'iletişim', ipuclari: 'ipuçları', ipucu: 'ipucu', isim: 'isim',
  isler: 'işler', iyi: 'iyi', iyilestirme: 'iyileştirme', kamera: 'kamera', kanal: 'kanal', kanca: 'kanca',
  kapanis: 'kapanış', karakter: 'karakter', karakteristik: 'karakteristik', karsilastirma: 'karşılaştırma',
  katilim: 'katılım', kaynak: 'kaynak', kazanan: 'kazanan', kazanimlar: 'kazanımlar', kazanma: 'kazanma',
  kelime: 'kelime', kelimeler: 'kelimeler', kisa: 'kısa', kisisel: 'kişisel', kitle: 'kitle', klik: 'tıklama',
  kosullari: 'koşulları', kotu: 'kötü', kpi: 'KPI', kriterler: 'kriterler', kullan: 'kullan', kullanilan: 'kullanılan',
  kullanimi: 'kullanımı', kulturel: 'kültürel', kulturu: 'kültürü', kurgu: 'kurgu', listesi: 'listesi', maddeleri: 'maddeleri',
  maili: 'e-postası', mantigi: 'mantığı', marka: 'marka', medya: 'medya', merak: 'merak', metin: 'metin', metni: 'metni',
  metrik: 'metrik', metrikler: 'metrikler', mevcut: 'mevcut', modul: 'modül', muzakere: 'müzakere', muzik: 'müzik',
  nasil: 'nasıl', neden: 'neden', nedeni: 'nedeni', niche: 'niş', nicheler: 'nişler', noktasi: 'noktası', notlar: 'notlar',
  notr: 'nötr', okuma: 'okuma', onemli: 'önemli', oncelik: 'öncelik', oncelikleri: 'öncelikleri', oncelikli: 'öncelikli',
  oner: 'öner', oneri: 'öneri', oneriler: 'öneriler', onerileri: 'önerileri', onerisi: 'önerisi', oran: 'oran', orani: 'oranı',
  orijinallik: 'orijinallik', ornek: 'örnek', ornekleri: 'örnekleri', orta: 'orta', ortalama: 'ortalama', ozellikler: 'özellikler',
  ozet: 'özet', ozeti: 'özeti', paleti: 'paleti', parca: 'parça', parcasi: 'parçası', paylasim: 'paylaşım', pazarlama: 'pazarlama',
  pik: 'zirve', platformlar: 'platformlar', populer: 'popüler', potansiyel: 'potansiyel', potansiyeli: 'potansiyeli',
  pozitif: 'pozitif', puan: 'puan', rakip: 'rakip', rehberi: 'rehberi', rekabet: 'rekabet', renk: 'renk', saat: 'saat',
  sagligi: 'sağlığı', saglik: 'sağlık', sahneler: 'sahneler', samimiyet: 'samimiyet', satin: 'satın', satiri: 'satırı',
  sayfasi: 'sayfası', sayisi: 'sayısı', secenekler: 'seçenekler', secenekleri: 'seçenekleri', secim: 'seçim', ses: 'ses',
  sesi: 'sesi', setleri: 'setleri', seviye: 'seviye', seviyesi: 'seviyesi', sicak: 'sıcak', sikca: 'sıkça', skor: 'skor',
  skoru: 'skoru', son: 'son', sonuc: 'sonuç', sonucu: 'sonucu', sorular: 'sorular', sorun: 'sorun', sorunlar: 'sorunlar',
  sosyal: 'sosyal', sozlesme: 'sözleşme', stili: 'stili', strateji: 'strateji', stratejisi: 'stratejisi', sure: 'süre',
  suresi: 'süresi', sutunlar: 'sütunlar', tahmin: 'tahmin', tahmini: 'tahmini', tahminler: 'tahminler', takip: 'takip',
  takipci: 'takipçi', takvim: 'takvim', tanitim: 'tanıtım', taslagi: 'taslağı', tarih: 'tarih', tarzlari: 'tarzları',
  tavsiye: 'tavsiye', temalar: 'temalar', tercih: 'tercih', tesekkur: 'teşekkür', tespit: 'tespit', tipi: 'tipi',
  tipleri: 'tipleri', ton: 'ton', tonlari: 'tonları', tonu: 'tonu', toplam: 'toplam', topluluk: 'topluluk', tuketim: 'tüketim',
  turu: 'türü', tutarlilik: 'tutarlılık', uygulanabilir: 'uygulanabilir', uyum: 'uyum', uzun: 'uzun', vadeli: 'vadeli',
  veri: 'veri', versiyon: 'versiyon', viral: 'viral', yanit: 'yanıt', yas: 'yaş', yasakli: 'yasaklı', yayin: 'yayın',
  yeni: 'yeni', yil: 'yıl', yok: 'yok', yol: 'yol', yollari: 'yolları', yonerge: 'yönerge', yonler: 'yönler', yorum: 'yorum',
  yuksek: 'yüksek', yukselenler: 'yükselenler', yuzde: 'yüzde', zamani: 'zamanı', zaman: 'zaman', zamanlama: 'zamanlama',
  zayif: 'zayıf', zorluk: 'zorluk', zorluklar: 'zorluklar',
  // İngilizce anahtarlar
  ideas: 'fikirler', idea: 'fikir', analysis: 'analiz', clips: 'klipler', clip: 'klip', start: 'başlangıç', end: 'bitiş',
  category: 'kategori', words: 'kelimeler', word: 'kelime', viral_score: 'viral skor', score: 'skor', reason: 'neden',
  title: 'başlık', description: 'açıklama', caption: 'açıklama metni', captions: 'açıklama metinleri', hashtags: 'hashtagler',
  tags: 'etiketler', scenes: 'sahneler', visual: 'görsel', narration: 'anlatım', voiceover: 'seslendirme', camera: 'kamera',
  transition: 'geçiş', time: 'zaman', timestamp: 'zaman damgası', duration: 'süre', sec: 'sn', on: '', screen: 'ekran',
  text: 'yazısı', production: 'prodüksiyon', notes: 'notlar', note: 'not', posts: 'gönderiler', post: 'gönderi',
  preview: 'önizleme', schema: 'şema', markup: 'işaretleme', script: 'senaryo', poll: 'anket', swipe: 'kaydırma', up: '',
  sticker: 'çıkartma', footage: 'görüntü', show: 'bölüm', level: 'seviye', angle: 'açı', hook: 'hook', hooks: 'hooklar',
  meta: 'meta', seo: 'SEO', cta: 'CTA', faqs: 'SSS', faq: 'SSS', id: 'kimlik',
  // Platform ve marka adları
  youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', linkedin: 'LinkedIn', pinterest: 'Pinterest', x: 'X',
  twitter: 'X (Twitter)', whatsapp: 'WhatsApp', telegram: 'Telegram', reels: 'Reels', shorts: 'Shorts',
}

/** Bütün anahtar için doğrudan karşılık (kelime kelime çeviri anlamı bozduğunda). */
const KEYS: Record<string, string> = {
  humanize_edilmis: 'Doğallaştırılmış metin',
  onScreenText: 'Ekran yazısı',
  durationSec: 'Süre (sn)',
  viralScore: 'Viral skor',
  trendId: 'Trend kimliği',
  alternatifKancalar: 'Alternatif kancalar',
  paylasimSaati: 'Paylaşım saati',
  productionNotes: 'Prodüksiyon notları',
  end_screen_cta: 'Bitiş ekranı CTA',
  cta_url_onerisi: 'CTA bağlantı önerisi',
  meta_title: 'Meta başlık',
  meta_description: 'Meta açıklama',
  show_notes: 'Bölüm notları',
  ps_notu: 'Not (P.S.)',
  sosyal_medya_caption: 'Sosyal medya açıklaması',
  klik_nedeni: 'Tıklama nedeni',
  a_b_alternatifleri: 'A/B alternatifleri',
  swipe_up_zamanlama: 'Kaydırma zamanlaması',
  kpi_hedefleri: 'KPI hedefleri',
  rota: 'Adres',
  seo_degeri: 'SEO değeri',
  niche: 'Niş',
}

/** Ekrana hiç basılmayan teknik alanlar. */
export const HIDDEN_OUTPUT_KEYS = new Set(['raw', 'model', 'rota', 'route', 'trendId', 'id', 'words', 'routingReason', 'tokensUsed'])

/** Kodlanmış değerlerin (enum) okunur karşılığı. */
const VALUES: Record<string, string> = {
  veri_yok: 'Veri yok', bu_hafta: 'Bu hafta', bu_ay: 'Bu ay', son_icerikler: 'Son içerikler', gelecek_hafta: 'Gelecek hafta',
  zayif: 'Zayıf', guclu: 'Güçlü', egitici: 'Eğitici', eglenceli: 'Eğlenceli', tanitim: 'Tanıtım', kisisel: 'Kişisel',
  yuksek: 'Yüksek', orta: 'Orta', dusuk: 'Düşük', iyi: 'İyi', kotu: 'Kötü', cok_yuksek: 'Çok yüksek', cok_dusuk: 'Çok düşük',
  pozitif: 'Pozitif', negatif: 'Negatif', notr: 'Nötr', hikaye: 'Hikâye', karusel: 'Carousel', genel: 'Genel',
  teknik: 'Teknik', fiyat: 'Fiyat', kullanim: 'Kullanım', knowledge: 'Bilgi', education: 'Eğitim', entertainment: 'Eğlence',
  humor: 'Mizah', motivation: 'Motivasyon', story: 'Hikâye', tutorial: 'Öğretici', emotional: 'Duygusal', controversial: 'Tartışmalı',
  sok: 'Şok', soru: 'Soru', istatistik: 'İstatistik', varsayim: 'Varsayım', trending: 'Trend',
}

function restoreWord(word: string) {
  const lower = word.toLocaleLowerCase('en-US')
  return Object.prototype.hasOwnProperty.call(WORDS, lower) ? WORDS[lower] : word
}

function sentenceCase(text: string) {
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toLocaleUpperCase('tr-TR') + trimmed.slice(1)
}

/** "saglikSkoru", "tarih_onerisi", "ideas" → "Sağlık skoru", "Tarih önerisi", "Fikirler". */
export function humanizeKey(key: string) {
  if (Object.prototype.hasOwnProperty.call(KEYS, key)) return KEYS[key]
  const words = key
    .replace(/([a-zçğıöşü0-9])([A-ZÇĞİÖŞÜ])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(restoreWord)
    .filter(Boolean)
  return sentenceCase(words.join(' '))
}

/** "veri_yok" → "Veri yok"; true → "Evet". Serbest metin olduğu gibi döner. */
export function humanizeValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString('tr-TR') : ''
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (Object.prototype.hasOwnProperty.call(VALUES, trimmed)) return VALUES[trimmed]
  if (/^[a-z]+(?:_[a-z]+)+$/.test(trimmed)) {
    const parts = trimmed.split('_')
    if (parts.every((part) => Object.prototype.hasOwnProperty.call(WORDS, part))) return sentenceCase(parts.map(restoreWord).join(' '))
  }
  return value
}

/** Metin içinde geçen kodlanmış alan adlarını ("bio, son_icerikler") okunur yapar. */
export function humanizeCodeList(text: string) {
  return text.replace(/\b[a-z]+(?:_[a-z]+)+\b/g, (match) => {
    const human = humanizeValue(match)
    return human === match ? humanizeKey(match).toLocaleLowerCase('tr-TR') : human.toLocaleLowerCase('tr-TR')
  })
}

/**
 * CSS `capitalize` Türkçe "i" harfini "İ" yapmadığı için ("ilham" → "Ilham")
 * kelime başları JS ile Türkçe kurala göre büyütülür.
 */
export function capitalizeTr(text: string) {
  return String(text ?? '').replace(/(^|[\s/(-])(\p{L})/gu, (_match, before: string, letter: string) => `${before}${letter.toLocaleUpperCase('tr-TR')}`)
}
