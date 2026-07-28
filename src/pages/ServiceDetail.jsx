import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { getPortfolioApi } from '../api'
import { publishedProjects, hasDetailContent } from '../data/projects'
import { SERVICE_DETAILS, SERVICE_SLUGS } from '../data/serviceDetails'
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import NotFound from './NotFound'
import {
  Container,
  Section,
  PageHero,
  Reveal,
  SectionHeading,
  Button,
  LinkArrow,
  ProjectCard,
  ContactCTA,
} from '../components/system'
import './ServiceDetail.css'

/**
 * HİZMET DETAY — /hizmetler/:slug
 *
 * Altı hizmet sayfası TEK zengin şablonu paylaşır. Metin içeriği
 * src/data/serviceDetails.js içindedir ve aynı dosyayı ön-render script'i
 * de okur — sayfadaki metinle Google'ın gördüğü HTML ayrışmaz.
 *
 * Bölümler: hero → problem → kime uygun → kapsam → süreç → teslim edilenler
 * → örnek çalışmalar → SSS → ilgili hizmetler → teklif CTA.
 * İlgili veri yoksa bölüm hiç render edilmez.
 */
export default function ServiceDetail() {
  const { slug } = useParams()
  const service = SERVICE_DETAILS[slug]
  const [projects, setProjects] = useState([])

  // Bu hizmetin geçtiği yayınlanmış projeler — "örnek çalışmalar".
  useEffect(() => {
    let cancelled = false
    getPortfolioApi()
      .then((res) => {
        if (cancelled) return
        const path = `/hizmetler/${slug}`
        setProjects(
          publishedProjects(res?.data?.items)
            .filter((project) => project.services.includes(path) && hasDetailContent(project))
            .slice(0, 2),
        )
      })
      .catch(() => { if (!cancelled) setProjects([]) })
    return () => { cancelled = true }
  }, [slug])

  const related = useMemo(
    () => SERVICE_SLUGS.filter((item) => item !== slug).slice(0, 3),
    [slug],
  )

  useSEO({
    title: service ? `${service.titleTr} | Kade New Media` : 'Hizmet | Kade New Media',
    description: service?.descTr || 'Kade New Media hizmetleri.',
    path: `/hizmetler/${slug}`,
    noindex: !service,
  })

  if (!service) return <NotFound />

  const {
    titleTr, descTr, problemTr, featuresTr = [], deliverablesTr = [],
    audienceTr = [], processTr = [], faqTr = [],
  } = service

  return (
    <PageTransition>
      <ServiceSchema name={titleTr} description={descTr} url={`/hizmetler/${slug}`} />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Hizmetler', url: '/hizmetler' },
          { name: titleTr, url: `/hizmetler/${slug}` },
        ]}
      />
      {faqTr.length > 0 && <FAQSchema items={faqTr} />}

      <PageHero
        eyebrow="Hizmet"
        title={titleTr}
        lead={descTr}
        actions={
          <>
            <Button to="/teklif-al" variant="primary">Bu hizmet için teklif al</Button>
            <Button to="/hizmetler" variant="outline">Tüm hizmetler</Button>
          </>
        }
      />

      {/* ── PROBLEM ──────────────────────────────────────────────── */}
      {problemTr && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Neden gerekli" title="Bu hizmet hangi sorunu çözüyor?" index="01" />
            <Reveal>
              <p className="sd-problem">{problemTr}</p>
            </Reveal>
          </Container>
        </Section>
      )}

      {/* ── KİME UYGUN ───────────────────────────────────────────── */}
      {audienceTr.length > 0 && (
        <Section tight>
          <Container>
            <SectionHeading eyebrow="Kime uygun" title="Bu hizmet size uygun mu?" index="02" />
            <ul className="sd-audience">
              {audienceTr.map((item, index) => (
                <Reveal as="li" key={item} className="sd-audience__item" delay={Math.min(index, 4) * 70}>
                  <span className="sd-audience__mark" aria-hidden="true">→</span>
                  <span>{item}</span>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ── KAPSAM ───────────────────────────────────────────────── */}
      {featuresTr.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Kapsam" title="Neler dahil" index="03" />
            <ul className="sd-scope">
              {featuresTr.map((feature, index) => (
                <Reveal as="li" key={feature} className="sd-scope__item" delay={Math.min(index, 5) * 60}>
                  <span className="sd-scope__index">{String(index + 1).padStart(2, '0')}</span>
                  <span>{feature}</span>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ── SÜREÇ ────────────────────────────────────────────────── */}
      {processTr.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Süreç" title="Nasıl çalışıyoruz" index="04" />
            <ol className="sd-process">
              {processTr.map((step, index) => (
                <Reveal as="li" key={step.title} className="sd-process__row" delay={Math.min(index, 5) * 70}>
                  <span className="sd-process__step">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="sd-process__title">{step.title}</h3>
                    <p className="sd-process__text">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {/* ── TESLİM EDİLENLER ─────────────────────────────────────── */}
      {deliverablesTr.length > 0 && (
        <Section tight>
          <Container>
            <SectionHeading eyebrow="Teslim" title="Elinize ne geçiyor" index="05" />
            <ul className="sd-deliverables">
              {deliverablesTr.map((item, index) => (
                <Reveal as="li" key={item} className="sd-deliverable" delay={Math.min(index, 4) * 70}>
                  {item}
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ── ÖRNEK ÇALIŞMALAR — yalnız gerçek proje varsa ──────────── */}
      {projects.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Örnek çalışmalar" title="Bu hizmetle yaptıklarımız" index="06" />
            <div className="kade-grid kade-grid--2">
              {projects.map((project, index) => (
                <Reveal key={project.slug} delay={index * 70}>
                  <ProjectCard project={project} index={index} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── SSS ──────────────────────────────────────────────────── */}
      {faqTr.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="SSS" title="Sık sorulan sorular" index="07" />
            <div className="sd-faq">
              {faqTr.map((item, index) => (
                <Reveal key={item.soru} delay={Math.min(index, 4) * 70}>
                  <details className="sd-faq__item">
                    <summary className="sd-faq__q">{item.soru}</summary>
                    <p className="sd-faq__a">{item.cevap}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── İLGİLİ HİZMETLER ─────────────────────────────────────── */}
      <Section tight className="sd-related">
        <Container>
          <SectionHeading eyebrow="Diğer hizmetler" title="Birlikte iyi çalışanlar" as="h2" />
          <ul className="sd-related__list">
            {related.map((item) => (
              <li key={item}>
                <LinkArrow to={`/hizmetler/${item}`}>{SERVICE_DETAILS[item].titleTr}</LinkArrow>
              </li>
            ))}
          </ul>
          <p className="sd-related__all">
            <Link className="kade-link" to="/hizmetler">Tüm hizmetleri gör</Link>
          </p>
        </Container>
      </Section>

      <ContactCTA
        title={`${titleTr} için teklif alın`}
        text="İhtiyacınızı kısaca paylaşın; kapsamı ve süreci netleştirip yazılı teklif hazırlayalım."
      />
    </PageTransition>
  )
}
