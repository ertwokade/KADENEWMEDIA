import { lazy, Suspense, useEffect, useState } from 'react'
import SceneBoundary from '../components/kade/SceneBoundary.jsx'
import { useSEO } from '../hooks/useSEO'
import { getPortfolioApi } from '../api'
import { SERVICES } from '../data/newMediaAgency'
import { homeProjects } from '../data/projects'
import {
  Container,
  Section,
  Reveal,
  SectionHeading,
  Button,
  LinkArrow,
  ProjectCard,
  ServiceCard,
  ContactCTA,
  EmptyState,
} from '../components/system'
import './Home.css'

/**
 * ANA SAYFA
 *
 * Kompozisyon, kadenewmedia.com'un yayındaki ana sayfasını izler:
 * üç sütunlu üst bilgi şeridi → tam ekran cam "hello" objesi →
 * dev uppercase başlık → tanıtım → hizmetler → süreç → seçili işler.
 *
 * Fark: bu sürüm REACT KAYNAĞINDA yazılmıştır. Yayındaki sayfa, kaynağı
 * bu repoda bulunmayan derlenmiş bir statik snapshot'tı; hydration hatası
 * (#418) basıyor, bazı kartları 0 px yüksekliğe düşürüyor, programatik
 * kaydırmaya yanıt vermiyor ve başka bir siteye giden bağlantılar
 * içeriyordu. Bunların hiçbiri burada yok, görünüm ise korunuyor.
 */

// 3B sahne yalnız ana sayfada ve yalnız gerektiğinde indirilir; Three.js
// bundle'ı diğer 38 rotayı yavaşlatmasın diye lazy.
const KadeScene = lazy(() => import('../components/kade/KadeScene.jsx'))

const PROCESS = [
  ['01', 'Keşif ve analiz', 'Markanı, sektörünü ve hedeflerini inceleriz; başarının nasıl ölçüleceğini birlikte yazarız.'],
  ['02', 'Strateji ve plan', 'Kanal planı, içerik ekseni ve göstergeler yazılı hâle gelir. Ne yapacağımız ve neden yapacağımız nettir.'],
  ['03', 'Üretim ve yayın', 'İçerik, reklam ve prodüksiyon; marka diline sadık, sürdürülebilir bir üretim akışıyla hayata geçer.'],
  ['04', 'Ölçüm ve raporlama', 'Her dönem aynı göstergelerle, karşılaştırılabilir biçimde raporlanır.'],
]

/**
 * 3B sahne ağır (Three.js bundle + ~1 MB glTF). Üç koşulu birden ister:
 *   • ekran geniş — dar ekranda hem gereksiz hem pahalı
 *   • hareket azaltma kapalı
 *   • SAYFA YÜKÜ BİTMİŞ — sahne asla ilk boyanın önüne geçmez
 *
 * Son madde ölçülerek eklendi: sahne mount'la birlikte başlatıldığında
 * indirme ve GPU işi ana iş parçacığını meşgul ediyor, başlık/CTA geçişleri
 * 10 sn'yi aşabiliyordu. Metin hiçbir koşulda sahneyi beklemez.
 */
function useWantsScene() {
  const [wants, setWants] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const wide = window.matchMedia?.('(min-width: 900px)')
    let idleId = null
    let cancelled = false

    const decide = () => {
      if (cancelled) return
      setWants(Boolean(wide?.matches) && !reduce?.matches)
    }

    const start = () => {
      if (cancelled) return
      const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 200))
      idleId = idle(decide, { timeout: 2000 })
      wide?.addEventListener?.('change', decide)
      reduce?.addEventListener?.('change', decide)
    }

    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', start)
      if (idleId != null) (window.cancelIdleCallback || window.clearTimeout)(idleId)
      wide?.removeEventListener?.('change', decide)
      reduce?.removeEventListener?.('change', decide)
    }
  }, [])
  return wants
}

