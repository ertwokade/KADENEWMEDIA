import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaInstagram, FaYoutube, FaLinkedinIn, FaXTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { FiShare2, FiArrowUpRight, FiGlobe, FiLink, FiMail } from 'react-icons/fi'
import { HiBadgeCheck } from 'react-icons/hi'
import { getLinkProfileBySlugApi } from '../api'
import { useSEO, BASE_URL } from '../hooks/useSEO'
import { useLanguage } from '../i18n/LanguageContext'
import PageTransition from '../components/PageTransition'
import { PersonSchema } from '../components/StructuredData'
import NotFound from './NotFound'
import './LinkProfile.css'

function hexToRgbTriplet(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return null
  return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`
}

const ICONS = {
  instagram: FaInstagram,
  youtube: FaYoutube,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  tiktok: FaTiktok,
  whatsapp: FaWhatsapp,
  website: FiGlobe,
  email: FiMail,
  custom: FiLink,
}

const FALLBACK_PROFILES = {
  kadirdemir: {
    name: 'Kadir Demir',
    handle: '@kadirdemir',
    tagline: 'Kurucu & CEO, Kade New Media',
    photo: '/kadir.jpg',
    active: true,
    links: [
      { label: 'Instagram', url: 'https://instagram.com/kadirardademir', icon: 'instagram' },
      { label: 'YouTube', url: 'https://www.youtube.com/@kadirdemirs', icon: 'youtube' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/kadirdemirr', icon: 'linkedin' },
      { label: 'X', url: 'https://x.com/kadirardademir', icon: 'x' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@kadirardademir', icon: 'tiktok' },
    ],
  },
}

const PROFILE_TAGLINE_EN = {
  kadirdemir: 'Founder & CEO, Kade New Media',
}

export default function LinkProfile() {
  const { handle = '' } = useParams()
  const { lang, setLang } = useLanguage()
  const slug = handle.startsWith('@') ? handle.slice(1) : ''
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState(slug ? 'loading' : 'not-found')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) { setStatus('not-found'); return }
    let cancelled = false
    setStatus('loading')
    getLinkProfileBySlugApi(slug)
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        const fallback = FALLBACK_PROFILES[slug]
        if (fallback) {
          setProfile(fallback)
          setStatus('ready')
        } else {
          setStatus('not-found')
        }
      })
    return () => { cancelled = true }
  }, [slug])

  // Bu bileşen `/:handle` ile eşleşir ve site üzerindeki HER bilinmeyen tek
  // segmentli URL'yi yakalar. Profil çözülmediğinde `index, follow` bırakmak
  // sonsuz sayıda indekslenebilir soft-404 üretir; bu yüzden yalnız gerçek bir
  // profil yüklendiğinde indekslenebilir olur. NotFound alt bileşen olduğu için
  // effect'i önce çalışır ve buradaki değerler onu ezer — noindex burada set edilmeli.
  const isRealProfile = status === 'ready' && Boolean(profile)
  useSEO({
    title: isRealProfile ? `${profile.name} | Kade New Media` : 'Sayfa Bulunamadı | Kade New Media',
    description: isRealProfile ? `${profile.name} — ${profile.tagline || ''}` : undefined,
    path: isRealProfile ? `/@${slug}` : `/${handle}`,
    image: profile?.photo,
    noindex: !isRealProfile,
  })

  const handleShare = async () => {
    const shareData = {
      title: profile?.name || 'Kade New Media',
      text: profile?.tagline || '',
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  if (status === 'not-found') return <NotFound />

  if (status === 'loading') {
    return (
      <div className="kd-page">
        <main className="kd-main">
          <div className="kd-shell">
            <div className="kd-loading-card" aria-hidden="true" />
          </div>
        </main>
      </div>
    )
  }

  const accentRgb = hexToRgbTriplet(profile.accentColor)
  const pageStyle = accentRgb
    ? { '--kd-accent': profile.accentColor, '--kd-accent-rgb': accentRgb }
    : undefined

  return (
    <PageTransition>
      <PersonSchema
        name={profile.name}
        jobTitle={profile.tagline}
        image={profile.photo ? (profile.photo.startsWith('http') ? profile.photo : `${BASE_URL}${profile.photo}`) : undefined}
        sameAs={(profile.links || []).map((link) => link.url)}
        url={`${BASE_URL}/@${slug}`}
      />
      <div className="kd-page" style={pageStyle}>
        <main className="kd-main">
          <div className="kd-shell">
            <section className="kd-card">
              <div className="kd-cover">
                {profile.photo && (
                  <img className="kd-cover-img" src={profile.photo} alt={profile.name} loading="eager" />
                )}
                <div className="kd-cover-tint" aria-hidden="true" />
                <div className="kd-cover-gradient" aria-hidden="true" />

                <div className="kd-cover-topbar">
                  <div className="kd-lang-toggle" role="group" aria-label="Dil seçimi">
                    <button
                      type="button"
                      className={lang === 'tr' ? 'kd-lang-btn is-active' : 'kd-lang-btn'}
                      onClick={() => setLang('tr')}
                    >
                      TR
                    </button>
                    <button
                      type="button"
                      className={lang === 'en' ? 'kd-lang-btn is-active' : 'kd-lang-btn'}
                      onClick={() => setLang('en')}
                    >
                      EN
                    </button>
                  </div>
                  <button type="button" className="kd-icon-btn" onClick={handleShare} aria-label="Paylaş">
                    <FiShare2 size={18} />
                  </button>
                </div>

              </div>

              <div className="kd-cover-bottom">
                <div className="kd-cover-inner">
                  <div className="kd-name-row">
                    <h1 className="kd-name">{profile.handle || profile.name}</h1>
                    <HiBadgeCheck className="kd-badge" aria-hidden="true" />
                  </div>
                  {profile.tagline && (
                    <p className="kd-tagline">
                      {lang === 'en' ? PROFILE_TAGLINE_EN[slug] || profile.tagline : profile.tagline}
                    </p>
                  )}
                </div>
              </div>

              <div className="kd-links-wrap">
                {copied && <div className="kd-toast">Bağlantı kopyalandı</div>}
                <div className="kd-links">
                  {(profile.links || []).map((link) => {
                    const Icon = ICONS[link.icon] || ICONS.custom
                    return (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="kd-link"
                      >
                        <span className="kd-link-icon">
                          <Icon size={22} />
                        </span>
                        <span className="kd-link-label">{link.label}</span>
                        <FiArrowUpRight className="kd-link-arrow" size={18} aria-hidden="true" />
                      </a>
                    )
                  })}
                </div>

                <footer className="kd-footer">
                  <nav className="kd-footer-nav" aria-label="Yasal bağlantılar">
                    <Link to="/gizlilik" className="kd-footer-sublink">{lang === 'en' ? 'Privacy' : 'Gizlilik'}</Link>
                    <span className="kd-footer-dot" aria-hidden="true">·</span>
                    <Link to="/kvkk" className="kd-footer-sublink">KVKK</Link>
                    <span className="kd-footer-dot" aria-hidden="true">·</span>
                    <Link to="/hakkimizda" className="kd-footer-sublink">{lang === 'en' ? 'About' : 'Hakkımızda'}</Link>
                  </nav>
                  <Link to="/" className="kd-footer-link">Kade New Media</Link>
                </footer>
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
