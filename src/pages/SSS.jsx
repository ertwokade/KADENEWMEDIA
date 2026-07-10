import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronDown,
  HiOutlineChat,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './SSS.css'

const kategoriler = [
  { id: 'genel', label: 'Genel', labelEn: 'General' },
  { id: 'fiyatlandirma', label: 'Fiyatlandırma', labelEn: 'Pricing' },
  { id: 'surecler', label: 'Süreçler', labelEn: 'Processes' },
  { id: 'teknik', label: 'Teknik', labelEn: 'Technical' },
  { id: 'sozlesme', label: 'Sözleşme', labelEn: 'Contract' },
]

const sssVerisi = [
  {
    id: 1, kategori: 'genel',
    soru: 'Kade Media hangi hizmetleri sunuyor?',
    cevap: 'Kade Media; sosyal medya yönetimi, içerik üretimi, Meta & Google reklam yönetimi, video prodüksiyon, marka stratejisi ve web tasarımı hizmetleri sunmaktadır. Her hizmet için özel ekibimiz ve prova edilmiş süreçlerimiz mevcuttur.',
    soruEn: 'What services does Kade Media offer?',
    cevapEn: 'Kade Media offers social media management, content production, Meta & Google ad management, video production, brand strategy, and web design. We have dedicated teams and proven processes for each service.',
  },
  {
    id: 2, kategori: 'genel',
    soru: 'Kade Media ile çalışmaya nasıl başlayabilirim?',
    cevap: 'İletişim formumuzdan veya WhatsApp üzerinden bize ulaşabilirsiniz. İlk görüşmede ihtiyaçlarınızı dinleriz, ardından size özel bir teklif hazırlarız. Teklifin onaylanmasının ardından onboarding sürecini başlatırız ve genellikle 5-7 iş günü içinde projeniz aktif hale gelir.',
    soruEn: 'How do I get started with Kade Media?',
    cevapEn: 'You can reach us via the contact form or WhatsApp. In the first meeting, we listen to your needs and then prepare a custom proposal. After approval, we start onboarding and your project typically goes live within 5-7 business days.',
  },
  {
    id: 3, kategori: 'genel',
    soru: 'Hangi sektörlerde deneyiminiz var?',
    cevap: 'E-ticaret, restoran & café, klinik & sağlık, gayrimenkul, moda, eğitim, teknoloji ve hizmet sektörü başta olmak üzere 15\'ten fazla farklı sektörde müşteri portföyümüz bulunmaktadır. Her sektörün dinamiklerini bilen ekip üyelerimizle çalışıyoruz.',
    soruEn: 'Which industries do you have experience in?',
    cevapEn: 'We have a client portfolio spanning more than 15 industries, including e-commerce, restaurants & cafés, clinics & healthcare, real estate, fashion, education, technology, and service businesses. Our team members understand the dynamics of each sector.',
  },
  {
    id: 4, kategori: 'genel',
    soru: 'Ekibiniz kaç kişiden oluşuyor?',
    cevap: 'Kade Media\'nın ekibi; sosyal medya uzmanları, içerik yazarları, grafik tasarımcılar, video editörler, reklam uzmanları ve stratejistlerden oluşmaktadır. Projeleriniz, birden fazla uzmanın katkısıyla yürütülür.',
    soruEn: 'Who makes up your team?',
    cevapEn: 'The Kade Media team consists of social media specialists, content writers, graphic designers, video editors, ad managers, and strategists. Your projects are executed with the combined expertise of multiple specialists.',
  },
  {
    id: 5, kategori: 'fiyatlandirma',
    soru: 'Hizmetlerinizin fiyatları nasıl belirleniyor?',
    cevap: 'Fiyatlandırmamız; seçilen hizmet paketi, içerik hacmi, platform sayısı ve reklam bütçesine göre belirlenir. Aylık sabit paketlerimiz (/paketler sayfasında detaylı) mevcuttur. Özel durumlar için ücretsiz teklif alabilirsiniz.',
    soruEn: 'How are your service prices determined?',
    cevapEn: 'Our pricing is based on the selected service package, content volume, number of platforms, and ad budget. We offer fixed monthly packages (details on the /packages page). You can also request a free custom quote.',
  },
  {
    id: 6, kategori: 'fiyatlandirma',
    soru: 'Minimum çalışma süresi var mı?',
    cevap: 'Standart paketlerimiz 3 aylık minimum taahhüt gerektirmektedir. Bu süre, sosyal medya stratejisinin etkisini ölçmek ve içeriklerin hedef kitleye ulaşması için gereken minimum süredir. Proje bazlı çalışmalar (kampanya, video prodüksiyon vb.) için farklı koşullar geçerlidir.',
    soruEn: 'Is there a minimum contract period?',
    cevapEn: 'Our standard packages require a minimum 3-month commitment. This is the minimum time needed to measure the impact of a social media strategy. Different terms apply for project-based work (campaigns, video production, etc.).',
  },
  {
    id: 7, kategori: 'fiyatlandirma',
    soru: 'Reklam bütçesi paket fiyatına dahil mi?',
    cevap: 'Hayır. Reklam bütçesi (Meta Ads, Google Ads vb.) paket fiyatına dahil değildir; doğrudan sizin hesabınızdan Meta/Google\'a ödenir. Paket fiyatımız yalnızca reklam yönetimi hizmetini (kampanya kurulumu, optimizasyon, raporlama) kapsar.',
    soruEn: 'Is the ad budget included in the package price?',
    cevapEn: 'No. The ad budget (Meta Ads, Google Ads, etc.) is not included in the package price; it is paid directly from your account to Meta/Google. Our package price covers only the ad management service (campaign setup, optimization, reporting).',
  },
  {
    id: 8, kategori: 'fiyatlandirma',
    soru: 'Ödeme nasıl yapılır?',
    cevap: 'Aylık hizmet bedeli her ayın başında peşin ödenir. Havale/EFT, kredi kartı veya kurumsal fatura ile ödeme kabul edilmektedir. Kurumsal faturalarda NET 10 vade uygulanabilmektedir.',
    soruEn: 'How does payment work?',
    cevapEn: 'The monthly service fee is paid in advance at the beginning of each month. We accept bank transfer, credit card, or corporate invoice. NET 10 terms can be applied for corporate invoicing.',
  },
  {
    id: 9, kategori: 'surecler',
    soru: 'İçerikler nasıl hazırlanıyor ve onaylattırılıyor?',
    cevap: 'Her ay sonunda takip eden aya ait içerik takvimi hazırlanır ve onayınıza sunulur. İçerikler yayınlanmadan 3-5 gün önce sizinle paylaşılır; düzenleme talep edebilirsiniz. Onay vermenizin ardından içerikler belirlenen saatte otomatik olarak yayınlanır.',
    soruEn: 'How is content prepared and approved?',
    cevapEn: 'At the end of each month, a content calendar for the following month is prepared and submitted for your approval. Content is shared with you 3-5 days before publishing — you can request edits. Once approved, content is automatically published at the scheduled time.',
  },
  {
    id: 10, kategori: 'surecler',
    soru: 'Aylık raporlama yapılıyor mu?',
    cevap: 'Evet. Her ayın sonunda; takipçi büyümesi, erişim, etkileşim oranları, reklam performansı ve dönüşüm verilerini içeren detaylı aylık rapor hazırlanır. Rapora ek olarak kısa bir değerlendirme görüşmesi de yapılabilmektedir.',
    soruEn: 'Do you provide monthly reporting?',
    cevapEn: 'Yes. At the end of each month, a detailed report is prepared covering follower growth, reach, engagement rates, ad performance, and conversion data. A brief review meeting can also be scheduled alongside the report.',
  },
  {
    id: 11, kategori: 'surecler',
    soru: 'Proje başladıktan sonra ne kadar sürede ilk içerikler yayınlanır?',
    cevap: 'Onboarding sürecinin tamamlanmasının (marka brief, hesap erişimi, strateji onayı) ardından genellikle 5-7 iş günü içinde ilk içerikler hazır olur. İlk ay içerik takvimi onaylandıktan sonra yayın başlar.',
    soruEn: 'How soon after starting will the first content go live?',
    cevapEn: 'After completing the onboarding process (brand brief, account access, strategy approval), the first content is typically ready within 5-7 business days. Publishing begins after the first month\'s content calendar is approved.',
  },
  {
    id: 12, kategori: 'surecler',
    soru: 'Hesaplarıma nasıl erişim sağlıyorsunuz?',
    cevap: 'Instagram, Facebook ve TikTok hesaplarınıza sizin vereceğiniz izinler çerçevesinde Meta Business Suite üzerinden erişim sağlanır. Şifre paylaşımı asla talep edilmez; tüm erişimler geri alınabilir izin sistemiyle çalışır.',
    soruEn: 'How do you access my accounts?',
    cevapEn: 'Access to your Instagram, Facebook, and TikTok accounts is granted through Meta Business Suite using permissions you control. We never request your passwords; all access works through a revocable permission system.',
  },
  {
    id: 13, kategori: 'teknik',
    soru: 'Hangi sosyal medya platformlarında çalışıyorsunuz?',
    cevap: 'Instagram, TikTok, Facebook, LinkedIn, YouTube ve Pinterest\'te aktif içerik yönetimi yapıyoruz. Her platforma özel format ve algoritma bilgisiyle içerik üretiyoruz.',
    soruEn: 'Which social media platforms do you work with?',
    cevapEn: 'We actively manage content on Instagram, TikTok, Facebook, LinkedIn, YouTube, and Pinterest. We produce content with platform-specific formatting and algorithm knowledge for each.',
  },
  {
    id: 14, kategori: 'teknik',
    soru: 'Video prodüksiyon hizmeti nasıl işliyor?',
    cevap: 'Senaryo yazımı, çekim planlaması, çekim (stüdyo veya lokasyon), kurgu, renk düzeltme ve ses tasarımı dahil tam prodüksiyon hizmeti sunuyoruz. Çekim için İstanbul\'da stüdyomuz mevcuttur; lokasyon çekimleri de gerçekleştirebiliyoruz.',
    soruEn: 'How does the video production service work?',
    cevapEn: 'We offer full production services including scriptwriting, shoot planning, filming (studio or on-location), editing, color grading, and sound design. We have a studio in Istanbul and can also handle location shoots.',
  },
  {
    id: 15, kategori: 'teknik',
    soru: 'Chatbot ile gerçek bir temsilciye ulaşabilir miyim?',
    cevap: 'Site üzerindeki AI destekli chatbot sık sorulan sorulara anında yanıt verir. Daha detaylı görüşme için chatbot üzerinden veya WhatsApp/e-posta aracılığıyla ekibimize ulaşabilirsiniz. Çalışma saatlerimizde (H-C 09:00-18:00) ortalama 30 dakika içinde dönüş yapılmaktadır.',
    soruEn: 'Can I reach a real person through the chatbot?',
    cevapEn: 'The AI-powered chatbot on the site instantly answers frequently asked questions. For a more detailed conversation, you can reach our team through the chatbot or via WhatsApp/email. During business hours (Mon–Fri 09:00–18:00) we typically respond within 30 minutes.',
  },
  {
    id: 16, kategori: 'sozlesme',
    soru: 'Sözleşmede neler yer alıyor?',
    cevap: 'Sözleşmemiz; sunulacak hizmetlerin detayı, teslimat tarihleri, ödeme koşulları, gizlilik hükümleri, fikri mülkiyet hakları ve fesih koşullarını kapsar. Tüm sözleşmeler 5651 sayılı Kanun ve KVKK kapsamında hazırlanır.',
    soruEn: 'What does the contract include?',
    cevapEn: 'Our contract covers service details, delivery timelines, payment terms, confidentiality clauses, intellectual property rights, and termination conditions. All contracts are prepared in compliance with applicable Turkish law and GDPR-equivalent regulations.',
  },
  {
    id: 17, kategori: 'sozlesme',
    soru: 'Hizmeti iptal etmek istersem ne yapmalıyım?',
    cevap: 'Devam eden ay için ödeme yapılmışsa o ay hizmet tamamlanır. Sonraki aylara ait fatura düzenlenmez. İptal bildirimi en az 15 gün önceden yazılı olarak yapılmalıdır. Tüm dosya ve içerikler teslim edilir.',
    soruEn: 'What should I do if I want to cancel the service?',
    cevapEn: 'If payment has been made for the current month, service continues through the end of that month. No invoices are issued for subsequent months. Cancellation notice must be submitted in writing at least 15 days in advance. All files and content are delivered to you.',
  },
  {
    id: 18, kategori: 'sozlesme',
    soru: 'Üretilen içerikler kime ait?',
    cevap: 'Hizmet bedeli ödendikten sonra üretilen tüm içerikler (metin, görsel, video) size aittir. Kade Media, yalnızca portföy amaçlı kullanım için önceden izin talep edebilir.',
    soruEn: 'Who owns the content produced?',
    cevapEn: 'All content produced (text, visuals, video) belongs to you once the service fee is paid. Kade Media may request prior permission only for portfolio use.',
  },
]

