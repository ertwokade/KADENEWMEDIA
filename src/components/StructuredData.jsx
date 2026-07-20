import { useEffect } from 'react'
import { BRAND } from '../config/brand'
import { BASE_URL } from '../hooks/useSEO'

function injectSchema(id, schema) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(schema)
}

function removeSchema(id) {
  const el = document.getElementById(id)
  if (el) el.remove()
}

// Organization schema — injected globally once
export function OrganizationSchema() {
  useEffect(() => {
    const sameAs = Object.values(BRAND.social || {}).filter(Boolean)

    injectSchema('schema-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND.name,
      alternateName: BRAND.alternateNames,
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
      description: 'İstanbul merkezli new media, dijital medya ve pazarlama ajansı.',
      email: BRAND.email,
      telephone: BRAND.phone || undefined,
      address: BRAND.address ? {
        '@type': 'PostalAddress',
        streetAddress: BRAND.address,
        addressLocality: BRAND.city,
        addressCountry: 'TR',
      } : undefined,
      ...(sameAs.length > 0 ? { sameAs } : {}),
      knowsAbout: [
        'New media',
        'Dijital medya',
        'Sosyal medya yönetimi',
        'İçerik üretimi',
        'Dijital reklam',
        'Video prodüksiyon',
        'Web tasarımı',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: BRAND.email,
        telephone: BRAND.phone || undefined,
        contactType: 'sales',
        areaServed: 'TR',
        availableLanguage: ['Turkish'],
      },
    })

    return () => {
      removeSchema('schema-organization')
    }
  }, [])

  return null
}

// FAQ schema — used on SSS page
export function FAQSchema({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return
    injectSchema('schema-faq', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(item => ({
        '@type': 'Question',
        name: item.soru,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.cevap,
        },
      })),
    })
    return () => removeSchema('schema-faq')
  }, [items])

  return null
}

// BreadcrumbList schema
export function BreadcrumbSchema({ items }) {
  useEffect(() => {
    if (!items || items.length === 0) return
    injectSchema('schema-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `${BASE_URL}${item.path}`,
      })),
    })
    return () => removeSchema('schema-breadcrumb')
  }, [items])

  return null
}

// Article schema — for blog posts
export function ArticleSchema({ title, description, image, datePublished, dateModified, author }) {
  useEffect(() => {
    injectSchema('schema-article', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: image || `${BASE_URL}/logo.png`,
      datePublished,
      dateModified: dateModified || datePublished,
      author: {
        '@type': 'Organization',
        name: author || 'Kade Media',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Kade Media',
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
      },
    })
    return () => removeSchema('schema-article')
  }, [title, description, image, datePublished, dateModified, author])

  return null
}

// Service schema
export function ServiceSchema({ name, description, url }) {
  useEffect(() => {
    injectSchema('schema-service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name,
      description,
      url: `${BASE_URL}${url}`,
      provider: {
        '@type': 'Organization',
        name: 'Kade Media',
        url: BASE_URL,
      },
      areaServed: {
        '@type': 'Country',
        name: 'Turkey',
      },
    })
    return () => removeSchema('schema-service')
  }, [name, description, url])

  return null
}
