import {
  HiOutlineGlobe,
  HiOutlineChartBar,
  HiOutlineFilm,
  HiOutlineChatAlt2,
  HiOutlinePencilAlt,
  HiOutlineCode,
} from 'react-icons/hi'
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaLinkedinIn } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import PageTransition from '../components/PageTransition'
import {
  Container,
  Section,
  SectionHeading,
  PageHero,
  ServiceCard,
  Reveal,
} from '../components/system'
import './Services.css'

export default function Services() {
  const { t, lang } = useLanguage()
  const { content } = useSiteContent('services', { items: [] })
  useSEO({
    title: 'New Media ve Dijital Medya Hizmetleri | Kade New Media',
    description: 'Kade New Media’nın sosyal medya yönetimi, içerik üretimi, dijital reklam, video prodüksiyon, new media stratejisi ve web tasarımı hizmetleri.',
    keywords: 'new media, yeni medya, medya ajansı, dijital medya ajansı, sosyal medya ajansı hizmetleri, sosyal medya yönetimi istanbul, instagram ajansı, tiktok ajansı, içerik üretimi, meta reklam ajansı, google ads ajansı, video prodüksiyon, dijital ajans',
    path: '/hizmetler',
  })

  const baseServices = [
    {
      icon: HiOutlineGlobe,
      slug: 'sosyal-medya-yonetimi',
      title: t('services.smm'),
      desc: t('services.smmDesc'),
      features: [t('services.smmFeat1'), t('services.smmFeat2'), t('services.smmFeat3'), t('services.smmFeat4')],
      platforms: [FaInstagram, FaFacebookF, FaTiktok],
    },
    {
      icon: HiOutlinePencilAlt,
      slug: 'icerik-uretimi',
      title: t('services.contentTitle'),
      desc: t('services.contentDesc'),
      features: [t('services.contentFeat1'), t('services.contentFeat2'), t('services.contentFeat3'), t('services.contentFeat4')],
      platforms: [FaInstagram, FaTiktok, FaYoutube],
    },
    {
      icon: HiOutlineChartBar,
      slug: 'reklam-yonetimi',
      title: t('services.adsTitle'),
      desc: t('services.adsDesc'),
      features: [t('services.adsFeat1'), t('services.adsFeat2'), t('services.adsFeat3'), t('services.adsFeat4')],
      platforms: [FaFacebookF, FaInstagram, FaTiktok],
    },
    {
      icon: HiOutlineFilm,
      slug: 'video-produksiyon',
      title: t('services.videoTitle'),
      desc: t('services.videoDesc'),
      features: [t('services.videoFeat1'), t('services.videoFeat2'), t('services.videoFeat3'), t('services.videoFeat4')],
      platforms: [FaInstagram, FaTiktok, FaYoutube],
    },
    {
      icon: HiOutlineChatAlt2,
      slug: 'strateji-danismanlik',
      title: t('services.strategyTitle'),
      desc: t('services.strategyDesc'),
      features: [t('services.strategyFeat1'), t('services.strategyFeat2'), t('services.strategyFeat3'), t('services.strategyFeat4')],
      platforms: [FaLinkedinIn, FaInstagram, FaFacebookF],
    },
    {
      icon: HiOutlineCode,
      slug: 'web-sitesi-tasarimi',
      title: t('services.webTitle'),
      desc: t('services.webDesc'),
      features: [t('services.webFeat1'), t('services.webFeat2'), t('services.webFeat3'), t('services.webFeat4')],
      platforms: [FaInstagram, FaLinkedinIn],
    },
  ]
  const overrides = Array.isArray(content.items) ? content.items : []
  const services = baseServices.map((service, index) => {
    const custom = overrides.find((item) => item?.slug === service.slug) || overrides[index] || {}
    const featureValue = lang === 'en' ? custom.featuresEn : custom.featuresTr
    const customFeatures = Array.isArray(featureValue)
      ? featureValue.filter(Boolean)
      : String(featureValue || '').split(',').map((item) => item.trim()).filter(Boolean)
    return {
      ...service,
      title: (lang === 'en' ? custom.titleEn : custom.titleTr) || service.title,
      desc: (lang === 'en' ? custom.descEn : custom.descTr) || service.desc,
      features: customFeatures.length ? customFeatures : service.features,
    }
  })

  const process = [
    { step: '01', title: t('services.processStep1'), desc: t('services.processStep1Desc') },
    { step: '02', title: t('services.processStep2'), desc: t('services.processStep2Desc') },
    { step: '03', title: t('services.processStep3'), desc: t('services.processStep3Desc') },
    { step: '04', title: t('services.processStep4'), desc: t('services.processStep4Desc') },
  ]

  return (
    <PageTransition>
      {/* Hero — ana sayfayla aynı PageHero bileşeni: aynı başlık ölçeği,
          aynı eyebrow, aynı boşluk ritmi, aynı reveal gecikmeleri. */}
      <PageHero
        eyebrow={t('services.badge')}
        title={`${t('services.title')} ${t('services.titleHighlight')} ${t('services.titleEnd')}`.replace(/\s+/g, ' ').trim()}
        lead={t('services.subtitle')}
        meta={[['Hizmet', String(services.length)]]}
      />

      <Section flushTop>
        <Container>
          <div className="kade-grid kade-grid--2">
            {services.map((service, index) => (
              <Reveal key={service.slug} delay={Math.min(index, 5) * 70}>
                <ServiceCard
                  index={index}
                  service={{
                    to: `/hizmetler/${service.slug}`,
                    title: service.title,
                    description: service.desc,
                    features: service.features,
                    meta: service.platforms.map((Platform, i) => (
                      <Platform key={i} size={15} aria-hidden="true" />
                    )),
                  }}
                />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="process-section">
        <Container>
          <SectionHeading
            eyebrow={t('services.processBadge')}
            title={`${t('services.processTitle')} ${t('services.processHighlight')}?`}
            description={t('services.processSubtitle')}
            index={`0${process.length}`}
          />

          <div className="process-grid">
            {process.map((item, index) => (
              <Reveal key={item.step} delay={index * 90}>
                <div className="process-card">
                  <div className="process-step">{item.step}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </PageTransition>
  )
}
