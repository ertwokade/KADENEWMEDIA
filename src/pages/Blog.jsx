import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowRight, HiOutlineBookOpen, HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { useSEO } from '../hooks/useSEO'
import { getBlogsApi } from '../api'
import PageTransition from '../components/PageTransition'
import { FadeIn, StaggerContainer, StaggerItem } from '../components/Animations'
import PageBgAnimation from '../components/PageBgAnimation'
import './Blog.css'

function formatDate(post, lang) {
  const raw = post.date || post.publishAt || post.createdAt
  if (!raw) return ''
  try {
    return new Date(raw).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function Blog() {
  const { lang } = useLanguage()
  const isEN = lang === 'en'
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useSEO({
    title: isEN ? 'Blog | Kade New Media' : 'Blog | Kade New Media',
    description: isEN ? 'Verified Kade New Media articles and practical notes.' : 'Doğrulanmış Kade New Media yazıları ve pratik notları.',
    path: '/blog',
    noindex: posts.length === 0,
  })

  useEffect(() => {
    let cancelled = false
    getBlogsApi()
      .then(data => { if (!cancelled) setPosts(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setPosts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const [featured, ...rest] = posts

  return (
    <PageTransition>
      <section className="blog-hero">
        <PageBgAnimation type="blog" />
        <div className="grid-bg" />
        <div className="container">
          <FadeIn><div className="section-badge"><HiOutlineBookOpen size={14} />{isEN ? 'Blog' : 'Blog'}</div></FadeIn>
          <FadeIn delay={0.1}><h1 className="section-title">{isEN ? 'Source-checked ' : 'Kaynağı kontrol edilmiş '}<span>{isEN ? 'articles' : 'yazılar'}</span></h1></FadeIn>
          <FadeIn delay={0.2}><p className="section-subtitle">{isEN ? 'Articles are published after their claims, dates, and sources are reviewed.' : 'Yazıları; iddiaları, tarihleri ve kaynakları kontrol ettikten sonra yayınlıyoruz.'}</p></FadeIn>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? null : posts.length === 0 ? (
            <div className="blog-empty-state glass-card">
              <h3>{isEN ? 'No verified article is currently public.' : 'Şu anda yayında doğrulanmış bir yazı yok.'}</h3>
              <p>{isEN ? 'Check back soon, or get in touch with a question.' : 'Yakında tekrar kontrol edin veya bir sorunuzla bize ulaşın.'}</p>
            </div>
          ) : (
            <>
              {featured && (
                <FadeIn>
                  <Link to={`/blog/${featured.slug}`} className="blog-featured glass-card">
                    <div className="blog-featured-image">
                      {featured.image ? <img src={featured.image} alt="" onError={(e) => e.currentTarget.setAttribute('data-failed', 'true')} /> : '📝'}
                    </div>
                    <div className="blog-featured-content">
                      <div className="blog-meta">
                        {featured.category && <span className="blog-category">{isEN ? (featured.categoryEn || featured.category) : featured.category}</span>}
                        <span className="blog-date"><HiOutlineCalendar size={12} /> {formatDate(featured, lang)}</span>
                        {featured.readTime && <span className="blog-read"><HiOutlineClock size={12} /> {featured.readTime}</span>}
                      </div>
                      <h2>{isEN ? (featured.titleEn || featured.titleTr) : featured.titleTr}</h2>
                      <p>{isEN ? (featured.excerptEn || featured.excerptTr) : featured.excerptTr}</p>
                      <span className="btn btn-outline blog-read-btn">{isEN ? 'Read article' : 'Yazıyı oku'} <HiOutlineArrowRight size={14} /></span>
                    </div>
                  </Link>
                </FadeIn>
              )}

              {rest.length > 0 && (
                <StaggerContainer className="blog-grid">
                  {rest.map(post => (
                    <StaggerItem key={post._id || post.slug}>
                      <Link to={`/blog/${post.slug}`} className="blog-card glass-card">
                        <div className="blog-card-image">
                          {post.image ? <img src={post.image} alt="" onError={(e) => e.currentTarget.setAttribute('data-failed', 'true')} /> : '📝'}
                        </div>
                        <div className="blog-card-content">
                          <div className="blog-meta">
                            {post.category && <span className="blog-category">{isEN ? (post.categoryEn || post.category) : post.category}</span>}
                            <span className="blog-date">{formatDate(post, lang)}</span>
                          </div>
                          <h3>{isEN ? (post.titleEn || post.titleTr) : post.titleTr}</h3>
                          <p>{isEN ? (post.excerptEn || post.excerptTr) : post.excerptTr}</p>
                          <div className="blog-card-footer">
                            <span className="blog-read-link">{isEN ? 'Read more' : 'Devamını oku'} →</span>
                          </div>
                        </div>
                      </Link>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section"><div className="container"><div className="blog-newsletter glass-card"><h2>{isEN ? 'Need a practical answer?' : 'Pratik bir yanıt mı arıyorsunuz?'}</h2><p>{isEN ? 'Tell us what you are working on.' : 'Üzerinde çalıştığınız konuyu bize anlatın.'}</p><Link to="/iletisim" className="btn btn-primary">{isEN ? 'Contact us' : 'İletişime geç'}<HiOutlineArrowRight size={16} /></Link></div></div></section>
    </PageTransition>
  )
}
