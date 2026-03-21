import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlinePencilAlt, HiOutlineArrowRight, HiOutlineClock } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { blogPosts as staticBlogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import './Blog.css'

export default function Blog() {
  const { lang, t } = useLanguage()
  const [blogPosts, setBlogPosts] = useState(staticBlogPosts)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await getBlogsApi()
        if (data && data.length > 0) {
          setBlogPosts(data)
        }
      } catch (err) {
        console.log('Using static blog data')
      }
    }
    fetchBlogs()
  }, [])

  if (blogPosts.length === 0) return null

  return (
    <PageTransition>
      <section className="blog-hero">
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
            <motion.div className="blog-featured glass-card" whileHover={{ y: -4 }}>
              <div className="blog-featured-image" style={{ background: `${blogPosts[0].color}15` }}>
                <span>{blogPosts[0].image}</span>
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
                <button className="btn btn-primary blog-read-btn">
                  {t('blog.readMore')}
                  <HiOutlineArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </FadeIn>

          {/* Blog Grid */}
          <StaggerContainer className="blog-grid" staggerDelay={0.1}>
            {blogPosts.slice(1).map((post, idx) => (
              <StaggerItem key={post._id || post.id || idx}>
                <motion.div className="blog-card glass-card" whileHover={{ y: -4 }}>
                  <div className="blog-card-image" style={{ background: `${post.color}15` }}>
                    <span>{post.image}</span>
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
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PageTransition>
  )
}
