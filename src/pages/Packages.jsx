import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineArrowRight, HiOutlineCheck, HiOutlineSparkles } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import { PACKAGE_SCOPES, PACKAGE_FAQS as FAQS } from '../data/packages'
import './Packages.css'

export default function Packages() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  // Paket adı/açıklaması/özellikleri sabit kürate içerik; sadece fiyat admin
  // panelinden geliyor. API erişilemezse (veya hiç fiyat girilmemişse) sayfa
  // sessizce fiyatsız haline döner — kırık bir görünüm oluşmaz.
  const [prices, setPrices] = useState({})

  useEffect(() => {
    let cancelled = false
    getContentApi('packages')
      .then((res) => {
        if (cancelled || !res?.data?.items) return
        const map = {}
        for (const item of res.data.items) {
          if (item?.id) map[item.id] = item
        }
        setPrices(map)
      })
      .catch(() => { /* statik, fiyatsız görünümde kal */ })
    return () => { cancelled = true }
  }, [])

  useSEO({
    title: isEN ? 'Service Packages | Kade New Media' : 'Sosyal Medya Hizmet Kapsamları | Kade New Media',
    description: isEN
      ? 'Review Kade New Media service scopes and request a written quote tailored to your needs.'
      : 'Düzenli içerik, reklam yönetimi ve proje bazlı prodüksiyon ihtiyaçlarına göre şekillenen Kade New Media hizmet kapsamlarını inceleyin.',
    path: '/paketler',
  })

  return (
    <PageTransition>
      <FAQSchema items={FAQS.map(({ tr, en }) => ({ soru: tr[0], cevap: tr[1], soruEn: en[0], cevapEn: en[1] }))} />
      <section className="packages-hero">
        <PageBgAnimation type="packages" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', left: '-150px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge"><HiOutlineSparkles size={14} />{isEN ? 'Service scopes' : 'Hizmet kapsamları'}</div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {isEN ? <>Choose the <span>right scope</span></> : <>İhtiyacınıza uygun <span>kapsamı seçin</span></>}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">
              {isEN
                ? 'Packages describe the working scope. Final fees, taxes, media spend, and additional costs are confirmed in the written quote.'
                : 'Paketler çalışma kapsamını tanımlar. Nihai ücret, KDV, reklam bütçesi ve ek maliyetler yazılı teklifte netleştirilir.'}
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StaggerContainer className="packages-grid" staggerDelay={0.12}>
            {PACKAGE_SCOPES.map((pkg) => {
              const name = isEN ? pkg.nameEn : pkg.nameTr
              const features = isEN ? pkg.featuresEn : pkg.featuresTr
              const price = prices[pkg.id]
              const hasPrice = Boolean(price?.priceTRY || price?.priceUSD)
              return (
                <StaggerItem key={pkg.id}>
                  <motion.article className="package-card glass-card pkg-v2" whileHover={{ y: -4 }}>
                    <div className="pkg-tag">{isEN ? 'Scope' : 'Kapsam'}</div>
                    <h2 className="pkg-name">{name}</h2>
                    {hasPrice && (
                      <div className="pkg-price">
                        {price.priceTRY && <span className="pkg-price-amount">{price.priceTRY} ₺</span>}
                        {price.priceUSD && <span className="pkg-price-amount pkg-price-secondary">${price.priceUSD}</span>}
                        {price.priceNote && <span className="pkg-price-note">{price.priceNote}</span>}
                      </div>
                    )}
                    <p className="package-desc">{isEN ? pkg.descEn : pkg.descTr}</p>
                    <div className="package-features">
                      {features.map((feature) => (
                        <div key={feature} className="feature-item included"><HiOutlineCheck size={15} /><span>{feature}</span></div>
                      ))}
                    </div>
                    <Link
                      to={`/teklif-al?paket=${pkg.id}`}
                      className="btn btn-outline package-btn"
                      aria-label={`${name} ${isEN ? 'scope quote' : 'kapsamı için teklif al'}`}
                    >
                      {isEN ? 'Request a quote' : 'Teklif al'} <HiOutlineArrowRight size={16} />
                    </Link>
                  </motion.article>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container">
          <div className="section-header"><h2 className="section-title">{isEN ? 'Clear ' : 'Net '}<span>{isEN ? 'terms' : 'koşullar'}</span></h2></div>
          <div className="faq-grid">
            {FAQS.map((faq) => {
              const [question, answer] = isEN ? faq.en : faq.tr
              return <article className="faq-card glass-card" key={question}><h3>{question}</h3><p>{answer}</p></article>
            })}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
