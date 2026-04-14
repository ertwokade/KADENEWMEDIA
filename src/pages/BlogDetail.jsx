import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineClock, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineShare } from 'react-icons/hi'
import { FaLinkedinIn } from 'react-icons/fa6'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import DOMPurify from 'dompurify'
import { analytics } from '../utils/analytics'
import PageTransition from '../components/PageTransition'
import { FadeIn } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Blog.css'

export default function BlogDetail() {
  const { slug } = useParams()
  const { lang, t } = useLanguage()
  const [allPosts, setAllPosts] = useState(staticBlogPosts)

  useEffect(() => {
    getBlogsApi()
      .then(data => {
        if (!Array.isArray(data) || !data.length) return
        setAllPosts(prev => {
          const slugMap = new Map(data.map(p => [p.slug, p]))
          const merged = prev.map(p => slugMap.get(p.slug) || p)
          const existingSlugs = new Set(prev.map(p => p.slug))
          const newPosts = data.filter(p => !existingSlugs.has(p.slug))
          return [...merged, ...newPosts]
        })
      })
      .catch(() => {})
  }, [slug])

  const post = allPosts.find((p) => p.slug === slug)

  const title = post ? (lang === 'tr' ? post.titleTr : post.titleEn) : ''
  const excerpt = post ? (lang === 'tr' ? post.excerptTr : post.excerptEn) : ''
  const content = post ? (lang === 'tr' ? post.contentTr : post.contentEn) : ''
  const category = post ? (lang === 'tr' ? post.category : post.categoryEn) : ''

  useSEO({
    title: title || 'Blog | Kade Media',
    description: excerpt || '',
    path: `/blog/${slug}`,
    type: 'article',
  })

  useEffect(() => {
    if (post) analytics.blogRead(slug, title)
  }, [post, slug, title])

  useEffect(() => {
    if (!post) return
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: excerpt,
      datePublished: post.date,
      author: { '@type': 'Organization', name: 'Kade Media', url: 'https://kademedia.com.tr' },
      publisher: {
        '@type': 'Organization',
        name: 'Kade Media',
        logo: { '@type': 'ImageObject', url: 'https://kademedia.com.tr/favicon.png' },
      },
      url: `https://kademedia.com.tr/blog/${slug}`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `https://kademedia.com.tr/blog/${slug}` },
      ...(post.image && post.image.startsWith('http') ? { image: post.image } : {}),
    }
    const el = document.getElementById('jsonld-article')
    if (el) { el.textContent = JSON.stringify(schema) } else {
      const s = document.createElement('script')
      s.id = 'jsonld-article'
      s.type = 'application/ld+json'
      s.textContent = JSON.stringify(schema)
      document.head.appendChild(s)
    }
    return () => { document.getElementById('jsonld-article')?.remove() }
  }, [post, slug, title, excerpt])

  // Only redirect after both static + API data have been checked
  if (!post) return <Navigate to="/blog" replace />

  const postUrl = `https://kademedia.com.tr/blog/${slug}`
  const encodedUrl = encodeURIComponent(postUrl)
  const encodedTitle = encodeURIComponent(title)

  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3)

  return (
    <PageTransition>
      {/* Hero */}
      <section className="blog-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <Link to="/blog" className="partner-back" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
              <HiOutlineArrowLeft size={16} />
              {lang === 'tr' ? 'Tüm Yazılar' : 'All Posts'}
            </Link>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="blog-meta" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <span className="blog-category" style={{ color: post.color }}>{category}</span>
              <span className="blog-date">{post.date}</span>
              <span className="blog-read">
                <HiOutlineClock size={14} />
                {post.readTime} {t('blog.min')}
              </span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', maxWidth: '800px', margin: '0 auto 20px' }}>
              {title}
            </h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto' }}>{excerpt}</p>
          </FadeIn>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div className="blog-detail-layout">
            {/* Featured image */}
            <FadeIn>
              <div
                className="blog-detail-image glass-card"
                style={{ background: `${post.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px', fontSize: '5rem', marginBottom: '32px', borderRadius: '16px' }}
              >
                {post.image && post.image.startsWith('http') ? (
                  <img src={post.image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = `linear-gradient(135deg, ${post.color}33, ${post.color}11)` }} />
                ) : (
                  <span>{post.image}</span>
                )}
              </div>
            </FadeIn>

            {/* Article body */}
            <FadeIn delay={0.1}>
              <div className="blog-detail-content glass-card">
                {content ? (
                  <div className="blog-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {lang === 'tr' ? 'İçerik yakında eklenecek.' : 'Content coming soon.'}
                  </p>
                )}
              </div>
            </FadeIn>

            {/* Share */}
            <FadeIn delay={0.15}>
              <div className="blog-share-section glass-card" style={{ marginTop: '24px' }}>
                <div className="blog-share-left">
                  <HiOutlineShare size={20} />
                  <span>{lang === 'tr' ? 'Bu yazıyı paylaş' : 'Share this post'}</span>
                </div>
                <div className="blog-share-buttons">
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="blog-share-btn" aria-label="Share on LinkedIn">
                    <FaLinkedinIn size={16} />
                  </a>
                  <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="blog-share-btn" aria-label="Share on WhatsApp">
                    <FaWhatsapp size={16} />
                  </a>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Lead CTA */}
          <FadeIn delay={0.2}>
            <div className="blog-cta-section glass-card" style={{ marginTop: '32px' }}>
              <div className="blog-cta-icon">
                <HiOutlineArrowRight size={28} />
              </div>
              <h3>{lang === 'tr' ? 'Markanız İçin Ücretsiz Strateji Analizi' : 'Free Strategy Analysis for Your Brand'}</h3>
              <p>
                {lang === 'tr'
                  ? 'Bu yazıda anlattıklarımızı markanıza nasıl uygulayacağınızı merak ediyorsanız, 30 dakikalık ücretsiz keşif görüşmesiyle somut öneriler alın.'
                  : 'Wondering how to apply what you read here to your brand? Get concrete recommendations with a free 30-minute discovery call.'}
              </p>
              <div className="blog-cta-actions">
                <Link to="/iletisim" className="btn btn-primary" onClick={() => analytics.ctaClick('blog-cta', '/iletisim')}>
                  {lang === 'tr' ? 'Ücretsiz Görüşme Al' : 'Get a Free Consultation'}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/hizmetler" className="btn btn-outline" onClick={() => analytics.ctaClick('blog-services', '/hizmetler')}>
                  {lang === 'tr' ? 'Hizmetleri İncele' : 'View Services'}
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* More Posts */}
          {otherPosts.length > 0 && (
            <FadeIn delay={0.2}>
              <div style={{ marginTop: '64px' }}>
                <h3 style={{ color: 'var(--white)', marginBottom: '24px', fontSize: '1.3rem' }}>
                  {lang === 'tr' ? 'Diğer Yazılar' : 'More Posts'}
                </h3>
                <div className="blog-grid">
                  {otherPosts.map((p) => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <motion.div className="blog-card glass-card" whileHover={{ y: -4 }}>
                        <div className="blog-card-image" style={{ background: `${p.color}15` }}>
                          {p.image && p.image.startsWith('http') ? (
                            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = `linear-gradient(135deg, ${p.color}33, ${p.color}11)` }} />
                          ) : (
                            <span>{p.image}</span>
                          )}
                        </div>
                        <div className="blog-card-content">
                          <div className="blog-meta">
                            <span className="blog-category" style={{ color: p.color }}>
                              {lang === 'tr' ? p.category : p.categoryEn}
                            </span>
                            <span className="blog-date">{p.date}</span>
                          </div>
                          <h3>{lang === 'tr' ? p.titleTr : p.titleEn}</h3>
                          <p>{lang === 'tr' ? p.excerptTr : p.excerptEn}</p>
                          <div className="blog-card-footer">
                            <span className="blog-read">
                              <HiOutlineClock size={14} />
                              {p.readTime} {t('blog.min')}
                            </span>
                            <span className="blog-read-link">
                              {t('blog.readMore')} <HiOutlineArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </PageTransition>
  )
}
