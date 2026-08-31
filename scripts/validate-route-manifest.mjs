import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('../config/route-manifest.json', import.meta.url), 'utf8'))
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')
const dispatcherSource = await readFile(new URL('../api/[...path].js', import.meta.url), 'utf8')

const expectedMissing = new Set()

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function fileExists(url) {
  try {
    return (await stat(url)).isFile()
  } catch {
    return false
  }
}

async function discoverKadeRoutes(directory, segments = [], found = new Set()) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const nextUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory)
    if (entry.isDirectory()) {
      const nextSegments = /^\(.+\)$/.test(entry.name) ? segments : [...segments, entry.name]
      await discoverKadeRoutes(nextUrl, nextSegments, found)
    } else if (entry.name === 'page.tsx' || entry.name === 'route.ts') {
      found.add(`/${segments.join('/')}`)
    }
  }
  return found
}

function rootPageExists(route) {
  if (route === '/') return true
  if (route === '/kadexai-demo') return existsSync(new URL('../apps/kadexai/app/kadexai-demo/page.tsx', import.meta.url))
  if (route === '/blog/:slug') return /path="\/blog\/:slug"/.test(appSource) && dispatcherSource.includes('dynamicPage')
  if (route === '/partnerler/:id') return /path="\/partnerler\/:id"/.test(appSource) && dispatcherSource.includes('dynamicPage')
  if (route === '/links' || route === '/kadelinks') return appSource.includes(`path="${route}"`)
  if (route.startsWith('/hizmetler/')) return appSource.includes('path="/hizmetler/:slug"')
  if (route === '/portfolio/:slug') return appSource.includes('path="/portfolio/:slug"')
  if (route.startsWith('/organizasyon-kiti/') && !route.includes('/plan/')) {
    return appSource.includes('path={`/organizasyon-kiti/${section}`}')
  }
  const pathOnly = route.split('?')[0]
  return new RegExp(`path=["']${escapeRegExp(pathOnly)}["']`).test(appSource)
}

async function kadeRouteExists(route, type) {
  const relative = route.replace(/^\//, '')
  if (type === 'api') {
    return fileExists(new URL(`../apps/kadexai/app/${relative}/route.ts`, import.meta.url))
  }
  if (relative === 'kadexai/auth/callback') {
    return fileExists(new URL('../apps/kadexai/app/kadexai/auth/callback/route.ts', import.meta.url))
  }
  return fileExists(new URL(`../apps/kadexai/app/${relative ? `${relative}/` : ''}page.tsx`, import.meta.url))
}

function rootApiExists(route) {
  if (route === '/sitemap.xml') return dispatcherSource.includes("import sitemap")
  const key = route.replace(/^\/api\//, '')
  const aliases = new Set(['auth/login', 'auth/change-password', 'newsletter'])
  if (aliases.has(key)) return dispatcherSource.includes(`routeKey === '${key}'`)
  return dispatcherSource.includes(`  '${key}':`) || dispatcherSource.includes(`  ${key},`) || dispatcherSource.includes(`  ${key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())},`)
}

assert(manifest.schemaVersion === 1, 'Unsupported route manifest schema')
assert(manifest.routes.length === manifest.expectedCount, `Expected ${manifest.expectedCount} routes, found ${manifest.routes.length}`)
assert(manifest.expectedCount === 228, `Inventory contract changed: ${manifest.expectedCount}`)

const seen = new Set()
for (const entry of manifest.routes) {
  assert(typeof entry.route === 'string' && entry.route.startsWith('/'), `Invalid route: ${entry.route}`)
  assert(!seen.has(entry.route), `Duplicate route: ${entry.route}`)
  seen.add(entry.route)
  assert(Array.isArray(entry.methods) && entry.methods.length > 0, `Missing methods: ${entry.route}`)
  assert(new Set(entry.methods).size === entry.methods.length, `Duplicate method: ${entry.route}`)
}

const declaredMissing = new Set(manifest.routes.filter((entry) => !entry.implemented).map((entry) => entry.route))
assert(declaredMissing.size === expectedMissing.size, `Expected ${expectedMissing.size} missing routes, found ${declaredMissing.size}`)
for (const route of expectedMissing) assert(declaredMissing.has(route), `Missing route classification changed: ${route}`)

const sourceMismatches = []
for (const entry of manifest.routes) {
  let exists
  if (entry.app === 'kadexai') exists = await kadeRouteExists(entry.route, entry.type)
  else if (entry.type === 'api') exists = rootApiExists(entry.route)
  else exists = rootPageExists(entry.route)

  if (entry.implemented !== exists) sourceMismatches.push({ route: entry.route, manifest: entry.implemented, source: exists })
}

assert(sourceMismatches.length === 0, `Manifest/source mismatch:\n${JSON.stringify(sourceMismatches, null, 2)}`)

// Manifest yalnız kendi içindeki kayıtları değil fiziksel App Router ağacını
// da kapsamalı. Aksi hâlde yeni bir route eklenip envantere unutulduğunda eski
// doğrulayıcı sessizce yeşil dönüyordu.
const discoveredKadeRoutes = await discoverKadeRoutes(new URL('../apps/kadexai/app/kadexai/', import.meta.url), ['kadexai'])
const declaredKadeRoutes = new Set(manifest.routes.filter((entry) => entry.app === 'kadexai').map((entry) => entry.route))
const undeclaredKadeRoutes = [...discoveredKadeRoutes].filter((route) => !declaredKadeRoutes.has(route)).sort()
const staleKadeRoutes = [...declaredKadeRoutes].filter((route) => !discoveredKadeRoutes.has(route)).sort()
assert(undeclaredKadeRoutes.length === 0, `Manifest dışında KadexAI route'ları var:\n${JSON.stringify(undeclaredKadeRoutes, null, 2)}`)
assert(staleKadeRoutes.length === 0, `Manifestte artık fiziksel karşılığı olmayan KadexAI route'ları var:\n${JSON.stringify(staleKadeRoutes, null, 2)}`)

const scripts = await readdir(new URL('../scripts/', import.meta.url))
assert(scripts.includes('validate-route-manifest.mjs'), `Validator missing under ${join(projectRoot.pathname, 'scripts')}`)

console.log(JSON.stringify({
  total: manifest.routes.length,
  implemented: manifest.routes.filter((entry) => entry.implemented).length,
  missing: [...declaredMissing],
  duplicates: [],
  sourceMismatches: [],
  undeclaredKadeRoutes: [],
  staleKadeRoutes: [],
}, null, 2))
