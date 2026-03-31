import 'dotenv/config'
import express from 'express'
import corsMiddleware from 'cors'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(corsMiddleware())
app.use(express.json())

// Helper to load and invoke a Vercel-style API handler
function apiRoute(filePath) {
  return async (req, res) => {
    try {
      const fullPath = join(__dirname, 'api', filePath)
      const fileUrl = pathToFileURL(fullPath).href
      const mod = await import(fileUrl)
      await mod.default(req, res)
    } catch (err) {
      console.error(`API Error [${filePath}]:`, err.message)
      res.status(500).json({ error: err.message })
    }
  }
}

// Auth
app.post('/api/auth/login', apiRoute('auth/login.js'))
app.post('/api/auth/change-password', apiRoute('auth/change-password.js'))

// Blog
app.get('/api/blog', apiRoute('blog.js'))
app.post('/api/blog', apiRoute('blog.js'))
app.put('/api/blog', apiRoute('blog.js'))
app.delete('/api/blog', apiRoute('blog.js'))

// Content
app.get('/api/content', apiRoute('content.js'))
app.put('/api/content', apiRoute('content.js'))

// Partners
app.get('/api/partners', apiRoute('partners.js'))
app.post('/api/partners', apiRoute('partners.js'))
app.put('/api/partners', apiRoute('partners.js'))
app.delete('/api/partners', apiRoute('partners.js'))

// Messages
app.get('/api/messages', apiRoute('messages.js'))
app.put('/api/messages', apiRoute('messages.js'))
app.delete('/api/messages', apiRoute('messages.js'))

// Contact
app.post('/api/contact', apiRoute('contact.js'))

// Chat (AI chatbot)
app.post('/api/chat', apiRoute('chat.js'))

// Seed
app.post('/api/seed', apiRoute('seed.js'))

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ API Server: http://localhost:${PORT}`)
  console.log(`📦 MongoDB: ${process.env.MONGODB_URI ? '✅ URI loaded' : '❌ Missing MONGODB_URI'}`)
})
