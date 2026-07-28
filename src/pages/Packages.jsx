import { useEffect, useState } from 'react'
import { useSEO } from '../hooks/useSEO'
import { getContentApi } from '../api'
import { PACKAGE_SCOPES, PACKAGE_FAQS } from '../data/packages'
import { FAQSchema } from '../components/StructuredData'
import PageTransition from '../components/PageTransition'
import {
  Container,
  Section,
  PageHero,
  Reveal,
  SectionHeading,
  Button,
  LinkArrow,
  ContactCTA,
} from '../components/system'
import './Packages.css'

/**
 * ÇALIŞMA MODELİ / KAPSAMLAR — /paketler
 *
 * Paket adı, açıklaması ve kapsamı kürate edilmiş sabit içeriktir; YALNIZCA
 * fiyat alanları admin panelinden gelir. Fiyat girilmemişse sayfa sessizce
 * fiyatsız hâline döner — uydurma tutar gösterilmez.
 */
export default function Packages() {
  const [prices, setPrices] = useState({})

  useSEO({
    title: 'Sosyal Medya Hizmet Kapsamları | Kade New Media',
    description: 'Düzenli içerik, reklam yönetimi ve proje bazlı prodüksiyon ihtiyaçlarına göre şekillenen Kade New Media hizmet kapsamlarını inceleyin.',
    path: '/paketler',
  })

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
      .catch(() => { /* fiyatsız görünümde kal */ })
    return () => { cancelled = true }
  }, [])

  const faqItems = PACKAGE_FAQS.map(({ tr: [soru, cevap] }) => ({ soru, cevap }))

  return (
    <PageTransition>
      <FAQSchema items={faqItems} />

      <PageHero
        eyebrow="Çalışma modelimiz"
        title="İhtiyacınıza uygun kapsam"
        lead="Paket adları değil, kapsamlar üzerinden çalışıyoruz. Her kapsam yazılı olarak tanımlanır; ihtiyacınıza göre birleştirilebilir."
        meta={[['Kapsam', String(PACKAGE_SCOPES.length)], ['Sözleşme', 'Aylık veya proje bazlı']]}
        actions={<Button to="/teklif-al" variant="primary">Size özel teklif alın</Button>}
      />

      {/* ── KAPSAMLAR ────────────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Kapsamlar"
            title="Nasıl çalışıyoruz"
            index={`01 — ${String(PACKAGE_SCOPES.length).padStart(2, '0')}`}
          />
          <div className="pk-grid">
            {PACKAGE_SCOPES.map((scope, index) => {
              const price = prices[scope.id]
              return (
                <Reveal key={scope.id} className="pk-card" delay={index * 80}>
                  <div className="pk-card__head">
                    <span className="pk-card__index">{String(index + 1).padStart(2, '0')}</span>
                    <h3 className="pk-card__title">{scope.nameTr}</h3>
                    <p className="pk-card__desc">{scope.descTr}</p>
                  </div>

                  {/* Fiyat YALNIZCA admin'de girilmişse gösterilir. */}
                  {(price?.priceTRY || price?.priceUSD) && (
                    <p className="pk-card__price">
                      {price.priceTRY && <span>{price.priceTRY}</span>}
                      {price.priceNote && <small>{price.priceNote}</small>}
                    </p>
                  )}

                  <ul className="pk-card__features">
                    {scope.featuresTr.map((feature) => (
                      <li key={feature}>
                        <span className="pk-card__check" aria-hidden="true">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button to="/teklif-al" variant="outline" className="pk-card__cta">
                    Bu kapsam için teklif al
                  </Button>
                </Reveal>
              )
            })}
          </div>

          {/* Fiyat listesi yayınlanmıyor — bunu gizlemek yerine açıkça söyle. */}
          <Reveal className="pk-note">
            <p>
              Sabit fiyat listesi yayınlamıyoruz: kapsam, kanal sayısı ve üretim
              hacmi projeden projeye değişiyor. Kısa bir brief sonrası yazılı ve
              kalem kalem ayrıştırılmış teklif hazırlıyoruz.
            </p>
            <LinkArrow to="/teklif-al">Teklif formunu doldur</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      {/* ── NET KOŞULLAR ─────────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Net koşullar" title="Sık sorulan sorular" index="02" />
          <div className="pk-faq">
            {faqItems.map((item, index) => (
              <Reveal key={item.soru} delay={Math.min(index, 4) * 70}>
                <details className="pk-faq__item">
                  <summary className="pk-faq__q">{item.soru}</summary>
                  <p className="pk-faq__a">{item.cevap}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <ContactCTA
        title="Kapsamı birlikte belirleyelim"
        text="İhtiyacınızı paylaşın; hangi kapsamın uygun olduğunu ve neyi kapsamadığını açıkça yazalım."
      />
    </PageTransition>
  )
}
