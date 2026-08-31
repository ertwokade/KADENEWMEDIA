import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedLegalDocument, LEGAL_SLUGS } from '@/lib/legal/server'

/**
 * Yayınlanmış yasal metnin kamuya açık görünümü. Yayınlanmamış (taslak) bir
 * metin 404 döner — hukuk incelemesinden geçmemiş içerik hiçbir koşulda
 * yayına çıkmaz.
 */
export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const document = await getPublishedLegalDocument(slug)
  if (!document) return { title: 'Metin bulunamadı', robots: { index: false, follow: false } }
  return {
    title: `${document.title} | KadexAI`,
    robots: { index: true, follow: true },
    alternates: { canonical: `https://kadenewmedia.com/kadexai/legal/${document.slug}` },
  }
}

export function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }))
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const document = await getPublishedLegalDocument(slug)
  if (!document) notFound()

  return (
    <main className="min-h-screen bg-[#0c0c0d] px-5 py-16 text-zinc-100">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black">{document.title}</h1>
        <p className="mt-2 text-xs text-zinc-500">
          Sürüm {document.version}
          {document.published_at && ` · ${new Date(document.published_at).toLocaleDateString('tr-TR')}`}
        </p>
        {/* Metin hukuk danışmanının hazırladığı düz metindir; HTML olarak
            yorumlanmaz, satır yapısı korunarak gösterilir. */}
        <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{document.body}</div>
      </article>
    </main>
  )
}
