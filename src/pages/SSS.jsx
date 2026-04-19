import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineChevronDown,
  HiOutlineChat,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './SSS.css'

const kategoriler = [
  { id: 'genel', label: 'Genel' },
  { id: 'fiyatlandirma', label: 'Fiyatlandırma' },
  { id: 'surecler', label: 'Süreçler' },
  { id: 'teknik', label: 'Teknik' },
  { id: 'sozlesme', label: 'Sözleşme' },
]

const sssVerisi = [
  {
    id: 1, kategori: 'genel',
    soru: 'Kade Media hangi hizmetleri sunuyor?',
    cevap: 'Kade Media; sosyal medya yönetimi, içerik üretimi, Meta & Google reklam yönetimi, video prodüksiyon, marka stratejisi ve web tasarımı hizmetleri sunmaktadır. Her hizmet için özel ekibimiz ve prova edilmiş süreçlerimiz mevcuttur.',
  },
  {
    id: 2, kategori: 'genel',
    soru: 'Kade Media ile çalışmaya nasıl başlayabilirim?',
    cevap: 'İletişim formumuzdan veya WhatsApp üzerinden bize ulaşabilirsiniz. İlk görüşmede ihtiyaçlarınızı dinleriz, ardından size özel bir teklif hazırlarız. Teklifin onaylanmasının ardından onboarding sürecini başlatırız ve genellikle 5-7 iş günü içinde projeniz aktif hale gelir.',
  },
  {
    id: 3, kategori: 'genel',
    soru: 'Hangi sektörlerde deneyiminiz var?',
    cevap: 'E-ticaret, restoran & café, klinik & sağlık, gayrimenkul, moda, eğitim, teknoloji ve hizmet sektörü başta olmak üzere 15\'ten fazla farklı sektörde müşteri portföyümüz bulunmaktadır. Her sektörün dinamiklerini bilen ekip üyelerimizle çalışıyoruz.',
  },
  {
    id: 4, kategori: 'genel',
    soru: 'Ekibiniz kaç kişiden oluşuyor?',
    cevap: 'Kade Media\'nın 10+ kişilik tam zamanlı ekibi; sosyal medya uzmanları, içerik yazarları, grafik tasarımcılar, video editörler, reklam uzmanları ve stratejistlerden oluşmaktadır. Projeleriniz, birden fazla uzmanın katkısıyla yürütülür.',
  },
  {
    id: 5, kategori: 'fiyatlandirma',
    soru: 'Hizmetlerinizin fiyatları nasıl belirleniyor?',
    cevap: 'Fiyatlandırmamız; seçilen hizmet paketi, içerik hacmi, platform sayısı ve reklam bütçesine göre belirlenir. Aylık sabit paketlerimiz (/paketler sayfasında detaylı) mevcuttur. Özel durumlar için ücretsiz teklif alabilirsiniz.',
  },
  {
    id: 6, kategori: 'fiyatlandirma',
    soru: 'Minimum çalışma süresi var mı?',
    cevap: 'Standart paketlerimiz 3 aylık minimum taahhüt gerektirmektedir. Bu süre, sosyal medya stratejisinin etkisini ölçmek ve içeriklerin hedef kitleye ulaşması için gereken minimum süredir. Proje bazlı çalışmalar (kampanya, video prodüksiyon vb.) için farklı koşullar geçerlidir.',
  },
  {
    id: 7, kategori: 'fiyatlandirma',
    soru: 'Reklam bütçesi paket fiyatına dahil mi?',
    cevap: 'Hayır. Reklam bütçesi (Meta Ads, Google Ads vb.) paket fiyatına dahil değildir; doğrudan sizin hesabınızdan Meta/Google\'a ödenir. Paket fiyatımız yalnızca reklam yönetimi hizmetini (kampanya kurulumu, optimizasyon, raporlama) kapsar.',
  },
  {
    id: 8, kategori: 'fiyatlandirma',
    soru: 'Ödeme nasıl yapılır?',
    cevap: 'Aylık hizmet bedeli her ayın başında peşin ödenir. Havale/EFT, kredi kartı veya kurumsal fatura ile ödeme kabul edilmektedir. Kurumsal faturalarda NET 10 vade uygulanabilmektedir.',
  },
  {
    id: 9, kategori: 'surecler',
    soru: 'İçerikler nasıl hazırlanıyor ve onaylattırılıyor?',
    cevap: 'Her ay sonunda takip eden aya ait içerik takvimi hazırlanır ve onayınıza sunulur. İçerikler yayınlanmadan 3-5 gün önce sizinle paylaşılır; düzenleme talep edebilirsiniz. Onay vermenizin ardından içerikler belirlenen saatte otomatik olarak yayınlanır.',
  },
  {
    id: 10, kategori: 'surecler',
    soru: 'Aylık raporlama yapılıyor mu?',
    cevap: 'Evet. Her ayın sonunda; takipçi büyümesi, erişim, etkileşim oranları, reklam performansı ve dönüşüm verilerini içeren detaylı aylık rapor hazırlanır. Rapora ek olarak kısa bir değerlendirme görüşmesi de yapılabilmektedir.',
  },
  {
    id: 11, kategori: 'surecler',
    soru: 'Proje başladıktan sonra ne kadar sürede ilk içerikler yayınlanır?',
    cevap: 'Onboarding sürecinin tamamlanmasının (marka brief, hesap erişimi, strateji onayı) ardından genellikle 5-7 iş günü içinde ilk içerikler hazır olur. İlk ay içerik takvimi onaylandıktan sonra yayın başlar.',
  },
  {
    id: 12, kategori: 'surecler',
    soru: 'Hesaplarıma nasıl erişim sağlıyorsunuz?',
    cevap: 'Instagram, Facebook ve TikTok hesaplarınıza sizin vereceğiniz izinler çerçevesinde Meta Business Suite üzerinden erişim sağlanır. Şifre paylaşımı asla talep edilmez; tüm erişimler geri alınabilir izin sistemiyle çalışır.',
  },
  {
    id: 13, kategori: 'teknik',
    soru: 'Hangi sosyal medya platformlarında çalışıyorsunuz?',
    cevap: 'Instagram, TikTok, Facebook, LinkedIn, YouTube ve Pinterest\'te aktif içerik yönetimi yapıyoruz. Her platforma özel format ve algoritma bilgisiyle içerik üretiyoruz.',
  },
  {
    id: 14, kategori: 'teknik',
    soru: 'Video prodüksiyon hizmeti nasıl işliyor?',
    cevap: 'Senaryo yazımı, çekim planlaması, çekim (stüdyo veya lokasyon), kurgu, renk düzeltme ve ses tasarımı dahil tam prodüksiyon hizmeti sunuyoruz. Çekim için İstanbul\'da stüdyomuz mevcuttur; lokasyon çekimleri de gerçekleştirebiliyoruz.',
  },
  {
    id: 15, kategori: 'teknik',
    soru: 'Chatbot ile gerçek bir temsilciye ulaşabilir miyim?',
    cevap: 'Site üzerindeki AI destekli chatbot sık sorulan sorulara anında yanıt verir. Daha detaylı görüşme için chatbot üzerinden veya WhatsApp/e-posta aracılığıyla ekibimize ulaşabilirsiniz. Çalışma saatlerimizde (H-C 09:00-18:00) ortalama 30 dakika içinde dönüş yapılmaktadır.',
  },
  {
    id: 16, kategori: 'sozlesme',
    soru: 'Sözleşmede neler yer alıyor?',
    cevap: 'Sözleşmemiz; sunulacak hizmetlerin detayı, teslimat tarihleri, ödeme koşulları, gizlilik hükümleri, fikri mülkiyet hakları ve fesih koşullarını kapsar. Tüm sözleşmeler 5651 sayılı Kanun ve KVKK kapsamında hazırlanır.',
  },
  {
    id: 17, kategori: 'sozlesme',
    soru: 'Hizmeti iptal etmek istersem ne yapmalıyım?',
    cevap: 'Devam eden ay için ödeme yapılmışsa o ay hizmet tamamlanır. Sonraki aylara ait fatura düzenlenmez. İptal bildirimi en az 15 gün önceden yazılı olarak yapılmalıdır. Tüm dosya ve içerikler teslim edilir.',
  },
  {
    id: 18, kategori: 'sozlesme',
    soru: 'Üretilen içerikler kime ait?',
    cevap: 'Hizmet bedeli ödendikten sonra üretilen tüm içerikler (metin, görsel, video) size aittir. Kade Media, yalnızca portföy amaçlı kullanım için önceden izin talep edebilir.',
  },
]

