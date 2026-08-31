import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kadenewmedia.com/kadexai'

  return {
    rules: {
      userAgent: '*',
      disallow: ['/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
