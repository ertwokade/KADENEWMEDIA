import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import { SERVICE_DETAILS, SERVICE_SLUGS } from '../data/serviceDetails'
import { mergeDefined } from '../utils/mergeDefined'
import PageTransition from '../components/PageTransition'
import {
  Container,
  Section,
  PageHero,
  Reveal,
  SectionHeading,
  Button,
  LinkArrow,
  Marquee,
  ContactCTA,
} from '../components/system'
import './Services.css'

/**
 * HİZMETLER LİSTELEME — /hizmetler
 *
 * Metin tek kaynaktan gelir: src/data/serviceDetails.js. Aynı dosyayı
 * ön-render script'i de okur, böylece sayfadaki metinle Google'ın gördüğü
 * HTML ayrışmaz.
 *
 * Admin > İçerik Yönetimi > Hizmetler bölümündeki kayıt, DOLU alanların
 * üzerine yazar (mergeDefined). Slug listesi bilerek kodda sabittir:
 * admin'den yeni slug eklenmesi karşılığı olmayan bir rota üretirdi.
 */
const PROCESS = [
  ['01', 'Keşif & brief', 'Hedef, kitle ve ton netleşir; başarının nasıl ölçüleceği yazılır.'],
  ['02', 'Strateji & plan', 'Kapsam, takvim ve göstergeler yazılı hâle gelir.'],
  ['03', 'Üretim & uygulama', 'İş marka diline sadık ve ölçeklenebilir biçimde üretilir.'],
  ['04', 'Raporlama', 'Sonuç şeffaf ve karşılaştırılabilir biçimde paylaşılır.'],
]

export default function Services() {
  const { content } = useSiteContent('services', { items: [] })

  useSEO({
    title: 'New Media ve Dijital Medya Hizmetleri | Kade New Media',
    description: 'Kade New Media’nın sosyal medya yönetimi, içerik üretimi, dijital reklam, video prodüksiyon, new media stratejisi ve web tasarımı hizmetleri.',
    keywords: 'new media, yeni medya, medya ajansı, dijital medya ajansı, sosyal medya ajansı hizmetleri, sosyal medya yönetimi istanbul, instagram ajansı, tiktok ajansı, içerik üretimi, meta reklam ajansı, google ads ajansı, video prodüksiyon, dijital ajans',
    path: '/hizmetler',
  })

  // Admin kaydı slug üzerinden eşleşir; eşleşmeyen kayıt yok sayılır.
  const overrides = Object.fromEntries(
    (content.items || [])
      .filter((item) => item?.slug && SERVICE_DETAILS[item.slug])
      .map((item) => [item.slug, item]),
  )

  const services = SERVICE_SLUGS.map((slug) => {
    const base = SERVICE_DETAILS[slug]
    const merged = mergeDefined(
      { title: base.titleTr, description: base.descTr, features: base.featuresTr },
      overrides[slug] || {},
    )
    return { slug, ...merged }
  })

  return (
    <PageTransition>
      <PageHero
        eyebrow="Hizmetler"
        title="Dijitalde ne yapıyoruz"
        lead="Strateji, içerik, reklam ve prodüksiyonu tek ekiple yürütüyoruz. Her hizmetin kapsamı, süreci ve teslim edilenleri yazılı."
        meta={[['Alan', String(services.length)], ['Merkez', 'İstanbul']]}
        actions={<Button to="/teklif-al" variant="primary">Teklif al</Button>}
      />

      {/* ── HİZMET LİSTESİ — editoryal satırlar ──────────────────── */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Kapsam"
            title="Hizmet alanları"
            index={`01 — ${String(services.length).padStart(2, '0')}`}
          />
          <ul className="sv-list">
            {services.map((service, index) => (
              <Reveal
                as="li"
                key={service.slug}
                className="sv-row"
                delay={Math.min(index, 5) * 70}
              >
                <Link to={`/hizmetler/${service.slug}`} className="sv-row__link">
                  <span className="sv-row__index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="sv-row__body">
                    <span className="sv-row__title">{service.title}</span>
                    <span className="sv-row__desc">{service.description}</span>
                    {Array.isArray(service.features) && service.features.length > 0 && (
                      <span className="sv-row__tags">
                        {service.features.slice(0, 4).map((feature) => (
                          <span className="sv-row__tag" key={feature}>{feature}</span>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className="sv-row__arrow" aria-hidden="true">→</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Marquee
        items={['STRATEJİ', 'İÇERİK', 'REKLAM', 'PRODÜKSİYON', 'WEB', 'RAPORLAMA']}
        ariaLabel="Çalışma alanlarımız"
      />

      {/* ── SÜREÇ ────────────────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Süreç" title="Nasıl çalışıyoruz" index="04 ADIM" />
          <ol className="sv-process">
            {PROCESS.map(([step, title, text], index) => (
              <Reveal as="li" key={step} className="sv-process__row" delay={Math.min(index, 4) * 70}>
                <span className="sv-process__step">{step}</span>
                <div>
                  <h3 className="sv-process__title">{title}</h3>
                  <p className="sv-process__text">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Reveal className="sv-more">
            <LinkArrow to="/paketler">Çalışma modelimiz ve kapsamlar</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      <ContactCTA
        title="Hangi hizmete ihtiyacınız var?"
        text="Kısa bir brief paylaşın; kapsamı ve süreci netleştirip yazılı teklif hazırlayalım."
      />
    </PageTransition>
  )
}
