import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/* TEK DAĞITIM MİMARİSİ
   ---------------------------------------------------------------------------
   Bu uygulama artık sitenin TAMAMINI barındırıyor: statik pazarlama sitesi
   `public/` altından, KadexAI ise `app/kadexai/` altından servis ediliyor.

   Next'in `basePath`i BİLEREK kaldırıldı. Onun yerine rotalar fiziksel olarak
   `app/kadexai/` klasöründe duruyor; üretilen URL'ler birebir aynı (/kadexai/...)
   olduğu için Google ve Supabase'e kayıtlı OAuth redirect adresleri bozulmuyor.
   basePath kalsaydı `/api/*` (ana sitenin 30 route'u) da /kadexai altına
   sıkışırdı ve ana sitenin backend'i erişilemez olurdu.

   APP_BASE_PATH sabiti duruyor: `withBasePath()` 18 dosyada kullanılıyor ve
   bağlantıları hâlâ /kadexai ile öneklemesi gerekiyor. */
const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/kadexai'
const projectRoot = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(projectRoot, '..', '..')
const isProduction = process.env.NODE_ENV === 'production'
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').origin
  } catch {
    return ''
  }
})()
const supabaseWebSocketOrigin = supabaseOrigin.replace(/^https:/, 'wss:')
const telemetryOrigins = [
  process.env.NEXT_PUBLIC_POSTHOG_HOST,
  (() => { try { return new URL(process.env.NEXT_PUBLIC_SENTRY_DSN || '').origin } catch { return '' } })(),
]
const connectSources = ["'self'", supabaseOrigin, supabaseWebSocketOrigin, 'https://unpkg.com', ...telemetryOrigins].filter(Boolean).join(' ')
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  `connect-src ${connectSources}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isProduction ? ['upgrade-insecure-requests'] : []),
].join('; ')

const nextConfig: NextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['127.0.0.1'],
  /* Kök, REPO köküdür — apps/kadexai değil. Ana sitenin `api/*` route modülleri
     repo kökünde duruyor ve `pages/api/[...path].js` onları oradan import
     ediyor; kök apps/kadexai kalsaydı Turbopack proje dışına çıkan bu import'u
     çözemezdi. `outputFileTracingRoot` da aynı sebeple genişletiliyor ki
     dağıtım paketine o dosyalar dahil edilsin. */
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,

  env: {
    NEXT_PUBLIC_BASE_PATH: APP_BASE_PATH,
  },

  /* STATİK SİTE YÖNLENDİRMESİ
     ---------------------------------------------------------------------------
     Next `public/` dosyalarını yalnız BİREBİR adla sunar: /logo.png çalışır ama
     /giris için public/giris/index.html'i kendiliğinden bulmaz, 404 döner.
     Statik site 45+ sayfayı dizin/index.html biçiminde tuttuğu için köprü şart.

     `fallback` aşaması seçildi: yalnız hiçbir Next rotası VE hiçbir public
     dosyası eşleşmediğinde çalışır. Böylece /kadexai/* ve /api/* önce kendi
     rotalarına gider, geri kalan her şey statik siteye düşer. */
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/blog/:slug', destination: '/api/dynamic-page?type=blog&slug=:slug' },
        { source: '/partnerler/:slug', destination: '/api/dynamic-page?type=partner&slug=:slug' },
        { source: '/portfolio/:slug', destination: '/api/dynamic-page?type=portfolio&slug=:slug' },
        { source: '/@:handle', destination: '/api/dynamic-page?type=profile&slug=:handle' },
      ],
      afterFiles: [],
      fallback: [
        { source: '/', destination: '/index.html' },
        { source: '/:path*', destination: '/:path*/index.html' },
      ],
    }
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
        ],
      },
    ]
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
