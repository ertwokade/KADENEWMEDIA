/* Bakes the Kade layer into every page and writes a plain static folder that
   any host can serve — no Node process, no request-time rewriting. */
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformHtml, transformScript } from '../kade-html-transform.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist')
const SKIP = new Set(['dist', 'node_modules', 'scripts', 'docs', '.git', 'hydration-fix-backup-2026-08-17', 'external-assets'])
const SKIP_FILES = new Set(['server.mjs', 'kade-html-transform.mjs', 'package.json', 'package-lock.json', 'clone-report.json', 'external-assets-report.json', '.DS_Store'])

let pages = 0
let assets = 0

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const source = join(dir, entry.name)
    const rel = relative(root, source)
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue
      await walk(source)
      continue
    }
    if (SKIP_FILES.has(entry.name) || entry.name.endsWith('.bak')) continue
    /* _next → _kade: yol Next.js dağıtımında rezerve, bkz. kade-html-transform.mjs */
    const outRel = rel.startsWith('_next/') ? `_kade/${rel.slice(6)}` : rel
    const target = join(out, outRel)
    await mkdir(dirname(target), { recursive: true })
    if (extname(entry.name).toLowerCase() === '.html') {
      await writeFile(target, transformHtml(await readFile(source, 'utf8')))
      pages += 1
    } else if (rel.startsWith('_next/') && entry.name.endsWith('.js')) {
      await writeFile(target, transformScript(await readFile(source, 'utf8')))
      assets += 1
    } else {
      await cp(source, target)
      assets += 1
    }
  }
}

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
await walk(root)

/* Clean URLs plus the security headers the live site already sends. */
await writeFile(join(out, 'vercel.json'), JSON.stringify({
  cleanUrls: true,
  trailingSlash: false,
  headers: [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }
    ]
  }, {
    source: '/_next/static/(.*)',
    headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
  }]
}, null, 2) + '\n')

const size = await du(out)
console.log(`dist/ hazır — ${pages} sayfa, ${assets} dosya, ${(size / 1048576).toFixed(1)} MB`)

async function du(dir) {
  let total = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const item = join(dir, entry.name)
    total += entry.isDirectory() ? await du(item) : (await stat(item)).size
  }
  return total
}
