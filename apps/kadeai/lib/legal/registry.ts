/**
 * Türkiye'de faaliyet gösteren, abonelikli dijital hizmet satan bir ürün için
 * §5'te sayılan yasal metin listesi.
 *
 * Bu dosya METİN İÇERMEZ — yalnızca hangi belgelerin gerekli olduğunu,
 * nereden servis edildiğini ve ödeme öncesi açık onay gerektirip
 * gerektirmediğini tanımlar. Metinler yetkili hukuk danışmanı tarafından
 * hazırlanır ve admin panelinden yayınlanır.
 */

export interface LegalDocumentSpec {
  slug: string
  title: string
  /** Ödeme öncesi açık onay kutusu gerektirir mi? */
  checkoutConsent: boolean
  /** Neden gerekli — hukuki tavsiye değil, kapsam notu. */
  scope: string
  /** Ana sitede zaten yayında olan metnin yolu (varsa). */
  existingPath?: string
}

export const LEGAL_DOCUMENTS: readonly LegalDocumentSpec[] = [
  { slug: 'kvkk-aydinlatma', title: 'KVKK Aydınlatma Metni', checkoutConsent: false, scope: 'Kişisel veri işleme faaliyetleri', existingPath: '/kvkk' },
  { slug: 'gizlilik-politikasi', title: 'Gizlilik Politikası', checkoutConsent: false, scope: 'Veri toplama, saklama ve paylaşım', existingPath: '/gizlilik' },
  { slug: 'cerez-politikasi', title: 'Çerez Politikası', checkoutConsent: false, scope: 'Çerez ve benzeri teknolojiler', existingPath: '/cerez-politikasi' },
  { slug: 'fikri-mulkiyet', title: 'Fikri Mülkiyet Politikası', checkoutConsent: false, scope: 'Telif ve marka hakları', existingPath: '/telif-haklari' },

  { slug: 'kullanim-kosullari', title: 'Kullanım Koşulları', checkoutConsent: false, scope: 'Hizmetin genel kullanım kuralları' },
  { slug: 'uyelik-sozlesmesi', title: 'Üyelik Sözleşmesi', checkoutConsent: false, scope: 'Hesap oluşturma ve kullanıcı yükümlülükleri' },
  { slug: 'mesafeli-satis', title: 'Mesafeli Satış Sözleşmesi', checkoutConsent: true, scope: 'Uzaktan satış; ödeme öncesi onay gerekir' },
  { slug: 'on-bilgilendirme', title: 'Ön Bilgilendirme Formu', checkoutConsent: true, scope: 'Ödeme öncesi zorunlu bilgilendirme' },
  { slug: 'iade-iptal', title: 'İade ve İptal Politikası', checkoutConsent: true, scope: 'Cayma hakkı ve anında ifa edilen dijital hizmet istisnası' },
  { slug: 'dijital-hizmet-sartlari', title: 'Dijital Hizmet Şartları', checkoutConsent: false, scope: 'Abonelik, otomatik yenileme ve hizmet seviyesi' },
  { slug: 'ticari-elektronik-ileti', title: 'Ticari Elektronik İleti Açıklaması', checkoutConsent: false, scope: 'İYS/ETK kapsamındaki iletiler' },
  { slug: 'api-kullanim-sartlari', title: 'API Kullanım Şartları', checkoutConsent: false, scope: 'API erişimi, kota ve kötüye kullanım' },
  { slug: 'ai-kullanim-sartlari', title: 'AI Kullanım Şartları', checkoutConsent: false, scope: 'Üretilen içeriğin sorumluluğu, üçüncü taraf sağlayıcılar, BYOK' },
] as const

export const LEGAL_SLUGS = LEGAL_DOCUMENTS.map((document) => document.slug)

export function getLegalSpec(slug: string): LegalDocumentSpec | undefined {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug)
}

/** Ödeme öncesi onay gerektirmesi BEKLENEN belgeler (yayınlanmış olmaları ayrı). */
export function checkoutConsentSlugs(): string[] {
  return LEGAL_DOCUMENTS.filter((document) => document.checkoutConsent).map((document) => document.slug)
}