export default function Home() {
  const [projects, setProjects] = useState(null) // null = yükleniyor
  const wantsScene = useWantsScene()

  useSEO({
    title: 'Kade New Media | İstanbul Sosyal Medya & Dijital Pazarlama Ajansı',
    description:
      'İstanbul merkezli sosyal medya ve dijital pazarlama ajansı Kade New Media. Instagram, TikTok, YouTube yönetimi, içerik üretimi, reklam ve prodüksiyonla markanızı dijitalde büyütüyoruz.',
    path: '/',
  })

  // Seçili işler admin panelinden yönetilir. Veri yoksa dürüst boş durum
  // gösterilir — sahte müşteri adı veya uydurma sonuç ÜRETİLMEZ.
  useEffect(() => {
    let cancelled = false
    getPortfolioApi()
      .then((res) => { if (!cancelled) setProjects(homeProjects(res?.data?.items)) })
      .catch(() => { if (!cancelled) setProjects([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="home">
      {/* ── GİRİŞ ────────────────────────────────────────────────────
          Cam obje arka planda; TÜM METİN normal HTML olarak onun üstünde
          durur. Sahne hiç yüklenmese bile başlık, açıklama ve bağlantılar
          ilk boyada okunur. */}
      <header className="home-top">
        {wantsScene && (
          <div className="home-top__scene" aria-hidden="true">
            {/* Sahne dekoratif. Model inmezse ya da WebGL yoksa sessizce
                atlanır — sayfanın geri kalanı etkilenmez. */}
            <SceneBoundary>
              <Suspense fallback={null}><KadeScene /></Suspense>
            </SceneBoundary>
          </div>
        )}
        <div className="home-top__grid" aria-hidden="true" />

        <div className="home-top__inner">
          {/* Üç sütunlu bilgi şeridi */}
          <div className="home-top__lede">
            <Reveal>
              <p className="home-top__kicker">
                Sosyal<br />Medya &amp;<br />Pazarlama
              </p>
            </Reveal>
            <Reveal delay={70}>
              <p className="home-top__note">Markaları dijitalde büyütüyoruz.</p>
            </Reveal>
            <Reveal delay={140}>
              <p className="home-top__note">
                Kade Media — İstanbul merkezli dijital pazarlama ajansı. Sosyal medya,
                içerik, reklam ve prodüksiyonla markanı dijitalde konumlandırıyoruz.
              </p>
            </Reveal>
          </div>

          {/* Dev başlık — sahnenin üstünde, sayfanın ağırlık merkezi */}
          <Reveal delay={210} variant="clip" className="home-top__titlewrap">
            <h1 className="home-top__title">
              Biz<br />markanı<br />büyütüyoruz
            </h1>
          </Reveal>

          <Reveal delay={280}>
            <div className="home-top__actions">
              <Button to="/teklif-al" variant="primary">Teklif al</Button>
              <Button to="/hizmetler" variant="outline">Hizmetleri gör</Button>
            </div>
          </Reveal>
        </div>
      </header>

      {/* ── TANITIM ─────────────────────────────────────────────────── */}
      <Section className="home-intro">
        <Container>
          <Reveal>
            <h2 className="home-intro__title">
              İstanbul merkezli sosyal medya ve dijital pazarlama ajansı
            </h2>
          </Reveal>
          <Reveal delay={70}>
            <p className="home-intro__text">
              Strateji, içerik, reklam ve prodüksiyonu tek ekiple yürütüyoruz.
              Kapsamı baştan yazıyor, sonucu aynı göstergelerle raporluyoruz.
            </p>
          </Reveal>
        </Container>
      </Section>

      {/* ── HİZMETLER ───────────────────────────────────────────────── */}
      <Section id="hizmetler" className="home-services">
        <Container>
          <SectionHeading
            eyebrow="Ne yapıyoruz"
            title="Hizmetlerimiz"
            index={`01 — ${String(SERVICES.length).padStart(2, '0')}`}
          />
          <div className="kade-service-grid">
            {SERVICES.map((service, index) => (
              <ServiceCard key={service.to} service={service} index={index} />
            ))}
          </div>
          <Reveal className="home-more">
            <LinkArrow to="/hizmetler">Tüm hizmet detayları</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ── SÜREÇ ───────────────────────────────────────────────────── */}
      <Section className="home-process">
        <Container>
          <SectionHeading eyebrow="Süreç" title="Nasıl çalışıyoruz?" index="02" />
          <ol className="home-process__list">
            {PROCESS.map(([step, title, text], index) => (
              <Reveal as="li" key={step} className="home-process__row" delay={Math.min(index, 4) * 70}>
                <span className="home-process__step">{step}</span>
                <h3 className="home-process__title">{title}</h3>
                <p className="home-process__text">{text}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── SEÇİLİ İŞLER ────────────────────────────────────────────── */}
      <Section id="isler" className="home-work">
        <Container>
          <SectionHeading eyebrow="Seçili işler" title="Yayınlanan çalışmalar" index="03" />

          {projects === null ? (
            <p className="home-loading" role="status">Yükleniyor…</p>
          ) : projects.length > 0 ? (
            <>
              <div className="kade-grid kade-grid--2">
                {projects.map((project, index) => (
                  <Reveal key={project.slug} delay={Math.min(index, 4) * 70}>
                    <ProjectCard project={project} index={index} />
                  </Reveal>
                ))}
              </div>
              <Reveal className="home-more">
                <LinkArrow to="/portfolio">Tüm çalışmalar</LinkArrow>
              </Reveal>
            </>
          ) : (
            <Reveal>
              <EmptyState
                title="Çalışmalar yakında yayında"
                text="Vaka çalışmalarını müşteri onayı alındıkça paylaşıyoruz. Bu arada hizmet kapsamlarını inceleyebilir veya doğrudan teklif isteyebilirsiniz."
                action={<Button to="/hizmetler" variant="outline">Hizmetleri incele</Button>}
              />
            </Reveal>
          )}
        </Container>
      </Section>

      <ContactCTA
        title="Projenizi konuşalım"
        text="Kısa bir brief yeterli. Kapsamı ve süreci netleştirip yazılı teklif hazırlayalım."
        primary={{ to: '/teklif-al', label: 'Teklif al' }}
        secondary={{ to: '/iletisim', label: 'İletişime geç' }}
      />
    </div>
  )
}
