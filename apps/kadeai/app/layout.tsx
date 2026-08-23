import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import MobileInstallPrompt from '@/components/mobile/MobileInstallPrompt'
import { ThemeProvider } from '@/lib/context/ThemeContext'
import './globals.css'
import './kade-skin.css'
import { PUBLIC_APP_URL, withBasePath } from '@/lib/appConfig'

const montserrat = Montserrat({
  variable: '--font-poppins',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const siteUrl = PUBLIC_APP_URL
/* Tema tercihi kadenewmedia.com ile ORTAKTIR: KadeAI aynı origin altında
   /kadeai yolunda çalıştığı için localStorage paylaşılır. Site tercihi `theme`
   anahtarında light | dark | system olarak tutar; burada aynı anahtar aynı
   değer kümesiyle okunur, yoksa eski `kade-theme-mode` devralınır. Böylece
   ziyaretçi siteden panele geçerken tema kaymıyor. */
const themeScript = `(function(){try{var d=document.documentElement;var v=function(k){var s=localStorage.getItem(k);return s==="light"||s==="dark"||s==="system"?s:null};var m=v("theme")||v("kade-theme-mode")||"system";var t=m==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;d.dataset.themeMode=m;d.dataset.theme=t;d.style.colorScheme=t}catch(e){}})()`

export const viewport: Viewport = {
  themeColor: '#fdf6e3',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'KadeAI',
  title: {
    default: 'KadeAI | Kade New Media',
    template: '%s | KadeAI',
  },
  description: 'KadeAI; Kade New Media için AI içerik üretimi, sosyal medya analizi ve operasyon yönetimi araçlarını tek panelde toplar.',
  keywords: ['KadeAI', 'Kade New Media', 'AI içerik üretimi', 'sosyal medya analizi', 'YouTube SEO', 'Instagram analiz', 'TikTok analiz', 'AI ajans araçları'],
  manifest: withBasePath('/manifest.json'),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'KadeAI | Kade New Media',
    description: 'AI içerik, sosyal medya analizi ve operasyon paneli.',
    url: siteUrl,
    siteName: 'KadeAI',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KadeAI | Kade New Media',
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
      className={`${montserrat.variable} h-full antialiased`}
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
