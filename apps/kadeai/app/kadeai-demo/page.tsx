import type { Metadata } from 'next'
import KadeAiDemo from '@/components/demo/KadeAiDemo'
import { getContent, DEMO_CONTENT_KEY } from '@/lib/cms/content'

/**
 * İçerik CMS'ten gelir (§25). Sayfa ISR ile 5 dakikada bir yenilenir:
 * indekslenebilirlik ve hız korunur, admin değişikliği kısa sürede yansır.
 */
export const revalidate = 300

const SITE = 'https://kadenewmedia.com'
const CANONICAL = `${SITE}/kadeai-demo`

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent(DEMO_CONTENT_KEY)
  return {
    title: content.seo.title,
    description: content.seo.description,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      title: content.seo.ogTitle,
      description: content.seo.ogDescription,
      url: CANONICAL,
      type: 'website',
    },
  }
}

export default async function KadeAiDemoPage() {
  const content = await getContent(DEMO_CONTENT_KEY)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'KadeAI',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: CANONICAL,
        description: content.seo.description,
        publisher: { '@type': 'Organization', name: 'Kade New Media', url: SITE },
        offers: { '@type': 'Offer', url: `${SITE}/paketler`, priceCurrency: 'TRY' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <KadeAiDemo content={content} />
    </>
  )
}
