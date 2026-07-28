import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { isImageSource, toBadgeText } from '../../utils/mediaValue'
import './system.css'

// Yalnız bileşenler re-export edilir. `prefersReducedMotion` ve
// `hasBrandAssets` gibi yardımcılar kendi modüllerinden import edilmeli
// (Fast Refresh barrel dosyasında karışık export'larla çalışmaz).
export { default as Reveal, RevealGroup } from './Reveal'
export { default as Logo } from './Logo'

/* ---------------------------------------------------------------------------
   Container / Section — sayfa ritmi
--------------------------------------------------------------------------- */

export function Container({ as = 'div', size, className = '', children, ...rest }) {
  const Tag = as
  const modifier = size ? ` kade-container--${size}` : ''
  return (
    <Tag className={`kade-container${modifier}${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </Tag>
  )
}

export function Section({ as = 'section', tight = false, flushTop = false, className = '', children, ...rest }) {
  const Tag = as
  return (
    <Tag
      className={`kade-section${tight ? ' kade-section--tight' : ''}${flushTop ? ' kade-section--flush-top' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ---------------------------------------------------------------------------
   Tipografi
--------------------------------------------------------------------------- */

export function Eyebrow({ children, className = '', ...rest }) {
  return <span className={`kade-eyebrow${className ? ` ${className}` : ''}`} {...rest}>{children}</span>
}

/**
 * Bölüm başlığı: eyebrow + başlık (+ sağda sayaç/etiket).
 * `as` ile doğru başlık düzeyini verin — sayfada tek h1 kuralı korunmalı.
 */
export function SectionHeading({ eyebrow, title, index, as = 'h2', description, className = '' }) {
  const Heading = as
  return (
    <Reveal className={`kade-section-head${className ? ` ${className}` : ''}`}>
      <div className="kade-section-head__text">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading className="kade-display kade-h3">{title}</Heading>
        {description && <p className="kade-body">{description}</p>}
      </div>
      {index && <span className="kade-section-head__index">{index}</span>}
    </Reveal>
  )
}

/* ---------------------------------------------------------------------------
   Sayfa hero — bütün iç sayfaların ortak girişi
--------------------------------------------------------------------------- */

/**
 * @param {string} eyebrow  Kategori etiketi
 * @param {string} title    Sayfa başlığı (h1)
 * @param {string} lead     Kısa giriş metni
 * @param {Array<[string,string]>} meta  [etiket, değer] çiftleri
 * @param {ReactNode} actions  CTA düğmeleri
 */
export function PageHero({ eyebrow, title, lead, meta = [], actions, children, className = '' }) {
  return (
    <header className={`kade-pagetop${className ? ` ${className}` : ''}`}>
      <div className="kade-pagetop__grid" aria-hidden="true" />
      <Container>
        <div className="kade-pagetop__inner">
          {eyebrow && <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>}
          <Reveal delay={60} variant="clip">
            <h1 className="kade-pagetop__title">{title}</h1>
          </Reveal>
          {lead && <Reveal delay={120}><p className="kade-lead">{lead}</p></Reveal>}
          {meta.length > 0 && (
            <Reveal delay={180}>
              <dl className="kade-pagetop__meta">
                {meta.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
          {actions && <Reveal delay={240}><div className="kade-cta__actions">{actions}</div></Reveal>}
          {children}
        </div>
      </Container>
    </header>
  )
}

/* ---------------------------------------------------------------------------
   Buton ve bağlantı
--------------------------------------------------------------------------- */

/**
 * `to` verilirse react-router Link, `href` verilirse <a>, ikisi de yoksa
 * <button> render eder. Placeholder `#` hedefi bilerek desteklenmez.
 */
export function Button({ to, href, variant = 'primary', children, className = '', ...rest }) {
  const cls = `kade-btn kade-btn--${variant}${className ? ` ${className}` : ''}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) {
    const external = /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        className={cls}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return <button type="button" className={cls} {...rest}>{children}</button>
}

export function LinkArrow({ to, href, children, className = '', ...rest }) {
  const content = (
    <>
      <span>{children}</span>
      <span className="kade-link__arrow" aria-hidden="true">→</span>
    </>
  )
  const cls = `kade-link${className ? ` ${className}` : ''}`
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>
  return (
    <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
      {content}
    </a>
  )
}

/* ---------------------------------------------------------------------------
   Medya — görsel/video, fallback zorunlu
--------------------------------------------------------------------------- */

/**
 * Görsel veya video gösterir. Kaynak yoksa VEYA yüklenemezse alan boş
 * kalmaz: markalı bir fallback (emoji/harf rozeti) çizilir.
 *
 * `aspect` her zaman verilir → görsel inmeden yer ayrılır, layout shift olmaz.
 */
export function Media({
  src,
  poster,
  alt = '',
  fallback,
  aspect,
  loading = 'lazy',
  className = '',
}) {
  const isVideo = typeof src === 'string' && /\.(mp4|webm|mov)(\?|#|$)/i.test(src)
  const usable = isImageSource(src) || isVideo
  const style = aspect ? { aspectRatio: aspect } : undefined

  if (!usable) {
    return (
      <div className={`kade-card__media${className ? ` ${className}` : ''}`} style={style}>
        <span className="kade-card__fallback" aria-hidden="true">{toBadgeText(fallback ?? src, alt)}</span>
      </div>
    )
  }

  return (
    <div className={`kade-card__media${className ? ` ${className}` : ''}`} style={style}>
      {isVideo ? (
        <video
          src={src}
          poster={poster || undefined}
          // Otomatik oynatma yalnız sessiz + inline olduğunda mobilde çalışır.
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt || undefined}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          // Yüklenemezse kutuyu boş bırakma: fallback rozetine düş.
          onError={(event) => {
            const box = event.currentTarget.parentElement
            if (!box) return
            event.currentTarget.remove()
            const span = document.createElement('span')
            span.className = 'kade-card__fallback'
            span.setAttribute('aria-hidden', 'true')
            span.textContent = toBadgeText(fallback, alt)
            box.appendChild(span)
          }}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Kartlar
--------------------------------------------------------------------------- */

/**
 * Proje kartı. `to` verilmezse (ör. detay içeriği henüz yoksa) tıklanabilir
 * olmaz — placeholder link üretilmez.
 */
export function ProjectCard({ project, index, featured = false }) {
  const { slug, title, category, year, excerpt, cover, coverAlt, emoji } = project
  const Wrapper = slug ? Link : 'article'
  const wrapperProps = slug ? { to: `/portfolio/${slug}` } : {}

  return (
    <Wrapper className={`kade-card${featured ? ' kade-card--featured' : ''}`} {...wrapperProps}>
      <Media
        src={cover}
        alt={coverAlt || title}
        fallback={emoji}
        loading={index === 0 ? 'eager' : 'lazy'}
      />
      <div className="kade-card__body">
        <div className="kade-card__meta">
          <span>{category}</span>
          {year && <span>{year}</span>}
        </div>
        <h3 className="kade-card__title">{title}</h3>
        {excerpt && <p className="kade-card__desc">{excerpt}</p>}
      </div>
    </Wrapper>
  )
}

export function ServiceCard({ service, index }) {
  const { to, title, description } = service
  const Wrapper = to ? Link : 'div'
  const wrapperProps = to ? { to } : {}
  return (
    <Wrapper className="kade-service-card" {...wrapperProps}>
      <span className="kade-service-card__index">{String(index + 1).padStart(2, '0')}</span>
      <h3 className="kade-service-card__title">{title}</h3>
      {description && <p className="kade-service-card__desc">{description}</p>}
    </Wrapper>
  )
}

/* ---------------------------------------------------------------------------
   Marquee
--------------------------------------------------------------------------- */

export function Marquee({ items, ariaLabel }) {
  // İçerik iki kez basılır: -50% kaydırma kesintisiz döngü verir.
  const doubled = [...items, ...items]
  return (
    <div className="kade-marquee" role="marquee" aria-label={ariaLabel}>
      <div className="kade-marquee__track">
        {doubled.map((item, i) => (
          <span className="kade-marquee__item" key={`${item}-${i}`} aria-hidden={i >= items.length}>
            {item}
            <span className="kade-marquee__dot" aria-hidden="true">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Kapanış CTA — her sayfanın sonu
--------------------------------------------------------------------------- */

export function ContactCTA({
  title = 'Birlikte büyüyelim',
  text = 'Markanız için sosyal medya, içerik, reklam veya prodüksiyon planınızı konuşalım.',
  primary = { to: '/teklif-al', label: 'Teklif al' },
  secondary = { to: '/iletisim', label: 'İletişime geç' },
}) {
  return (
    <section className="kade-cta">
      <Container>
        <Reveal variant="clip">
          <h2 className="kade-cta__title">{title}</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="kade-cta__text">{text}</p>
        </Reveal>
        <Reveal delay={140}>
          <div className="kade-cta__actions">
            {primary && <Button to={primary.to} href={primary.href} variant="primary">{primary.label}</Button>}
            {secondary && <Button to={secondary.to} href={secondary.href} variant="outline">{secondary.label}</Button>}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

/* ---------------------------------------------------------------------------
   Boş durum
--------------------------------------------------------------------------- */

export function EmptyState({ title, text, action }) {
  return (
    <div className="kade-empty">
      <h3 className="kade-empty__title">{title}</h3>
      {text && <p className="kade-empty__text">{text}</p>}
      {action}
    </div>
  )
}
