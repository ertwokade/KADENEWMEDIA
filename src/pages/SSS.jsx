import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChevronDown, HiOutlineQuestionMarkCircle } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import './SSS.css'

const ITEMS = [
  {
    soru: 'Kade Media hangi hizmetleri sunuyor?',
    cevap: 'Sosyal medya yönetimi, içerik üretimi, reklam yönetimi, video prodüksiyon, strateji danışmanlığı ve web sitesi tasarımı için kapsam oluşturuyoruz.',
    soruEn: 'What services does Kade Media offer?',
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

export default function SSS() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(null)

  useSEO({
    title: lang === 'tr' ? 'Dijital Pazarlama Sık Sorulan Sorular | Kade Media' : 'FAQ | Kade Media',
    description: lang === 'tr' ? 'Kade Media’nın hizmetleri, teklif süreci, çalışma biçimi, teslimat ve iletişim adımları hakkında sık sorulan soruların yanıtlarını inceleyin.' : 'Frequently asked questions about Kade Media services and proposals.',
    path: '/sss',
  })

  const questionKey = lang === 'tr' ? 'soru' : 'soruEn'
  const answerKey = lang === 'tr' ? 'cevap' : 'cevapEn'

  return (
    <PageTransition>
      <FAQSchema items={ITEMS} />
      <section className="sss-hero">
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineQuestionMarkCircle size={14} /> {lang === 'tr' ? 'Sık Sorulan Sorular' : 'FAQ'}</div>
            <h1 className="section-title">{lang === 'tr' ? <>Net yanıtlar, <span>yazılı koşullar</span></> : <>Clear answers, <span>written terms</span></>}</h1>
            <p className="section-subtitle">{lang === 'tr' ? 'Bağlayıcı kapsam ve fiyat her zaman size gönderilen yazılı teklifte yer alır.' : 'Binding scope and pricing always appear in your written proposal.'}</p>
          </FadeIn>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="sss-liste">
            {ITEMS.map((item, index) => {
              const panelId = `faq-panel-${index}`
              return (
                <div className={`sss-item glass-card ${open === index ? 'open' : ''}`} key={item.soru}>
                  <button className="sss-soru" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={panelId}>
                    <span>{item[questionKey]}</span><HiOutlineChevronDown size={20} aria-hidden="true" />
                  </button>
                  {open === index && <div className="sss-cevap" id={panelId}><p>{item[answerKey]}</p></div>}
                </div>
              )
            })}
          </div>
          <div className="sss-cta glass-card">
            <h2>{lang === 'tr' ? 'Başka bir sorunuz mu var?' : 'Have another question?'}</h2>
            <Link to="/iletisim" className="btn btn-primary">{lang === 'tr' ? 'Bize yazın' : 'Contact us'}</Link>
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
