// Single source of truth for the SSS (FAQ) content — used by the live SSS page
// and by scripts/generate-static-routes.mjs to prerender real Q&A text and
// FAQPage structured data for crawlers that don't execute JavaScript.
export const FAQ_ITEMS = [
  {
    soru: 'Kade New Media hangi hizmetleri sunuyor?',
    cevap: 'Sosyal medya yönetimi, içerik üretimi, reklam yönetimi, video prodüksiyon, strateji danışmanlığı ve web sitesi tasarımı için kapsam oluşturuyoruz.',
    soruEn: 'What services does Kade New Media offer?',
    cevapEn: 'We scope social media management, content production, ad management, video production, strategy consulting, and website design services.',
  },
  {
    soru: 'Çalışmaya nasıl başlayabilirim?',
    cevap: 'İletişim veya teklif formunda ihtiyacınızı paylaşabilirsiniz. Kapsam, teslimatlar, takvim ve ticari koşullar karşılıklı onaylanan yazılı teklifte netleşir.',
    soruEn: 'How can I get started?',
    cevapEn: 'Share your needs through the contact or proposal form. Scope, deliverables, timing, and commercial terms are finalized in a mutually approved written proposal.',
  },
  {
    soru: 'Fiyatlar nasıl belirleniyor?',
    cevap: 'Fiyat; hizmet kapsamı, içerik hacmi, platform sayısı, prodüksiyon gereksinimi ve takvime göre belirlenir. Reklam bütçesi, vergiler ve ek masraflar yazılı teklifte ayrı ayrı belirtilir.',
    soruEn: 'How is pricing determined?',
    cevapEn: 'Pricing depends on scope, content volume, platforms, production needs, and schedule. Ad spend, taxes, and additional costs are itemized in the written proposal.',
  },
  {
    soru: 'Reklam bütçesi hizmet bedeline dahil mi?',
    cevap: 'Varsayılan olarak dahil değildir. Medya bütçesi ve yönetim hizmeti teklifte ayrı kalemler olarak gösterilir.',
    soruEn: 'Is ad spend included in the service fee?',
    cevapEn: 'Not by default. Media spend and management services are shown as separate items in the proposal.',
  },
  {
    soru: 'Hesap erişimleri nasıl yönetiliyor?',
    cevap: 'Mümkün olan platformlarda rol tabanlı ve geri alınabilir erişim tercih edilir. Parola paylaşımı yerine platformların resmi yetkilendirme yöntemleri kullanılır.',
    soruEn: 'How is account access managed?',
    cevapEn: 'Role-based, revocable access is preferred where supported. Official platform authorization methods are used instead of sharing passwords.',
  },
  {
    soru: 'İçerik ve portföy kullanım hakları nasıl belirleniyor?',
    cevap: 'Teslim, kullanım ve portföyde yayınlama hakları proje sözleşmesinde açıkça tanımlanır. Müşteri adı veya çalışması izinsiz referans olarak yayınlanmaz.',
    soruEn: 'How are content and portfolio rights handled?',
    cevapEn: 'Delivery, usage, and portfolio publication rights are defined in the project agreement. Client names or work are not published as references without permission.',
  },
]
