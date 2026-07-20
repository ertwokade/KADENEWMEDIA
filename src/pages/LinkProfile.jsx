import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FaInstagram, FaYoutube, FaLinkedinIn, FaXTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa6'
import { FiShare2, FiArrowUpRight, FiArrowLeft, FiGlobe, FiLink, FiMail } from 'react-icons/fi'
import { HiBadgeCheck } from 'react-icons/hi'
import { getLinkProfileBySlugApi } from '../api'
import { useSEO } from '../hooks/useSEO'
import PageTransition from '../components/PageTransition'
import NotFound from './NotFound'
import './LinkProfile.css'

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

// Guarantees kadenewmedia.com/@kadirdemir keeps working even before the admin
// creates the matching DB record, or if the API is briefly unreachable.
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

export default function LinkProfile() {
  const { handle = '' } = useParams()
  // Bio pages live at /@handle — anything without the @ prefix isn't a profile URL.
  const slug = handle.startsWith('@') ? handle.slice(1) : ''
  const [profile, setProfile] = useState(null)
  const [status, setStatus] = useState(slug ? 'loading' : 'not-found') // loading | ready | not-found
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

  useSEO({
    title: profile ? `${profile.name} | Kade New Media` : 'Kade New Media',
    description: profile ? `${profile.name} — ${profile.tagline || ''}` : undefined,
    path: `/@${slug}`,
    image: profile?.photo,
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

  return (
    <PageTransition>
      <div className="kd-page">
        <main className="kd-main">
          <div className="kd-shell">
            <section className="kd-card">
              <div className="kd-cover">
                {profile.photo && (
                  <img className="kd-cover-img" src={profile.photo} alt={profile.name} loading="eager" />
                )}
                <div className="kd-cover-gradient" aria-hidden="true" />

                <div className="kd-cover-topbar">
                  <Link to="/" className="kd-icon-btn" aria-label="Kade New Media'ya dön">
                    <FiArrowLeft size={18} />
                  </Link>
                  <button type="button" className="kd-icon-btn" onClick={handleShare} aria-label="Paylaş">
                    <FiShare2 size={18} />
                  </button>
                </div>

                <div className="kd-cover-bottom">
                  <div className="kd-cover-inner">
                    <div className="kd-name-row">
                      <h1 className="kd-name">{profile.handle || profile.name}</h1>
                      <HiBadgeCheck className="kd-badge" aria-hidden="true" />
                    </div>
                    {profile.tagline && <p className="kd-tagline">{profile.tagline}</p>}
                  </div>
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
