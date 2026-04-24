import 'dotenv/config'
import express from 'express'
import apiHandler from './api/[...path].js'

const app = express()
app.use(express.json({ limit: '10mb' }))

// Güvenlik başlıkları
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none';"
  )
  next()
})

app.use('/api', (req, res) => {
  apiHandler(req, res).catch((err) => {
    console.error('API Error:', err)
    res.status(500).json({ error: err.message || 'API error' })
  })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ API Server: http://localhost:${PORT}`)
  console.log(`📦 MongoDB: ${process.env.MONGODB_URI ? '✅ URI loaded' : '❌ Missing MONGODB_URI'}`)
  console.log(`📧 SMTP: ${process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS ? `✅ ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}` : '❌ Missing SMTP config'}`)
})
