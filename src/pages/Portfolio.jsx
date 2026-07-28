import { useEffect, useMemo, useState } from 'react'
import { useSEO } from '../hooks/useSEO'
import { getPortfolioApi } from '../api'
import { publishedProjects, hasDetailContent, PROJECT_CATEGORIES } from '../data/projects'
import PageTransition from '../components/PageTransition'
import {
  Container,
  Section,
  PageHero,
  Reveal,
  ProjectCard,
  ContactCTA,
  EmptyState,
  Button,
} from '../components/system'
import './Portfolio.css'

/**
 * PORTFOLYO LİSTELEME
 *
 * Projeler admin panelinden yönetilir. Sahte müşteri adı veya sahte proje
 * ÜRETİLMEZ: veri yoksa sayfa dürüst bir boş durum gösterir.
 *
 * SEO: bu liste sayfası bilerek `noindex, follow` kalır (thin content
 * riski). Yayınlanan proje DETAY sayfaları indekslenir ve sitemap'e girer.
 */

const ALL = 'Tümü'

export default function Portfolio() {
  const [projects, setProjects] = useState(null) // null = yükleniyor
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [failed, setFailed] = useState(false)

  useSEO({
    title: 'Portfolyo | Kade New Media',
    description:
      'Kade New Media portfolyosu. Yayınlanan sosyal medya, içerik, reklam ve prodüksiyon projelerini inceleyin.',
    path: '/portfolio',
    noindex: true,
  })

  useEffect(() => {
    let cancelled = false
    getPortfolioApi()
      .then((res) => {
        if (!cancelled) setProjects(publishedProjects(res?.data?.items))
      })
      .catch(() => {
        if (cancelled) return
        // Ağ/sunucu hatası ile "hiç proje yok" durumu farklı mesaj gerektirir.
        setProjects([])
        setFailed(true)
      })
    return () => { cancelled = true }
  }, [])

  // Yalnızca gerçekten proje bulunan kategoriler filtre çubuğunda gösterilir.
  const categories = useMemo(() => {
    if (!projects?.length) return []
    const used = PROJECT_CATEGORIES.filter((category) =>
      projects.some((project) => project.category === category))
    return used.length > 1 ? [ALL, ...used] : []
  }, [projects])

  const visible = useMemo(() => {
    if (!projects) return []
    if (activeCategory === ALL) return projects
    return projects.filter((project) => project.category === activeCategory)
  }, [projects, activeCategory])

  return (
    <PageTransition>
      <PageHero
        eyebrow="Portfolyo"
        title="Yayınlanan işler"
        lead="Müşteri onayı alınan projeleri; kapsamı, yaklaşımı ve sonuçlarıyla birlikte burada paylaşıyoruz."
        meta={projects?.length ? [
          ['Proje', String(projects.length)],
          ['Alan', String(new Set(projects.map((p) => p.category)).size)],
        ] : []}
      />

      <Section>
        <Container>
          {categories.length > 0 && (
            <Reveal>
              <div className="pf-filters" role="group" aria-label="Kategoriye göre filtrele">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`pf-filter${activeCategory === category ? ' is-active' : ''}`}
                    aria-pressed={activeCategory === category}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                    <span className="pf-filter__count">
                      {category === ALL
                        ? projects.length
                        : projects.filter((p) => p.category === category).length}
                    </span>
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          {projects === null ? (
            <p className="pf-loading" role="status">Projeler yükleniyor…</p>
          ) : visible.length > 0 ? (
            <div className="kade-grid kade-grid--2 pf-grid">
              {visible.map((project, index) => (
                <Reveal key={project.slug} delay={Math.min(index, 5) * 70}>
                  <ProjectCard
                    // Detay içeriği yoksa karta bağlantı verilmez; boş bir
                    // detay sayfası açılmasın.
                    project={hasDetailContent(project) ? project : { ...project, slug: '' }}
                    index={index}
                    featured={index === 0 && activeCategory === ALL && visible.length > 2}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal>
              <EmptyState
                title={failed ? 'Projeler şu an yüklenemedi' : 'Projeler yakında yayında'}
                text={failed
                  ? 'Bağlantı sorunu nedeniyle proje listesine ulaşamadık. Sayfayı yenileyebilir veya doğrudan bize yazabilirsiniz.'
                  : 'Vaka çalışmalarımızı müşteri onayı alındıkça yayınlıyoruz. Bu arada hizmetlerimizi inceleyebilir veya projeniz için teklif isteyebilirsiniz.'}
                action={
                  <div className="kade-cta__actions">
                    <Button to="/hizmetler" variant="outline">Hizmetleri incele</Button>
                    <Button to="/teklif-al" variant="primary">Teklif al</Button>
                  </div>
                }
              />
            </Reveal>
          )}
        </Container>
      </Section>

      <ContactCTA
        title="Sıradaki proje sizinki olsun"
        text="Markanızın hedefini paylaşın; kapsamı, süreci ve ölçüm planını birlikte çıkaralım."
      />
    </PageTransition>
  )
}
