import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlinePencilAlt, HiOutlineArrowRight, HiOutlineClock, HiOutlineShare, HiOutlineLightningBolt, HiOutlineSearch, HiOutlineX } from 'react-icons/hi'
import { FaXTwitter, FaLinkedinIn } from 'react-icons/fa6'
import { FaWhatsapp } from 'react-icons/fa'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import PageHeroCanvas from '../components/PageHeroCanvas'
import './Blog.css'

export default function Blog() {
  const { lang, t } = useLanguage()
  useSEO({
    title: 'Blog | Sosyal Medya ve Dijital Pazarlama İpuçları',
    description: 'Sosyal medya stratejileri, Instagram büyüme taktikleri, TikTok algoritması ve dijital pazarlama hakkında güncel blog yazıları. Kade Media Blog.',
    keywords: 'sosyal medya blog, instagram taktikleri, tiktok algoritması, dijital pazarlama ipuçları, içerik stratejisi',
    path: '/blog',
  })
  const [blogPosts, setBlogPosts] = useState(staticBlogPosts)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogsApi()
        if (data && data.length > 0) {
          setBlogPosts(data)
        }
      } catch {
        // static data fallback
      }
    }
    fetchBlogs()
  }, [])

  const categories = useMemo(() => {
    const cats = blogPosts.map(p => lang === 'tr' ? p.category : p.categoryEn).filter(Boolean)
    return ['all', ...Array.from(new Set(cats))]
  }, [blogPosts, lang])

  const filtered = useMemo(() => {
    return blogPosts.filter(p => {
      const title = lang === 'tr' ? p.titleTr : p.titleEn
      const excerpt = lang === 'tr' ? p.excerptTr : p.excerptEn
      const cat = lang === 'tr' ? p.category : p.categoryEn
      const matchesSearch = !search || title?.toLowerCase().includes(search.toLowerCase()) || excerpt?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'all' || cat === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [blogPosts, search, activeCategory, lang])

  if (blogPosts.length === 0) return null

  const featured = filtered[0]
  const rest = filtered.slice(1)

  return (
    <PageTransition>
      <PageHeroCanvas type="blog" />
      <section className="blog-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="glow-effect" style={{ top: '-150px', right: '-100px' }} />
        <div className="container">
          <FadeIn>
            <div className="section-badge">
              <HiOutlinePencilAlt size={14} />
              {t('blog.badge')}
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              {t('blog.title')}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="section-subtitle">{t('blog.subtitle')}</p>
          </FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">

          {/* Search + Filter Bar */}
          <FadeIn>
            <div className="blog-filter-bar">
              <div className="blog-search-wrapper">
                <HiOutlineSearch size={18} className="blog-search-icon" />
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Blog yazısı ara...' : 'Search posts...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="blog-search-input"
                />
                {search && (
                  <button className="blog-search-clear" onClick={() => setSearch('')}>
                    <HiOutlineX size={16} />
                  </button>
                )}
              </div>
              <div className="blog-category-chips">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`blog-category-chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat === 'all' ? (lang === 'tr' ? 'Tümü' : 'All') : cat}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {filtered.length === 0 ? (
            <FadeIn>
              <div className="blog-empty-state">
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
                <h3>{lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}</h3>
                <p>{lang === 'tr' ? 'Farklı bir arama deneyin veya filtreyi kaldırın.' : 'Try a different search or remove the filter.'}</p>
                <button className="btn btn-outline" onClick={() => { setSearch(''); setActiveCategory('all') }} style={{ marginTop: 16 }}>
                  {lang === 'tr' ? 'Filtreyi Temizle' : 'Clear Filter'}
                </button>
              </div>
            </FadeIn>
          ) : (
            <>
          {/* Featured Post */}
          {featured && (
          <FadeIn>
            <Link to={`/blog/${featured.slug}`} style={{ textDecoration: 'none' }}>
              <motion.div className="blog-featured glass-card" whileHover={{ y: -4 }}>
                <div className="blog-featured-image" style={{ background: `${featured.color}15` }}>
                  {featured.image && featured.image.startsWith('http') ? (
                    <img src={featured.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{featured.image}</span>
                  )}
                </div>
                <div className="blog-featured-content">
                  <div className="blog-meta">
                    <span className="blog-category" style={{ color: featured.color }}>
                      {lang === 'tr' ? featured.category : featured.categoryEn}
                    </span>
                    <span className="blog-date">{featured.date}</span>
                    <span className="blog-read">
                      <HiOutlineClock size={14} />
                      {featured.readTime} {t('blog.min')}
                    </span>
                  </div>
                  <h2>{lang === 'tr' ? featured.titleTr : featured.titleEn}</h2>
                  <p>{lang === 'tr' ? featured.excerptTr : featured.excerptEn}</p>
                  <span className="btn btn-primary blog-read-btn">
                    {t('blog.readMore')}
                    <HiOutlineArrowRight size={16} />
                  </span>
                </div>
              </motion.div>
            </Link>
          </FadeIn>
          )}

          {/* Blog Grid */}
          <StaggerContainer className="blog-grid" staggerDelay={0.1}>
            {rest.map((post, idx) => (
              <StaggerItem key={post._id || post.slug || idx}>
                <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                  <motion.div className="blog-card glass-card" whileHover={{ y: -4 }}>
                    <div className="blog-card-image" style={{ background: `${post.color}15` }}>
                      {post.image && post.image.startsWith('http') ? (
                        <img src={post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{post.image}</span>
                      )}
                    </div>
                    <div className="blog-card-content">
                      <div className="blog-meta">
                        <span className="blog-category" style={{ color: post.color }}>
                          {lang === 'tr' ? post.category : post.categoryEn}
                        </span>
                        <span className="blog-date">{post.date}</span>
                      </div>
                      <h3>{lang === 'tr' ? post.titleTr : post.titleEn}</h3>
                      <p>{lang === 'tr' ? post.excerptTr : post.excerptEn}</p>
                      <div className="blog-card-footer">
                        <span className="blog-read">
                          <HiOutlineClock size={14} />
                          {post.readTime} {t('blog.min')}
                        </span>
                        <span className="blog-read-link">
                          {t('blog.readMore')} →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
            </>
          )}

          {/* Share Section */}
          <FadeIn delay={0.2}>
            <div className="blog-share-section glass-card">
              <div className="blog-share-left">
                <HiOutlineShare size={20} />
                <span>{lang === 'tr' ? 'İçeriklerimizi paylaşın' : 'Share our content'}</span>
              </div>
              <div className="blog-share-buttons">
                <a
                  href="https://x.com/intent/tweet?text=Kade%20Media%20Blog%20-%20Dijital%20Pazarlama%20İpuçları&url=https://kademedia.com.tr/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-share-btn"
                  aria-label="Share on X"
                >
                  <FaXTwitter size={16} />
                </a>
                <a
                  href="https://www.linkedin.com/sharing/share-offsite/?url=https://kademedia.com.tr/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-share-btn"
                  aria-label="Share on LinkedIn"
                >
                  <FaLinkedinIn size={16} />
                </a>
                <a
                  href="https://wa.me/?text=Kade%20Media%20Blog%20-%20https://kademedia.com.tr/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-share-btn"
                  aria-label="Share on WhatsApp"
                >
                  <FaWhatsapp size={16} />
                </a>
              </div>
            </div>
          </FadeIn>

          {/* CTA Section */}
          <FadeIn delay={0.3}>
            <div className="blog-cta-section glass-card">
              <div className="blog-cta-icon">
                <HiOutlineLightningBolt size={28} />
              </div>
              <h3>{lang === 'tr' ? 'Markanızı Büyütmeye Hazır mısınız?' : 'Ready to Grow Your Brand?'}</h3>
              <p>
                {lang === 'tr'
                  ? 'Sosyal medya stratejinizi profesyonel ekibimizle bir üst seviyeye taşıyın. Ücretsiz keşif görüşmesi için hemen iletişime geçin.'
                  : 'Take your social media strategy to the next level with our professional team. Contact us for a free discovery call.'}
              </p>
              <div className="blog-cta-actions">
                <Link to="/iletisim" className="btn btn-primary">
                  {lang === 'tr' ? 'Ücretsiz Teklif Alın' : 'Get a Free Quote'}
                  <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/paketler" className="btn btn-outline">
                  {lang === 'tr' ? 'Paketleri İncele' : 'View Packages'}
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PageTransition>
  )
}
