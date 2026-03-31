import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlinePencilAlt, HiOutlineArrowRight, HiOutlineClock, HiOutlineShare, HiOutlineLightningBolt } from 'react-icons/hi'
import { FaXTwitter, FaLinkedinIn, FaWhatsapp } from 'react-icons/fa6'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
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

  if (blogPosts.length === 0) return null

  return (
    <PageTransition>
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
          {/* Featured Post */}
          <FadeIn>
            <Link to={`/blog/${blogPosts[0].slug}`} style={{ textDecoration: 'none' }}>
              <motion.div className="blog-featured glass-card" whileHover={{ y: -4 }}>
                <div className="blog-featured-image" style={{ background: `${blogPosts[0].color}15` }}>
                  {blogPosts[0].image && blogPosts[0].image.startsWith('http') ? (
                    <img src={blogPosts[0].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{blogPosts[0].image}</span>
                  )}
                </div>
                <div className="blog-featured-content">
                  <div className="blog-meta">
                    <span className="blog-category" style={{ color: blogPosts[0].color }}>
                      {lang === 'tr' ? blogPosts[0].category : blogPosts[0].categoryEn}
                    </span>
                    <span className="blog-date">{blogPosts[0].date}</span>
                    <span className="blog-read">
                      <HiOutlineClock size={14} />
                      {blogPosts[0].readTime} {t('blog.min')}
                    </span>
                  </div>
                  <h2>{lang === 'tr' ? blogPosts[0].titleTr : blogPosts[0].titleEn}</h2>
                  <p>{lang === 'tr' ? blogPosts[0].excerptTr : blogPosts[0].excerptEn}</p>
                  <span className="btn btn-primary blog-read-btn">
                    {t('blog.readMore')}
                    <HiOutlineArrowRight size={16} />
                  </span>
                </div>
              </motion.div>
            </Link>
          </FadeIn>

          {/* Blog Grid */}
          <StaggerContainer className="blog-grid" staggerDelay={0.1}>
            {blogPosts.slice(1).map((post, idx) => (
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
