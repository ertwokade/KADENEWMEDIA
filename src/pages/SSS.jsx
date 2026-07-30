import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineChevronDown, HiOutlineQuestionMarkCircle } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import { FAQ_ITEMS as ITEMS } from '../data/faq'
import useSiteContent from '../hooks/useSiteContent'
import { HOME_FAQ_DEFAULTS } from '../data/pageDefaults'
import './SSS.css'

export default function SSS() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(null)
  const { content: faqContent } = useSiteContent('faq', HOME_FAQ_DEFAULTS)

  useSEO({
    title: lang === 'tr' ? 'Dijital Pazarlama Sık Sorulan Sorular | Kade New Media' : 'FAQ | Kade New Media',
    description: lang === 'tr' ? 'Kade New Media’nın hizmetleri, teklif süreci, çalışma biçimi, teslimat ve iletişim adımları hakkında sık sorulan soruların yanıtlarını inceleyin.' : 'Frequently asked questions about Kade New Media services and proposals.',
    path: '/sss',
  })

  const dynamicItems = Array.isArray(faqContent?.[lang]) ? faqContent[lang] : []
  const displayItems = dynamicItems.length
    ? dynamicItems.map((item) => ({ soru: item.q, cevap: item.a }))
    : ITEMS.map((item) => ({
      soru: lang === 'tr' ? item.soru : item.soruEn,
      cevap: lang === 'tr' ? item.cevap : item.cevapEn,
    }))

  return (
    <PageTransition>
      <FAQSchema items={displayItems} />
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
            {displayItems.map((item, index) => {
              const panelId = `faq-panel-${index}`
              return (
                <div className={`sss-item glass-card ${open === index ? 'open' : ''}`} key={item.soru}>
                  <button className="sss-soru" onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={panelId}>
                    <span>{item.soru}</span><HiOutlineChevronDown size={20} aria-hidden="true" />
                  </button>
                  {open === index && <div className="sss-cevap" id={panelId}><p>{item.cevap}</p></div>}
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
