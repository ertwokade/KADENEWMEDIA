import { useSEO } from '../hooks/useSEO'
import { useSiteContent } from '../hooks/useSiteContent'
import { useLanguage } from '../i18n/LanguageContext'
import { ABOUT_CONTENT_FALLBACK } from '../data/about'
import { BRAND } from '../config/brand'
import { isImageSource, toBadgeText } from '../utils/mediaValue'
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
import './About.css'

/**
 * HAKKIMIZDA — /hakkimizda
 *
 * Uzun tek metin bloğundan bölümlere ayrıldı: manifesto → hikâye →
 * değerler → çalışma prensipleri → ekip → hizmet alanları → CTA.
 *
 * Metin tabanı i18n çevirilerinden, sayısal ve ekip bilgisi admin
 * panelinden gelir (useSiteContent). Ekip fotoğrafı yoksa STOK İNSAN
 * FOTOĞRAFI üretilmez; baş harf rozeti gösterilir.
 */

const VALUE_KEYS = ['creativity', 'transparency', 'quality', 'passion', 'teamwork', 'reliability']

const PRINCIPLES = [
  ['Yazılı kapsam', 'Ne yapacağımız, neyi kapsamadığımız ve teslim tarihleri tekliften önce yazılır.'],
  ['Tek ekip', 'Strateji, içerik, reklam ve prodüksiyon aynı ekipte; koordinasyon yükü sizde kalmaz.'],
  ['Ölçülebilir iş', 'Her dönem aynı göstergelerle raporlanır; dönemleri karşılaştırabilirsiniz.'],
  ['Marka önce', 'Trend uğruna marka dilinden ödün verilmez; format markaya uyarlanır.'],
]

const FIELDS = [
  'Sosyal medya yönetimi', 'İçerik üretimi', 'Dijital reklam',
  'Video prodüksiyon', 'Strateji ve danışmanlık', 'Web sitesi tasarımı',
]

export default function About() {
  const { t } = useLanguage()
  const { content } = useSiteContent('about', ABOUT_CONTENT_FALLBACK)

  useSEO({
    title: 'Kade Media Hakkında | New Media Ajansı İstanbul',
    description: 'Kade Media; Kade New Media, Kademedia ve Kadenewmedia adlarıyla da aranan İstanbul merkezli new media ve dijital pazarlama ajansıdır.',
    path: '/hakkimizda',
  })

  const story = [content.storyTr || t('about.storyP1'), t('about.storyP2')].filter(Boolean)
  const team = Array.isArray(content.team) ? content.team : []

  // Sayaçlar yalnız gerçek değer girilmişse gösterilir (varsayılan "—").
  const stats = [
    ['Deneyim', content.experience],
    ['Ekip', content.teamSize],
    ['Marka', content.clients],
  ].filter(([, value]) => value && value !== '—')

  return (
    <PageTransition>
      <PageHero
        eyebrow="Hakkımızda"
        title="Markaları dijitalde büyütüyoruz"
        lead={content.missionTr || 'Strateji, içerik, reklam ve prodüksiyonu tek çatı altında birleştiren İstanbul merkezli bir new media ajansıyız.'}
        meta={stats.length ? stats : [['Merkez', BRAND.city], ['Alan', 'New media']]}
        actions={
          <>
            <Button to="/teklif-al" variant="primary">Teklif al</Button>
            <Button to="/portfolio" variant="outline">İşlerimiz</Button>
          </>
        }
      />

      {/* ── MANİFESTO ────────────────────────────────────────────── */}
      <Section className="ab-manifesto">
        <Container>
          <Reveal variant="clip">
            <p className="ab-manifesto__text">
              Her markanın anlatacak bir hikâyesi var. Bizim işimiz o hikâyeyi
              doğru kanalda, doğru formatta ve tutarlı bir dille anlatmak.
            </p>
          </Reveal>
        </Container>
      </Section>

      <Marquee items={FIELDS.map((field) => field.toUpperCase())} ariaLabel="Hizmet alanlarımız" />

      {/* ── HİKÂYE ───────────────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Hikâyemiz" title={t('about.storyTitle')} index="01" />
          <div className="ab-story">
            {story.map((paragraph, index) => (
              <Reveal key={index} delay={index * 80}>
                <p className="ab-story__p">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── DEĞERLER ─────────────────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Değerler" title="Neye önem veriyoruz" index="02" />
          <div className="ab-values">
            {VALUE_KEYS.map((key, index) => (
              <Reveal key={key} className="ab-value" delay={Math.min(index, 5) * 60}>
                <span className="ab-value__index">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="ab-value__title">{t(`about.${key}`)}</h3>
                <p className="ab-value__text">{t(`about.${key}Desc`)}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── ÇALIŞMA PRENSİPLERİ ──────────────────────────────────── */}
      <Section>
        <Container>
          <SectionHeading eyebrow="Prensipler" title="Nasıl çalışıyoruz" index="03" />
          <ol className="ab-principles">
            {PRINCIPLES.map(([title, text], index) => (
              <Reveal as="li" key={title} className="ab-principle" delay={Math.min(index, 4) * 70}>
                <span className="ab-principle__step">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="ab-principle__title">{title}</h3>
                  <p className="ab-principle__text">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </Section>

      {/* ── EKİP — yalnız gerçek kayıt varsa ─────────────────────── */}
      {team.length > 0 && (
        <Section>
          <Container>
            <SectionHeading eyebrow="Ekip" title="Kimlerle çalışıyorsunuz" index="04" />
            <div className="ab-team">
              {team.map((member, index) => (
                <Reveal key={member.name} className="ab-member" delay={Math.min(index, 4) * 70}>
                  <div className="ab-member__avatar">
                    {isImageSource(member.avatar || member.image) ? (
                      <img
                        src={member.avatar || member.image}
                        alt={member.name}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span aria-hidden="true">{toBadgeText('', member.name)}</span>
                    )}
                  </div>
                  <h3 className="ab-member__name">{member.name}</h3>
                  {member.roleTr && <p className="ab-member__role">{member.roleTr}</p>}
                  {member.bioTr && <p className="ab-member__bio">{member.bioTr}</p>}
                </Reveal>
              ))}
            </div>
            <Reveal className="ab-more">
              <LinkArrow to="/ekip">Ekip sayfası</LinkArrow>
            </Reveal>
          </Container>
        </Section>
      )}

      {/* ── HİZMET ALANLARI ──────────────────────────────────────── */}
      <Section tight>
        <Container>
          <SectionHeading eyebrow="Alanlar" title="Hizmet verdiğimiz konular" as="h2" />
          <ul className="ab-fields">
            {FIELDS.map((field) => <li key={field}>{field}</li>)}
          </ul>
          <Reveal className="ab-more">
            <LinkArrow to="/hizmetler">Hizmet detayları</LinkArrow>
          </Reveal>
        </Container>
      </Section>

      <ContactCTA
        title="Birlikte çalışalım"
        text="Markanızın dijitalde nerede olduğunu ve nereye gitmek istediğinizi konuşalım."
      />
    </PageTransition>
  )
}
