import { useEffect } from 'react'

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
    injectSchema('schema-organization', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Kade Media',
      alternateName: 'Kade Media Dijital Pazarlama',
      url: 'https://kademedia.com.tr',
      logo: 'https://kademedia.com.tr/logo.png',
      sameAs: [
        'https://instagram.com/kadenewmedia',
        'https://www.youtube.com/@kadenewmedia',
        'https://tiktok.com/@kadenewmedia',
        'https://www.linkedin.com/company/kademediaagency',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+90-506-729-34-23',
        contactType: 'customer service',
        areaServed: 'TR',
        availableLanguage: ['Turkish', 'English'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Biruni Teknopark',
        addressLocality: 'İstanbul',
        addressRegion: 'İstanbul',
        postalCode: '34010',
        addressCountry: 'TR',
      },
    })

    injectSchema('schema-local-business', {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': 'https://kademedia.com.tr/#business',
      name: 'Kade Media',
      description: 'İstanbul merkezli sosyal medya yönetimi, dijital pazarlama ve içerik üretimi ajansı.',
      url: 'https://kademedia.com.tr',
      telephone: '+90-506-729-34-23',
      email: 'hello@kademedia.com',
      priceRange: '₺₺₺',
      image: 'https://kademedia.com.tr/logo.png',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Biruni Teknopark, Kazlıçeşme',
        addressLocality: 'Zeytinburnu',
        addressRegion: 'İstanbul',
        postalCode: '34010',
        addressCountry: 'TR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 41.004,
        longitude: 28.906,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        },
      ],
      hasMap: 'https://maps.app.goo.gl/Zy5j7cpcwP5y99Wx7',
    })

    return () => {
      removeSchema('schema-organization')
      removeSchema('schema-local-business')
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
        item: `https://kademedia.com.tr${item.path}`,
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
      image: image || 'https://kademedia.com.tr/logo.png',
      datePublished,
      dateModified: dateModified || datePublished,
      author: {
        '@type': 'Organization',
        name: author || 'Kade Media',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Kade Media',
        logo: { '@type': 'ImageObject', url: 'https://kademedia.com.tr/logo.png' },
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
      url: `https://kademedia.com.tr${url}`,
      provider: {
        '@type': 'Organization',
        name: 'Kade Media',
        url: 'https://kademedia.com.tr',
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
