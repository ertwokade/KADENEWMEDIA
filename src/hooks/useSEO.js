import { useEffect } from 'react'

export const BASE_URL = 'https://www.kademedia.com.tr'

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
    // Avoid double-appending "Kade Media"
    let fullTitle
    if (!title) {
      fullTitle = 'Kade Media | Sosyal Medya Ajansı'
    } else if (title.includes('Kade Media')) {
      fullTitle = title
    } else {
      fullTitle = `${title} | Kade Media`
    }

    const canonicalUrl = `${baseUrl}${path}`
    const ogImage = image || `${baseUrl}/logo.png`

    document.title = fullTitle

    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('author', 'Kade Media')

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:type', type, true)
    setMeta('og:site_name', 'Kade Media', true)
    setMeta('og:locale', 'tr_TR', true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    const twitterSite = document.querySelector('meta[name="twitter:site"]')
    twitterSite?.remove()

    setCanonical(canonicalUrl)
  }, [title, description, keywords, path, image, type, noindex, baseUrl])
}
