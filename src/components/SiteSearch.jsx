import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineSearch, HiOutlineX, HiOutlineDocumentText, HiOutlineSparkles } from 'react-icons/hi'
import { useLanguage } from '../i18n/LanguageContext'
import { blogPosts } from '../data/content'
import { getBlogsApi } from '../api'
import './SiteSearch.css'

const basePages = [
  { titleTr: 'Anasayfa', titleEn: 'Home', type: 'Sayfa', path: '/', terms: 'kade media ajans sosyal medya dijital pazarlama' },
  { titleTr: 'Hakkımızda', titleEn: 'About', type: 'Sayfa', path: '/hakkimizda', terms: 'ekip ajans hakkimizda deneyim kurucu' },
  { titleTr: 'Hizmetler', titleEn: 'Services', type: 'Sayfa', path: '/hizmetler', terms: 'sosyal medya icerik reklam video web strateji' },
  { titleTr: 'Paketler', titleEn: 'Packages', type: 'Sayfa', path: '/paketler', terms: 'fiyat paket teklif ucret maliyet' },
  { titleTr: 'Teklif Al', titleEn: 'Get Quote', type: 'Araç', path: '/teklif-al', terms: 'teklif basvuru hizmet form kapsam' },
  { titleTr: 'Fiyat Hesaplama', titleEn: 'Price Calculator', type: 'Araç', path: '/fiyat-hesaplama', terms: 'fiyat hesaplama maliyet butce' },
  { titleTr: 'Müşteri Paneli', titleEn: 'Client Portal', type: 'Sayfa', path: '/musteri-panel', terms: 'musteri portal rapor fatura proje' },
  { titleTr: 'Proje Takip', titleEn: 'Project Tracking', type: 'Araç', path: '/proje-takip', terms: 'proje takip asama durum timeline' },
  { titleTr: 'Open Graph Önizleme', titleEn: 'Open Graph Preview', type: 'Araç', path: '/og-onizleme', terms: 'og preview sosyal medya onizleme link' },
  { titleTr: 'Podcast & Webinar', titleEn: 'Podcast & Webinar', type: 'Sayfa', path: '/podcast-webinar', terms: 'podcast webinar egitim etkinlik' },
  { titleTr: 'Bülten Arşivi', titleEn: 'Newsletter Archive', type: 'Sayfa', path: '/bulten-arsivi', terms: 'newsletter bulten arsiv eposta' },
  { titleTr: 'Neden Biz?', titleEn: 'Why Us?', type: 'Sayfa', path: '/neden-biz', terms: 'karsilastirma ajans fark avantaj' },
  { titleTr: 'Referanslar', titleEn: 'References', type: 'Sayfa', path: '/referanslar', terms: 'yorum musteri basari kanit referans' },
  { titleTr: 'Partnerler', titleEn: 'Partners', type: 'Sayfa', path: '/partnerler', terms: 'portfolio marka musteri partner' },
  { titleTr: 'Başarı Hikayeleri', titleEn: 'Case Studies', type: 'Sayfa', path: '/basari-hikayeleri', terms: 'case study sonuc buyume basari' },
  { titleTr: 'Blog', titleEn: 'Blog', type: 'Sayfa', path: '/blog', terms: 'rehber yazilar trend ipucu' },
  { titleTr: 'SSS', titleEn: 'FAQ', type: 'Sayfa', path: '/sss', terms: 'soru cevap fiyat surec sozlesme' },
  { titleTr: 'Basın & Medya', titleEn: 'Press', type: 'Sayfa', path: '/basin', terms: 'logo medya kiti basin press' },
  { titleTr: 'Ödüller & Sertifikalar', titleEn: 'Awards', type: 'Sayfa', path: '/oduller', terms: 'sertifika odul google meta' },
  { titleTr: 'Referans Programı', titleEn: 'Referral Program', type: 'Sayfa', path: '/referans-programi', terms: 'referral oner odul tavsiye' },
  { titleTr: 'İletişim', titleEn: 'Contact', type: 'Sayfa', path: '/iletisim', terms: 'telefon email adres teklif whatsapp' },
]

