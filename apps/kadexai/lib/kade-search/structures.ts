/** Distinct editable shooting templates, not claims that filming already happened. */
export const FORMAT_STRUCTURES: Record<string, readonly string[]> = {
  pov: ['Rolü ve karşılaşılan durumu tek cümlede kur.', 'Kamerayı karakterin göz hizasına yerleştir; iki karar anını canlandır.', 'Kararın sonucunu göster ve izleyiciye ne yapacağını sor.'],
  gecis: ['Başlangıç görünümünü sabit kadrajda kaydet.', 'El, nesne veya kamera hareketiyle kesme noktasını ört.', 'Aynı kadrajda ikinci görünümü açığa çıkar; geçişi kısa tekrar oynat.'],
  onceSonra: ['Önce görüntüsünü tarih ve koşullarıyla göster.', 'Değişiklikleri adım adım belirt; sonucu etkileyen diğer koşulları saklama.', 'Sonra görüntüsünü aynı açıyla karşılaştır; gözlenmeyen kazanımı iddia etme.'],
  ogretici: ['Ulaşılacak sonucu ve gereken malzemeyi göster.', 'Uygulamayı üç açık adımda çek; kritik hareketi yakınlaştır.', 'Sonucu kontrol et, sık hatayı göster ve adımları özetle.'],
  liste: ['Listenin konusunu, öğe sayısını ve seçim ölçütünü söyle.', 'Her öğeye bir örnek ve kısa gerekçe ayır.', 'Öğeleri aynı ölçütle karşılaştır; izleyiciden kendi seçimini iste.'],
  hikaye: ['Olayın yerini, karakterini ve başlangıç sorununu kur.', 'Karar anını ve beklenmedik engeli sırayla anlat.', 'Sonucu ve çıkarılan dersi paylaş; kurgusal hikâyeyi açıkça etiketle.'],
  challenge: ['Meydan okumanın güvenli kurallarını ve süre sınırını açıkla.', 'Denemeyi kaydet; başarısız girişimleri sonuçtan ayır.', 'Gerçek sonucu göster; tehlikeli davranışa veya garantili başarıya çağırma.'],
  duet: ['Yanıtlanan kaynağı ve iddiayı kısa, izinli bir alıntıyla tanıt.', 'Kendi görüşünü veya karşı örneğini kaynakla yan yana göster.', 'Katıldığın ve ayrıldığın noktaları ayır; asıl kaynağı belirt.'],
  asmr: ['Sessiz ortamı ve kullanılacak nesneyi yakın planda göster.', 'Üç farklı dokuyu veya hareketi temiz sesle kaydet.', 'En belirgin sesi tekrarla; ani yüksek ses olmadan döngüyü tamamla.'],
  greenScreen: ['Arkadaki görselin kaynağını ve açıklanacak soruyu göster.', 'Görseldeki iki veya üç detayı sırayla işaretle.', 'Görselin gösterdiği bilgiyi yorumundan ayırarak özetle.'],
  vlog: ['Günün amacını ve başlangıç noktasını belirt.', 'Hazırlık, uygulama ve mola anlarını kısa zaman etiketleriyle çek.', 'Günün gerçek sonucunu paylaş; sonraki gün için bir not bırak.'],
  roportaj: ['Katılımcının çekim iznini al ve tek açık soru sor.', 'Yanıtı anlamını değiştirmeden aktar; gerekirse takip sorusu ekle.', 'Farklı yanıtları karşılaştır; küçük örneklemi toplumun tamamı gibi sunma.'],
  edit: ['Kurgunun duygu veya hareket temasını belirle.', 'İzinli görüntüleri ritim noktalarında kes; görsel sürekliliği koru.', 'En güçlü kareyle bitir ve ilk kareye uyumlu bir döngü kur.'],
  skec: ['Karakterleri ve aralarındaki küçük çatışmayı kur.', 'Yanlış anlaşılmayı iki kısa replik veya hareketle büyüt.', 'Beklentiyi tersine çeviren bir sonuçla bitir; canlandırmayı etiketle.'],
  test: ['İddiayı, ölçütü ve başlangıç koşullarını açıkla.', 'Kontrol ve deneme adımlarını aynı koşullarda kaydet.', 'Ölçülen sonucu ve testin sınırlarını göster; denenmeyen sonucu uydurma.'],
  unboxing: ['Ürünü ve satın alma veya sponsorluk bilgisini tanıt.', 'Paket içeriğini sırayla çıkar; ayrıntıları yakın çekimde göster.', 'İlk kullanım gözlemini paylaş; uzun dönem incelemesinden ayır.'],
  behindScenes: ['Bitmiş işten kısa bir kesit göster.', 'Işık, kamera ve hazırlık düzenini gerçek çekim sırasında anlat.', 'Ham görüntü ile son kurguyu karşılaştır; kullanılan yöntemi özetle.'],
  tartisma: ['Görüşünü tek bir sav olarak ifade et.', 'Lehte ve aleyhte birer gerekçe sun; kaynakları belirt.', 'Belirsizliği kabul ederek görüşünü toparla ve somut bir soru sor.'],
  mikroDram: ['Bölüm numarasını ve önceki çatışmayı kısa bir cümleyle hatırlat.', 'Karakterin hedefini zorlaştıran yeni bir olay göster.', 'Bu bölümde bir küçük sonucu çöz; sonraki bölüm için açık soru bırak.'],
  soru: ['Cevabı henüz vermeden net bir merak sorusu sor.', 'İki ipucu veya olası açıklamayı görsel örneklerle göster.', 'Kanıtlanan cevabı açıkla; bilgi yetersizse bunu belirt.'],
}

export function structureFor(format: string, topic: string, long = false): string[] {
  const steps = FORMAT_STRUCTURES[format] ?? FORMAT_STRUCTURES.ogretici
  const times = long ? ['0–5 sn', '5–45 sn', '45–60 sn'] : ['0–3 sn', '3–23 sn', '23–30 sn']
  return steps.map((step, index) => `${times[index]}: ${step}${index === 0 ? ` Konu: ${topic}.` : ''}`)
}
