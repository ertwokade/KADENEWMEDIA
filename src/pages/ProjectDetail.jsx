import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { getPortfolioApi } from '../api'
import { publishedProjects, hasDetailContent } from '../data/projects'
import { SERVICES } from '../data/newMediaAgency'
import { BreadcrumbSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import NotFound from './NotFound'
import {
  Container,
  Section,
  Reveal,
  SectionHeading,
  Media,
  LinkArrow,
  ContactCTA,
} from '../components/system'
import './ProjectDetail.css'

/**
 * PROJE DETAY — /portfolio/:slug
 *
 * Tek bir yeniden kullanılabilir şablon; her proje için yeni bileşen
 * yazmak gerekmez. Bölümler VERİYE BAĞLI çizilir: bir alan boşsa o bölüm
 * hiç render edilmez. Böylece "sonuç" veya "süreç" verisi olmayan bir
 * proje, uydurma rakamla doldurulmuş gibi görünmez.
 */
export default function ProjectDetail() {
  const { slug } = useParams()
  const [state, setState] = useState({ status: 'loading', projects: [] })

  useEffect(() => {
    let cancelled = false
    getPortfolioApi()
      .then((res) => {
        if (!cancelled) setState({ status: 'ready', projects: publishedProjects(res?.data?.items) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', projects: [] })
      })
    return () => { cancelled = true }
  }, [])

  const { project, prev, next } = useMemo(() => {
    const list = state.projects
    const index = list.findIndex((item) => item.slug === slug)
    if (index === -1) return { project: null, prev: null, next: null }
    return {
      project: list[index],
      prev: index > 0 ? list[index - 1] : null,
      next: index < list.length - 1 ? list[index + 1] : null,
    }
  }, [state.projects, slug])

  const found = Boolean(project && hasDetailContent(project))

  useSEO({
    title: found ? `${project.title} | Kade New Media` : 'Proje | Kade New Media',
    description: found
      ? (project.seo.description || project.excerpt || `${project.title} projesinin kapsamı, süreci ve sonuçları.`)
      : 'Proje bulunamadı.',
    path: `/portfolio/${slug}`,
    image: found ? (project.seo.ogImage || project.cover || undefined) : undefined,
    type: 'article',
    // Kayıt bulunamadıysa indekslenmemeli: rewrite nedeniyle HTTP 200 dönen
    // bu adres arama motoruna gerçek bir sayfaymış gibi görünmemeli.
    noindex: !found,
  })

  if (state.status === 'loading') {
    return (
      <PageTransition>
        <Section>
          <Container>
            <p className="pd-loading" role="status">Proje yükleniyor…</p>
          </Container>
        </Section>
      </PageTransition>
    )
  }

  // Kayıt yok veya gösterilecek içeriği yok → gerçek 404 deneyimi.
  if (!found) return <NotFound />

  const { title, client, year, category, excerpt, cover, coverAlt, emoji, summary, process, media, results, services } = project
  const relatedServices = SERVICES.filter((service) => services.includes(service.to))

  return (
    <PageTransition>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Portfolyo', url: '/portfolio' },
          { name: title, url: `/portfolio/${project.slug}` },
        ]}
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <header className="pd-hero">
        <div className="kade-page-hero__grid" aria-hidden="true" />
        <Container>
          <Reveal>
            <Link className="pd-back kade-link" to="/portfolio">
              <span className="kade-link__arrow" aria-hidden="true">←</span>
              <span>Tüm projeler</span>
            </Link>
          </Reveal>
          <Reveal delay={60} variant="clip">
            <h1 className="pd-title">{title}</h1>
          </Reveal>
          {excerpt && <Reveal delay={120}><p className="kade-lead pd-excerpt">{excerpt}</p></Reveal>}
          <Reveal delay={180}>
            <dl className="pd-meta">
              {client && <div><dt>Müşteri</dt><dd>{client}</dd></div>}
              {year && <div><dt>Yıl</dt><dd>{year}</dd></div>}
              {category && <div><dt>Alan</dt><dd>{category}</dd></div>}
              {relatedServices.length > 0 && (
                <div>
                  <dt>Hizmetler</dt>
                  <dd>{relatedServices.map((service) => service.title).join(', ')}</dd>
                </div>
              )}
            </dl>
          </Reveal>
        </Container>
      </header>

      {/* Kapak görseli — yoksa alan boş bırakılmaz, markalı fallback çizilir. */}
      <Reveal variant="fade" className="pd-cover">
        <Container size="wide">
          <Media src={cover} alt={coverAlt || title} fallback={emoji} aspect="16 / 8" loading="eager" />
        </Container>
      </Reveal>

      {/* ── ÖZET ─────────────────────────────────────────────────── */}
      {(summary.problem || summary.goal || summary.approach || summary.role) && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Proje özeti" title="Ne yaptık, neden yaptık" index="01" />
            <div className="pd-summary">
              {summary.problem && <SummaryBlock label="Problem" text={summary.problem} delay={0} />}
              {summary.goal && <SummaryBlock label="Hedef" text={summary.goal} delay={70} />}
              {summary.approach && <SummaryBlock label="Yaklaşım" text={summary.approach} delay={140} />}
              {summary.role && <SummaryBlock label="Rolümüz" text={summary.role} delay={210} />}
            </div>
          </Container>
        </Section>
      )}

      {/* ── SÜREÇ ────────────────────────────────────────────────── */}
      {process.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Süreç" title="Nasıl ilerledik" index="02" />
            <ol className="pd-process">
              {process.map((step, index) => (
                <Reveal as="li" key={`${step.title}-${index}`} className="pd-process__row" delay={Math.min(index, 5) * 70}>
                  <span className="pd-process__step">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    {step.title && <h3 className="pd-process__title">{step.title}</h3>}
                    {step.text && <p className="pd-process__text">{step.text}</p>}
                  </div>
                </Reveal>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      {/* ── GÖRSEL ANLATIM ───────────────────────────────────────── */}
      {media.length > 0 && (
        <Section>
          <Container size="wide">
            <SectionHeading eyebrow="Görseller" title="Projeden kareler" index="03" />
            <div className="pd-media">
              {media.map((item, index) => (
                <Reveal
                  key={`${item.src}-${index}`}
                  variant="fade"
                  delay={Math.min(index, 4) * 70}
                  className={`pd-media__item pd-media__item--${item.layout}`}
                >
                  <Media
                    src={item.src}
                    poster={item.poster}
                    alt={item.alt}
                    fallback={emoji}
                    aspect={MEDIA_ASPECT[item.layout]}
                  />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── SONUÇLAR — yalnızca gerçek veri girildiyse ─────────────── */}
      {results.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Sonuçlar" title="Ne değişti" index="04" />
            <div className="pd-results">
              {results.map((result, index) => (
                <Reveal key={result.label} className="pd-result" delay={Math.min(index, 4) * 70}>
                  <span className="pd-result__value">{result.value}</span>
                  <span className="pd-result__label">{result.label}</span>
                  {result.note && <span className="pd-result__note">{result.note}</span>}
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── İLGİLİ HİZMETLER ─────────────────────────────────────── */}
      {relatedServices.length > 0 && (
        <Section tight>
          <Container>
            <SectionHeading eyebrow="İlgili hizmetler" title="Bu projede kullandıklarımız" as="h2" />
            <ul className="pd-services">
              {relatedServices.map((service) => (
                <li key={service.to}>
                  <LinkArrow to={service.to}>{service.title}</LinkArrow>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ── PROJELER ARASI GEZİNME ───────────────────────────────── */}
      {(prev || next) && (
        <Section tight className="pd-nav">
          <Container>
            <nav className="pd-nav__row" aria-label="Diğer projeler">
              {prev
                ? <Link className="pd-nav__item pd-nav__item--prev" to={`/portfolio/${prev.slug}`}>
                    <span className="pd-nav__label">Önceki proje</span>
                    <span className="pd-nav__title">{prev.title}</span>
                  </Link>
                : <span />}
              {next && (
                <Link className="pd-nav__item pd-nav__item--next" to={`/portfolio/${next.slug}`}>
                  <span className="pd-nav__label">Sonraki proje</span>
                  <span className="pd-nav__title">{next.title}</span>
                </Link>
              )}
            </nav>
          </Container>
        </Section>
      )}

      <ContactCTA
        title="Benzer bir proje mi planlıyorsunuz?"
        text="Hedefinizi paylaşın; kapsamı, süreci ve ölçüm planını birlikte çıkaralım."
      />
    </PageTransition>
  )
}

const MEDIA_ASPECT = {
  full: '16 / 9',
  split: '4 / 3',
  portrait: '9 / 16',
  landscape: '16 / 9',
}

function SummaryBlock({ label, text, delay }) {
  return (
    <Reveal className="pd-summary__block" delay={delay}>
      <h3 className="pd-summary__label">{label}</h3>
      <p className="pd-summary__text">{text}</p>
    </Reveal>
  )
}
