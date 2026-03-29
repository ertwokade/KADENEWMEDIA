import { useEffect } from 'react'

const BASE_URL = 'https://kademedia.com.tr'

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

export function useSEO({ title, description, keywords, path = '/', image }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Kade Media` : 'Kade Media | Sosyal Medya Ajansı'
    const canonicalUrl = `${BASE_URL}${path}`
    const ogImage = image || `${BASE_URL}/og-image.jpg`

    document.title = fullTitle

    setMeta('description', description)
    setMeta('keywords', keywords)
    setMeta('robots', 'index, follow')
    setMeta('author', 'Kade Media')

    // Open Graph
    setMeta('og:title', fullTitle, true)
    setMeta('og:description', description, true)
    setMeta('og:url', canonicalUrl, true)
    setMeta('og:image', ogImage, true)
    setMeta('og:type', 'website', true)
    setMeta('og:site_name', 'Kade Media', true)
    setMeta('og:locale', 'tr_TR', true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:site', '@kademediacom')

    setCanonical(canonicalUrl)
  }, [title, description, keywords, path, image])
}
