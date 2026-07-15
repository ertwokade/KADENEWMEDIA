import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const port = Number(process.env.PORT || 4173)

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function headers(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

async function existingFile(pathname) {
  const relative = pathname === '/' ? 'site.html' : decodeURIComponent(pathname).replace(/^\/+/, '')
  const safe = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '')
  const candidates = [join(root, safe), join(root, safe, 'index.html')]
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch { /* try the next candidate */ }
  }
  return null
}

const server = createServer(async (req, res) => {
  headers(res)
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`)

  if (url.pathname === '/sitemap.xml') {
    const xml = await readFile(new URL('../dist-sitemap.xml', import.meta.url), 'utf8').catch(() => '')
    if (xml) {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' })
      return res.end(xml)
    }
  }

  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/auth' && url.searchParams.get('action') === 'csrf') {
      return json(res, 200, { csrfToken: 'audit-token' })
    }
    if (url.searchParams.get('action') === 'session') return json(res, 200, { authenticated: false })
    return json(res, 200, { ok: true, data: null })
  }

  const file = await existingFile(url.pathname)
  if (file) {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
    return res.end(body)
  }

  const notFound = await readFile(join(root, '404.html')).catch(() => Buffer.from('Not found'))
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
  return res.end(notFound)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Production audit server listening on http://127.0.0.1:${port}`)
})
