import { useEffect } from 'react'

export const BASE_URL = 'https://kadenewmedia.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`
const DEFAULT_OG_IMAGE_ALT = 'Kade New Media — New Media ve Dijital Medya Ajansı'

function setMeta(name, content, property = false) {
  if (!content) return
  const attr = property ? 'property' : 'name'
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function useSEO({ title, description, keywords, path = '/', image, type = 'website', noindex = false, baseUrl = BASE_URL }) {
  useEffect(() => {
    // Avoid double-appending "Kade New Media"
    let fullTitle
    if (!title) {
      fullTitle = 'Kade New Media | Sosyal Medya Ajansı'
    } else if (title.includes('Kade New Media')) {
      fullTitle = title
    } else {
      fullTitle = `${title} | Kade New Media`
    }

    const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`
    const canonicalUrl = new URL(normalizedPath, `${baseUrl}/`).href
    const ogImage = image || DEFAULT_OG_IMAGE

    document.title = fullTitle

    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('author', 'Kade New Media')

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:image:type', 'image/png', true)
    setMeta('og:image:width', '1200', true)
    setMeta('og:image:height', '630', true)
    setMeta('og:image:alt', DEFAULT_OG_IMAGE_ALT, true)
    setMeta('og:type', type, true)
    setMeta('og:site_name', 'Kade New Media', true)
    setMeta('og:locale', 'tr_TR', true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:image:alt', DEFAULT_OG_IMAGE_ALT)
    const twitterSite = document.querySelector('meta[name="twitter:site"]')
    twitterSite?.remove()

    setCanonical(canonicalUrl)
  }, [title, description, keywords, path, image, type, noindex, baseUrl])
}
