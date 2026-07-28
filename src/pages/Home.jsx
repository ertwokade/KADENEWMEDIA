import { useEffect, useState } from 'react'
import { useSEO } from '../hooks/useSEO'
import { getPortfolioApi } from '../api'
import { SERVICES } from '../data/newMediaAgency'
import { normalizeProjects } from '../data/projects'
import {
  Container,
  Section,
  Reveal,
  SectionHeading,
  Button,
  LinkArrow,
  ProjectCard,
  ServiceCard,
  Marquee,
  ContactCTA,
  EmptyState,
} from '../components/system'
import './Home.css'

/**
 * ANA SAYFA
 *
 * Daha önce `/` adresinde başka bir Next.js projesinin minified statik
 * snapshot'ı (public/site.html) servis ediliyordu. Snapshot'ın kaynağı
 * elimizde olmadığı için ana sayfa ile iç sayfalar iki ayrı tasarım
 * sistemi kullanıyor, ortak bileşen paylaşılamıyor ve her değişiklik
 * script yamasıyla yapılıyordu; ayrıca hydration (#418) hatası veriyordu.
 *
 * Bu bileşen ana sayfayı React'e taşır: aynı tokenlar, aynı bileşenler,
 * aynı hareket dili. Snapshot'ın editoryal görsel dili (krem zemin, altın
 * vurgu, büyük uppercase tipografi, dikey ızgara, marquee) korunur.
 */

const PROCESS = [
  ['01', 'Keşif', 'Markanı, sektörünü, rakiplerini ve hedeflerini analiz ederiz; başarının nasıl ölçüleceğini birlikte tanımlarız.'],
  ['02', 'Strateji', 'Kanal planı, içerik ekseni ve KPI’lar yazılı hâle gelir. Ne yapacağımız ve neden yapacağımız nettir.'],
  ['03', 'Üretim', 'İçerik, reklam ve prodüksiyon; marka diline sadık, ölçeklenebilir bir üretim akışıyla hayata geçer.'],
  ['04', 'Büyüme', 'Yayınlar test edilir, veriye göre iyileştirilir ve şeffaf raporlarla paylaşılır.'],
]

const MARQUEE_ITEMS = [
  'SOSYAL MEDYA',
  'İÇERİK ÜRETİMİ',
  'DİJİTAL REKLAM',
  'VİDEO PRODÜKSİYON',
  'STRATEJİ',
  'WEB TASARIMI',
]

