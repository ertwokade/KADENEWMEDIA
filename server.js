import 'dotenv/config'
import express from 'express'
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

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`✅ API Server: http://localhost:${PORT}`)
  console.log(`📦 Supabase: ${process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ credentials loaded' : '❌ Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'}`)
  console.log(`📧 SMTP: ${process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? `✅ ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}` : '❌ Missing SMTP config'}`)
})