export default function SSS() {
  const { lang } = useLanguage()
  const [aktifKategori, setAktifKategori] = useState('genel')
  const [acikId, setAcikId] = useState(null)
  const [arama, setArama] = useState('')

  useSEO({
    title: 'Sık Sorulan Sorular | Kade Media',
    description: 'Sosyal medya yönetimi, fiyatlandırma, çalışma süreçleri ve sözleşme hakkında merak ettiğiniz her şey. Kade Media SSS sayfası.',
    keywords: 'sosyal medya ajansı sıkça sorulan sorular, dijital pazarlama fiyat, sosyal medya yönetim süreci',
    path: '/sss',
  })

  const filtreliSSSler = sssVerisi.filter(item => {
    const kategoriUygun = aktifKategori === 'hepsi' || item.kategori === aktifKategori
    const aramaUygun = arama === '' ||
      item.soru.toLowerCase().includes(arama.toLowerCase()) ||
      item.cevap.toLowerCase().includes(arama.toLowerCase())
    return kategoriUygun && aramaUygun
  })

  const toggleAcik = (id) => setAcikId(acikId === id ? null : id)

  return (
    <PageTransition>
      <FAQSchema items={sssVerisi} />
      <section className="sss-hero">
        <PageBgAnimation type="contact" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlineQuestionMarkCircle size={14} />
              Sıkça Sorulan Sorular
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title">
              Aklınızdaki <span>her soruyu</span> yanıtlıyoruz
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              Hizmetlerimiz, çalışma süreçlerimiz ve fiyatlandırma hakkında merak ettiğiniz her şey burada.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="sss-arama">
              <input
                type="text"
                placeholder="Soru ara..."
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
              {[{ id: 'hepsi', label: 'Tümü' }, ...kategoriler].map(k => (
                <button
                  key={k.id}
                  className={`sss-kategori-btn ${aktifKategori === k.id ? 'active' : ''}`}
                  onClick={() => { setAktifKategori(k.id); setArama('') }}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </FadeIn>

          <div className="sss-liste">
            {filtreliSSSler.length === 0 && (
              <FadeIn>
                <div className="sss-bos">
                  <HiOutlineQuestionMarkCircle size={40} />
                  <p>Bu kategoride soru bulunamadı. Başka bir şey arayın veya bize ulaşın.</p>
                  <Link to="/iletisim" className="btn btn-primary">Bize Yazın</Link>
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
                      <span>{item.soru}</span>
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
                          <p>{item.cevap}</p>
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
              <h3>Sorunuzu burada bulamadınız mı?</h3>
              <p>Ekibimiz size özel sorularınız için burada. Hemen iletişime geçin.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/iletisim" className="btn btn-primary">İletişime Geç</Link>
                <a href="https://wa.me/905067293423" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  WhatsApp ile Yaz
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