/** Saat göstergesi — editoryal durum şeridi için. */
function useClock() {
  const [time, setTime] = useState('--:--')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function Home() {
  const clock = useClock()
  const [projects, setProjects] = useState(null) // null = yükleniyor

  useSEO({
    title: 'Kade New Media | İstanbul Sosyal Medya & Dijital Pazarlama Ajansı',
    description:
      'İstanbul merkezli sosyal medya ve dijital pazarlama ajansı Kade New Media. Instagram, TikTok, YouTube yönetimi, içerik üretimi, reklam ve prodüksiyonla markanızı dijitalde büyütüyoruz.',
    path: '/',
  })

  // Seçili işler admin panelinden yönetilir. Veri yoksa bölüm boş durum
  // gösterir — sahte müşteri adı veya sahte proje ÜRETİLMEZ.
  useEffect(() => {
    let cancelled = false
    getPortfolioApi()
      .then((res) => {
        if (cancelled) return
        setProjects(normalizeProjects(res?.data?.items).filter((p) => p.published).slice(0, 4))
      })
      .catch(() => { if (!cancelled) setProjects([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="home">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <header className="home-intro">
        <div className="home-intro__grid" aria-hidden="true" />
        <Container className="home-intro__inner">
          <div className="home-intro__top">
            <Reveal>
              <p className="home-intro__kicker">Sosyal medya &amp; pazarlama</p>
            </Reveal>
            <Reveal delay={80}>
              <p className="home-intro__intro">
                Kade New Media; strateji, içerik, reklam ve prodüksiyonu tek çatı
                altında birleştirerek markanızı dijitalde büyütür.
              </p>
            </Reveal>
          </div>

          <Reveal delay={140} variant="clip">
            <h1 className="home-intro__title">
              <span>BİZ</span>
              <span>MARKANI</span>
              <span>BÜYÜTÜYORUZ</span>
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <div className="home-intro__actions">
              <Button to="/teklif-al" variant="primary">Teklif al</Button>
              <Button to="/hizmetler" variant="outline">Hizmetleri gör</Button>
            </div>
          </Reveal>
        </Container>

        <p className="home-intro__status" aria-hidden="true">
          <span>İSTANBUL</span>
          <span>41.01° N · 28.98° E</span>
          <span>{clock}</span>
        </p>
      </header>

      {/* ── MANİFESTO ──────────────────────────────────────────────── */}
      <Section className="home-statement">
        <Container>
          <Reveal variant="clip">
            <p className="home-statement__lead">
              Güçlü iş birlikleriyle markaları dijital dünyada büyütüyoruz.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="home-statement__sub">
              Strateji, içerik, reklam ve prodüksiyon — hepsi tek ekiple.
              Veri odaklı çalışır, şeffaf raporlarız.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Marquee items={MARQUEE_ITEMS} ariaLabel="Hizmet alanlarımız" />

      {/* ── SEÇİLİ İŞLER ───────────────────────────────────────────── */}
      <Section id="isler" className="home-work">
        <Container>
          <SectionHeading
            eyebrow="Seçili işler"
            title="Yayınlanan projeler"
            index={projects?.length ? `01 — ${String(projects.length).padStart(2, '0')}` : '01'}
          />

          {projects === null ? (
            <p className="home-loading" role="status">Projeler yükleniyor…</p>
          ) : projects.length > 0 ? (
            <>
              <div className="kade-grid kade-grid--2">
                {projects.map((project, index) => (
                  <Reveal key={project.slug} delay={Math.min(index, 4) * 70}>
                    <ProjectCard
                      project={project}
                      index={index}
                      featured={index === 0 && projects.length > 2}
                    />
                  </Reveal>
                ))}
              </div>
              <Reveal className="home-more">
                <LinkArrow to="/portfolio">Tüm projeler</LinkArrow>
              </Reveal>
            </>
          ) : (
            <Reveal>
              <EmptyState
                title="Projeler yakında yayında"
                text="Vaka çalışmalarımızı müşteri onayı alındıkça burada paylaşıyoruz. Bu arada hizmetlerimizi inceleyebilir veya doğrudan teklif isteyebilirsiniz."
                action={<Button to="/hizmetler" variant="outline">Hizmetleri incele</Button>}
              />
            </Reveal>
          )}
        </Container>
      </Section>

      {/* ── HİZMETLER ──────────────────────────────────────────────── */}
      <Section id="hizmetler" className="home-services">
        <Container>
          <SectionHeading
            eyebrow="Hizmetler"
            title="Ne yapıyoruz"
            index={`${String(SERVICES.length).padStart(2, '0')} ALAN`}
          />
          <div className="kade-service-grid">
            {SERVICES.map((service, index) => (
              <ServiceCard key={service.to} service={service} index={index} />
            ))}
          </div>
          <Reveal className="home-more">
            <LinkArrow to="/hizmetler">Tüm hizmetler</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ── SÜREÇ ──────────────────────────────────────────────────── */}
      <Section className="home-process">
        <Container>
          <SectionHeading eyebrow="Süreç" title="Nasıl çalışıyoruz" index="04 ADIM" />
          <ol className="home-process__list">
            {PROCESS.map(([step, title, description], index) => (
              <Reveal as="li" key={step} className="home-process__row" delay={Math.min(index, 4) * 70}>
                <span className="home-process__step">{step}</span>
                <h3 className="home-process__title">{title}</h3>
                <p className="home-process__text">{description}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── KAPANIŞ ────────────────────────────────────────────────── */}
      <ContactCTA
        title="Birlikte büyüyelim"
        text="Markanız için sosyal medya, içerik, reklam veya prodüksiyon planınızı konuşalım. Kısa bir brief yeterli."
        primary={{ to: '/teklif-al', label: 'Teklif al' }}
        secondary={{ to: '/iletisim', label: 'İletişime geç' }}
      />

    </div>
  )
}