export default function SSS() {
  const { lang } = useLanguage()
  const [aktifKategori, setAktifKategori] = useState('genel')
  const [acikId, setAcikId] = useState(null)
  const [arama, setArama] = useState('')
  const [sssItems, setSssItems] = useState(sssVerisi)

  useSEO({
    title: lang === 'tr' ? 'Sık Sorulan Sorular | Kade Media' : 'FAQ | Kade Media',
    description: lang === 'tr'
      ? 'Sosyal medya yönetimi, fiyatlandırma, çalışma süreçleri ve sözleşme hakkında merak ettiğiniz her şey. Kade Media SSS sayfası.'
      : 'Everything you need to know about social media management, pricing, processes, and contracts. Kade Media FAQ.',
    keywords: 'sosyal medya ajansı sıkça sorulan sorular, dijital pazarlama fiyat, sosyal medya yönetim süreci',
    path: '/sss',
  })

  const soruKey = lang === 'tr' ? 'soru' : 'soruEn'
  const cevapKey = lang === 'tr' ? 'cevap' : 'cevapEn'

  useEffect(() => {
    let alive = true
    getContentApi('faq')
      .then(res => {
        if (!alive) return
        const data = res?.data || res
        const tr = Array.isArray(data?.tr) ? data.tr : []
        const en = Array.isArray(data?.en) ? data.en : []
        const max = Math.max(tr.length, en.length)
        if (!max) return

        const normalized = Array.from({ length: max }, (_, i) => {
          const trItem = tr[i] || {}
          const enItem = en[i] || {}
          return {
            id: `admin-${i}`,
            kategori: trItem.kategori || enItem.kategori || 'genel',
            soru: trItem.q || enItem.q || '',
            cevap: trItem.a || enItem.a || '',
            soruEn: enItem.q || trItem.q || '',
            cevapEn: enItem.a || trItem.a || '',
          }
        }).filter(item => item.soru || item.soruEn)

        if (normalized.length) {
          setSssItems(normalized)
          setAktifKategori('hepsi')
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const filtreliSSSler = sssItems.filter(item => {
    const kategoriUygun = aktifKategori === 'hepsi' || item.kategori === aktifKategori
    const aramaUygun = arama === '' ||
      item[soruKey].toLowerCase().includes(arama.toLowerCase()) ||
      item[cevapKey].toLowerCase().includes(arama.toLowerCase())
    return kategoriUygun && aramaUygun
  })

  const toggleAcik = (id) => setAcikId(acikId === id ? null : id)

  return (
    <PageTransition>
      <FAQSchema items={sssItems} />
      <section className="sss-hero">
        <PageBgAnimation type="contact" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineQuestionMarkCircle size={14} />
              {lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'Frequently Asked Questions'}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              {lang === 'tr'
                ? <>Aklınızdaki <span>her soruyu</span> yanıtlıyoruz</>
                : <>We answer <span>every question</span> you have</>}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {lang === 'tr'
                ? 'Hizmetlerimiz, çalışma süreçlerimiz ve fiyatlandırma hakkında merak ettiğiniz her şey burada.'
                : 'Everything you want to know about our services, processes, and pricing — right here.'}
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="sss-arama">
              <input
                type="text"
                placeholder={lang === 'tr' ? 'Soru ara...' : 'Search questions...'}
                value={arama}
                onChange={(e) => { setArama(e.target.value); setAktifKategori('hepsi') }}
                className="sss-arama-input"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="sss-kategoriler">
              {[{ id: 'hepsi', label: 'Tümü', labelEn: 'All' }, ...kategoriler].map(k => (
                <button
                  key={k.id}
                  className={`sss-kategori-btn ${aktifKategori === k.id ? 'active' : ''}`}
                  onClick={() => { setAktifKategori(k.id); setArama('') }}
                >
                  {lang === 'tr' ? k.label : (k.labelEn || k.label)}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="sss-liste">
            {filtreliSSSler.length === 0 && (
              <FadeIn>
                <div className="sss-bos">
                  <HiOutlineQuestionMarkCircle size={40} />
                  <p>{lang === 'tr' ? 'Bu kategoride soru bulunamadı. Başka bir şey arayın veya bize ulaşın.' : 'No questions found in this category. Try a different search or contact us.'}</p>
                  <Link to="/iletisim" className="btn btn-primary">{lang === 'tr' ? 'Bize Yazın' : 'Contact Us'}</Link>
                </div>
              </FadeIn>
            )}
            <StaggerContainer>
              {filtreliSSSler.map((item) => (
                <StaggerItem key={item.id}>
                  <div className={`sss-item glass-card ${acikId === item.id ? 'open' : ''}`}>
                    <button
                      className="sss-soru"
                      onClick={() => toggleAcik(item.id)}
                      aria-expanded={acikId === item.id}
                    >
                      <span>{item[soruKey]}</span>
                      <motion.div
                        animate={{ rotate: acikId === item.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HiOutlineChevronDown size={20} />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {acikId === item.id && (
                        <motion.div
                          className="sss-cevap"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <p>{item[cevapKey]}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <FadeIn delay={0.3}>
            <div className="sss-cta glass-card">
              <HiOutlineChat size={32} />
              <h3>{lang === 'tr' ? 'Sorunuzu burada bulamadınız mı?' : "Couldn't find your question here?"}</h3>
              <p>{lang === 'tr' ? 'Ekibimiz size özel sorularınız için burada. Hemen iletişime geçin.' : 'Our team is here for your specific questions. Get in touch now.'}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">{lang === 'tr' ? 'İletişime Geç' : 'Contact Us'}</Link>
                <a href="https://wa.me/905067293423" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  {lang === 'tr' ? 'WhatsApp ile Yaz' : 'Message on WhatsApp'}
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
