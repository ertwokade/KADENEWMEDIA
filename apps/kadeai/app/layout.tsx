import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import MobileInstallPrompt from '@/components/mobile/MobileInstallPrompt'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import './globals.css'
import './kade-skin.css'
import { PUBLIC_APP_URL, withBasePath } from '@/lib/appConfig'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})
const siteUrl = PUBLIC_APP_URL
const themeScript = `(function(){try{var k="kade-theme-mode";var s=localStorage.getItem(k);var t=s==="dark"?"dark":"light";var d=document.documentElement;d.dataset.themeMode=t;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})()`

export const viewport: Viewport = {
  themeColor: '#eac321',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Kade Media',
  title: {
    default: 'Kade Media | AI İçerik ve Operasyon Paneli',
    template: '%s | Kade Media',
  },
  description: 'Kade Media; AI içerik üretimi, sosyal medya analizi ve operasyon yönetimi araçlarını tek panelde toplar.',
  keywords: ['Kade Media', 'AI içerik üretimi', 'sosyal medya analizi', 'YouTube SEO', 'Instagram analiz', 'TikTok analiz', 'AI ajans araçları'],
  manifest: withBasePath('/manifest.json'),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'Kade Media',
    description: 'AI içerik, sosyal medya analizi ve operasyon paneli.',
    url: siteUrl,
    siteName: 'Kade Media',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kade Media',
    description: 'AI içerik ve operasyon araçları tek panelde.',
  },
  robots: {
    index: false,
    follow: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KadeAI',
  },
  icons: {
    icon: withBasePath('/icons/icon-192.png'),
    apple: withBasePath('/icons/icon-192.png'),
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#f7f9fc',
    'msapplication-TileImage': withBasePath('/icons/icon-192.png'),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      data-theme="light"
      data-theme-mode="light"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <MobileInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  )
}
