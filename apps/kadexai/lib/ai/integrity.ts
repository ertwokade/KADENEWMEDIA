/**
 * Her üretim isteğine eklenen ortak içerik dürüstlüğü kuralları.
 *
 * Canlı denetimde birçok araç kaynakta olmayan istatistik ("%90'ı"), geçmiş yıl
 * ("2024'te"), video süresi bilinmeden bölüm zaman damgası ve uydurma kişisel
 * anekdot üretti. Kurallar tek yerde tutulur ve sağlayıcı katmanında bütün
 * isteklere eklenir; araç prompt'ları ayrıca tekrar etmek zorunda kalmaz.
 */
export function currentDateInstruction(now = new Date()) {
  const date = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'full' }).format(now)
  const year = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric' }).format(now)
  return { date, year }
}

export function contentIntegrityInstruction(now = new Date()) {
  const { date, year } = currentDateInstruction(now)
  return `

İÇERİK DÜRÜSTLÜĞÜ KURALLARI (her yanıtta geçerli):
- Bugünün tarihi: ${date}. Güncel yıl ${year}. Yıl gerekiyorsa yalnız ${year} kullan; geçmiş yılları güncel gibi yazma, örneklerde de eski yıl önerme.
- Kullanıcının verdiği metinde olmayan istatistik, yüzde, sayı, araştırma, "resmi açıklama" veya kaynak iddiası yazma ("%90'ı", "araştırmalara göre" gibi). Sayı gerekiyorsa nitel ifade kullan.
- Kullanıcıya ait olmayan deneyim, müşteri hikâyesi veya kişisel anekdot uydurma ("dün bir müşterimin…", "10 yılda öğrendiğim…" gibi).
- Video süresi verilmediyse bölüm zaman damgası (00:00, 01:15 gibi) yazma.
- Rakip, marka veya kişi hakkında girdide olmayan özellik yazma; bilgi yoksa "bilgi verilmedi" de.
- Alıntı istenirse yalnız verilen metinden birebir, kelimesi değiştirilmemiş cümle kullan.
- "[Web Sitesi Linki]" gibi doldurulmamış yer tutucu bırakma; bilgi yoksa o satırı yazma.
- İstenen adet (tweet, soru, slayt, başlık) varsa tam olarak o sayıda üret.
- Türkçe yazım ve noktalama kurallarına uy; İngilizce kelime karıştırma, olumsuzluk eklerini ("sormamanız" / "sormanız") doğru kullan.
- Selamlama, kendini tanıtma veya "aşağıda bulabilirsiniz" gibi sohbet girişi yazma; doğrudan istenen çıktıyla başla.`
}

/** Zaman aşımı, hız sınırı, sunucu ve ağ hataları geçicidir; yeniden denenebilir. */
export function isTransientProviderError(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  if (/api key|apikey|unauthori|forbidden|permission|yapılandır|tanımlı değil|Oturum gerekli|invalid argument|safety/i.test(message)) return false
  return /timeout|timed out|zaman aşımı|yanıt vermedi|abort|429|rate|quota|overload|unavailable|5\d\d|internal|ECONNRESET|fetch failed|network|socket/i.test(message)
}
