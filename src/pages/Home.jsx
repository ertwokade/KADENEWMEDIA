import { useEffect, useState } from 'react'
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
 * ANA SAYFA — özgün React sürümü
 *
 * Bu sayfa, `/` adresinde servis edilen vendored statik snapshot'ın
 * (public/site.html + public/_next/**) yerini alır. Snapshot başka bir
 * projenin derlenmiş çıktısıydı: kaynağı yoktu, hydration #418 üretiyordu,
 * kartların bir kısmı 0 px yüksekliğe düşüyordu ve içindeki bağlantılar
 * başka bir sitenin plugin/etkinlik adreslerine işaret ediyordu.
 *
 * Tasarım kararları:
 *   • Hazır 3B model KULLANILMAZ. Hero'nun görsel ağırlığı tipografi,
 *     katmanlı CSS gradient ve ince ızgara ile kurulur — hem özgün hem
 *     ~2,4 MB'lık bundle bağımlılığı olmadan.
 *   • Bölüm sırası bir hizmet ajansına göre kurgulanmıştır:
 *     hero → hizmetler → çalışma biçimi → seçili işler → kapanış.
 *     Uzun galeri odaklı portfolyo-stüdyo ritmi bilerek tekrarlanmaz.
 *   • İlk boyada HTML başlık ve CTA görünür; hiçbir metin ağır bir
 *     varlığın yüklenmesini beklemez.
 */

const PROCESS = [
  ['01', 'Keşif', 'Markanı, sektörünü ve hedeflerini inceleriz; başarının nasıl ölçüleceğini birlikte yazarız.'],
  ['02', 'Strateji', 'Kanal planı, içerik ekseni ve göstergeler yazılı hâle gelir. Ne yapacağımız ve neden yapacağımız nettir.'],
  ['03', 'Üretim', 'İçerik, reklam ve prodüksiyon; marka diline sadık, sürdürülebilir bir üretim akışıyla hayata geçer.'],
  ['04', 'Raporlama', 'Her dönem aynı göstergelerle, karşılaştırılabilir biçimde raporlanır.'],
]

export default function Home() {
  const [projects, setProjects] = useState(null) // null = yükleniyor

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
      {/* ── HERO ─────────────────────────────────────────────────────
          Metin ve CTA ilk boyada hazır; dekoratif katmanlar CSS ile
          çizilir, hiçbir ağır varlık beklenmez. */}
      <header className="home-lede">
        <div className="home-lede__grid" aria-hidden="true" />
        <div className="home-lede__glow" aria-hidden="true" />

        <Container className="home-lede__inner">
          <Reveal>
            <p className="home-lede__eyebrow">İstanbul · New media ajansı</p>
          </Reveal>

          <Reveal delay={70} variant="clip">
            <h1 className="home-lede__title">
              Markanı dijitalde
              <span className="home-lede__accent"> büyütüyoruz</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="home-lede__text">
              Strateji, içerik, reklam ve prodüksiyonu tek ekiple yürütüyoruz.
              Kapsamı baştan yazıyor, sonucu aynı göstergelerle raporluyoruz.
            </p>
          </Reveal>

          <Reveal delay={210}>
            <div className="home-lede__actions">
              <Button to="/teklif-al" variant="primary">Teklif al</Button>
              <Button to="/hizmetler" variant="outline">Hizmetleri gör</Button>
            </div>
          </Reveal>
        </Container>

        <Container>
          <Reveal delay={280}>
            <dl className="home-lede__meta">
              <div><dt>Merkez</dt><dd>İstanbul</dd></div>
              <div><dt>Alan</dt><dd>{SERVICES.length} hizmet</dd></div>
              <div><dt>Çalışma</dt><dd>Aylık veya proje bazlı</dd></div>
            </dl>
          </Reveal>
        </Container>
      </header>

      {/* ── HİZMETLER — Kade'nin asıl ticari içeriği, bu yüzden önde ── */}
      <Section id="hizmetler" className="home-services">
        <Container>
          <SectionHeading
            eyebrow="Ne yapıyoruz"
            title="Hizmet alanları"
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

      {/* ── ÇALIŞMA BİÇİMİ ──────────────────────────────────────────── */}
      <Section className="home-process">
        <Container>
          <SectionHeading eyebrow="Nasıl çalışıyoruz" title="Dört adım" index="02" />
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
          <SectionHeading
            eyebrow="Seçili işler"
            title="Yayınlanan çalışmalar"
            index="03"
          />

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

      {/* ── KAPANIŞ ─────────────────────────────────────────────────── */}
      <ContactCTA
        title="Projenizi konuşalım"
        text="Kısa bir brief yeterli. Kapsamı ve süreci netleştirip yazılı teklif hazırlayalım."
        primary={{ to: '/teklif-al', label: 'Teklif al' }}
        secondary={{ to: '/iletisim', label: 'İletişime geç' }}
      />
    </div>
  )
}
