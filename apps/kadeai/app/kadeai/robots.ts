import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com/kadeai'

  return {
    rules: {
      userAgent: '*',
      disallow: ['/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