const services = [
  'Sosyal Medya Yönetimi',
  'İçerik Üretimi',
  'Reklam Yönetimi',
  'Video Prodüksiyon',
  'Web Sitesi Tasarımı',
  'Strateji Danışmanlığı',
].map(title => ({
  titleTr: title,
  titleEn: title,
  type: 'Hizmet',
  path: '/hizmetler',
  terms: `${title} instagram tiktok google meta youtube`,
}))

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function scoreItem(item, query) {
  const haystack = normalize(`${item.titleTr} ${item.titleEn} ${item.excerpt || ''} ${item.terms || ''}`)
  const q = normalize(query)
  if (!q) return 0
  if (normalize(item.titleTr) === q || normalize(item.titleEn) === q) return 120
  if (normalize(item.titleTr).includes(q) || normalize(item.titleEn).includes(q)) return 80
  if (haystack.includes(q)) return 50
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.reduce((total, token) => total + (haystack.includes(token) ? 15 : 0), 0)
}

export default function SiteSearch({ compact = false, onNavigate }) {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remoteBlogs, setRemoteBlogs] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getBlogsApi()
      .then(data => {
        if (!cancelled && Array.isArray(data)) setRemoteBlogs(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          event.preventDefault()
          setOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const index = useMemo(() => {
    const staticBlogItems = blogPosts.map(post => ({
      titleTr: post.titleTr,
      titleEn: post.titleEn,
      type: 'Blog',
      path: `/blog/${post.slug}`,
      excerpt: post.excerptTr || post.excerptEn,
      terms: `${post.category || ''} ${post.categoryEn || ''}`,
    }))

    const remoteBlogItems = remoteBlogs.map(post => ({
      titleTr: post.titleTr || post.title || post.slug,
      titleEn: post.titleEn || post.titleTr || post.slug,
      type: 'Blog',
      path: `/blog/${post.slug}`,
      excerpt: post.excerptTr || post.excerptEn || '',
      terms: post.category || '',
    }))

    const seen = new Set()
    return [...basePages, ...services, ...remoteBlogItems, ...staticBlogItems].filter(item => {
      if (!item.path || seen.has(item.path)) return false
      seen.add(item.path)
      return true
    })
  }, [remoteBlogs])

  const results = useMemo(() => {
    return index
      .map(item => ({ ...item, score: scoreItem(item, query) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [index, query])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (results[0]) {
      navigate(results[0].path)
      onNavigate?.()
      close()
    }
  }

  return (
    <>
      <button
        type="button"
        className={`site-search-trigger ${compact ? 'compact' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={lang === 'tr' ? 'Site içinde ara' : 'Search site'}
        title={lang === 'tr' ? 'Ara' : 'Search'}
      >
        <HiOutlineSearch size={18} />
        {!compact && <span>{lang === 'tr' ? 'Ara' : 'Search'}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="site-search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="site-search-backdrop" onClick={close} aria-label="Kapat" />
            <motion.div
              className="site-search-panel"
              initial={{ y: -16, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -16, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <form className="site-search-form" onSubmit={handleSubmit}>
                <HiOutlineSearch size={22} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={lang === 'tr' ? 'Blog, hizmet veya sayfa ara...' : 'Search blogs, services, or pages...'}
                />
                <button type="button" className="site-search-close" onClick={close} aria-label="Kapat">
                  <HiOutlineX size={18} />
                </button>
              </form>

              <div className="site-search-results">
                {query.trim() === '' ? (
                  basePages.slice(0, 6).map(item => (
                    <Link key={item.path} to={item.path} className="site-search-result" onClick={close}>
                      <HiOutlineSparkles size={18} />
                      <span>{lang === 'tr' ? item.titleTr : item.titleEn}</span>
                      <small>{item.type}</small>
                    </Link>
                  ))
                ) : results.length > 0 ? (
                  results.map(item => (
                    <Link key={item.path} to={item.path} className="site-search-result" onClick={close}>
                      <HiOutlineDocumentText size={18} />
                      <span>{lang === 'tr' ? item.titleTr : item.titleEn}</span>
                      <small>{item.type}</small>
                    </Link>
                  ))
                ) : (
                  <div className="site-search-empty">
                    {lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
