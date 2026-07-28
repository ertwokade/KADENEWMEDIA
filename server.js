import { config as loadEnv } from 'dotenv'
import express from 'express'

// Ortam değişkenleri: `vercel env pull` çıktısını `.env.local` olarak yazar,
// `dotenv/config` ise yalnız `.env` okur. Bu yüzden yerelde SUPABASE_URL ve
// SUPABASE_SERVICE_ROLE_KEY hiç görülmüyor ve veri gerektiren bütün uçlar
// 500 dönüyordu. Yerel dosya önce yüklenir (öncelikli), sonra `.env`.
// `override: false` varsayılan: önce yüklenen kazanır.
loadEnv({ path: '.env.local' })
loadEnv()
import apiHandler from './api/[...path].js'

const app = express()
app.use(express.json({ limit: '3mb' }))

// Güvenlik başlıkları
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: data: blob:; font-src 'self' https://fonts.gstatic.com; frame-src 'self' https://www.google.com; worker-src 'self' blob:; frame-ancestors 'none';"
  )
  next()
})

app.use('/api', (req, res) => {
  const handlerReq = Object.create(req)
  Object.defineProperties(handlerReq, {
    query: { value: { ...(req.query || {}) }, writable: true, configurable: true },
    originalUrl: { value: req.originalUrl, writable: true, configurable: true },
    url: { value: req.url, writable: true, configurable: true },
  })

  apiHandler(handlerReq, res).catch((err) => {
    console.error('API Error:', err instanceof Error ? err.message : 'unknown')
    res.status(500).json({ error: 'Sunucu hatası' })
  })
})

/**
 * Başlangıç kontrolü — değişkenin VARLIĞI değil, KULLANILABİLİRLİĞİ ölçülür.
 *
 * `vercel env pull`, projede "Sensitive" işaretli değişkenlerin değerini
 * geri okuyamaz ve dosyaya "[SENSITIVE]" metnini yazar. Yalnız varlığa
 * bakan eski kontrol bu durumda "credentials loaded" diyor, ardından her
 * istek "Invalid supabaseUrl" ile 500 dönüyordu. Aşağıdaki doğrulama
 * sorunu isteğe kadar beklemeden, sunucu açılışında bildirir.
 */
function checkSupabaseConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return '❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil'
  if (url === '[SENSITIVE]' || key === '[SENSITIVE]') {
    return '❌ değerler maskeli gelmiş ([SENSITIVE]) — Vercel\'de "Sensitive" işaretli; panelden alıp .env.local\'e yazın'
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('şema')
  } catch {
    return '❌ SUPABASE_URL geçerli bir HTTP(S) adresi değil'
  }
  return '✅ bağlantı bilgileri geçerli'
}

function checkSmtpConfig() {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass, SMTP_PORT: port } = process.env
  if (!host || !user || !pass) return '❌ SMTP yapılandırması eksik'
  if ([host, user, pass].includes('[SENSITIVE]')) return '❌ değerler maskeli gelmiş ([SENSITIVE])'
  return `✅ ${host}:${port || 587}`
}

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`✅ API Server: http://localhost:${PORT}`)
  console.log(`📦 Supabase: ${checkSupabaseConfig()}`)
  console.log(`📧 SMTP: ${checkSmtpConfig()}`)
})
