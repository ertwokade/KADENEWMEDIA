import { readFile, writeFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../config/route-manifest.json', import.meta.url), 'utf8'))
const rootBase = process.env.AUDIT_URL || ''
const kadeBase = process.env.KADEXAI_AUDIT_URL || ''
const rootApiBase = process.env.ROOT_API_AUDIT_URL || ''
const kadeApiBase = process.env.KADEXAI_API_AUDIT_URL || ''
const environment = process.env.AUDIT_ENVIRONMENT || 'local'
const authenticated = process.env.AUDIT_AUTHENTICATED === '1'

function baseFor(entry) {
  if (entry.type === 'api') return entry.app === 'kadexai' ? kadeApiBase : rootApiBase
  return entry.app === 'kadexai' ? kadeBase : rootBase
}

function isSafePassiveRequest(entry) {
  return entry.methods.includes('GET') && (entry.type !== 'api' || entry.access === 'public')
}

function inspectHtml(html, entry) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
  const canonical = [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1])
  const robots = html.match(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || ''
  const seoIssues = []
  if (entry.type !== 'api') {
    if (!title) seoIssues.push('missing-title')
    if (entry.access === 'public' && entry.implemented && !/noindex/i.test(robots) && h1.length !== 1) seoIssues.push(`h1-count:${h1.length}`)
    if (entry.access === 'public' && entry.implemented && !/noindex/i.test(robots) && canonical.length !== 1) seoIssues.push(`canonical-count:${canonical.length}`)
    if (entry.access === 'private' && !/noindex/i.test(robots)) seoIssues.push('private-route-missing-noindex')
  }
  return { title, h1Count: h1.length, canonical, robots, seoIssues }
}

async function auditEntry(entry) {
  const method = entry.methods.includes('GET') ? 'GET' : entry.methods[0]
  const expectedStatus = entry.expectedStatus
  const base = baseFor(entry)
  const result = {
    route: entry.route,
    type: entry.type,
    environment,
    method,
    role: entry.roles.join(','),
    expectedStatus,
    actualStatus: null,
    finalUrl: '',
    redirects: [],
    consoleErrors: [],
    networkErrors: [],
    axeViolations: [],
    responsiveIssues: [],
    seoIssues: [],
    securityIssues: [],
    result: 'BLOCKED',
    notes: '',
  }

  if (!base) {
    result.notes = `BLOCKED_BY_ENVIRONMENT: ${entry.app} ${entry.type === 'api' ? 'API ' : ''}runtime URL tanımlı değil.`
    return result
  }
  if (entry.access === 'private' && !authenticated) {
    result.notes = 'BLOCKED_BY_ENVIRONMENT: authenticated test fixture/credential yok.'
    return result
  }
  if (!isSafePassiveRequest(entry)) {
    result.notes = 'BLOCKED_BY_ENVIRONMENT: mutating veya authenticated API için local fixture/credential yok.'
    return result
  }

  const target = new URL(entry.testPath, base)
  try {
    const response = await fetch(target, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'KadeMedia-Local-Audit/1.0' } })
    result.actualStatus = response.status
    result.finalUrl = target.toString()
    const location = response.headers.get('location')
    if (location) result.redirects.push(new URL(location, target).toString())
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const inspected = inspectHtml(await response.text(), entry)
      result.seoIssues = inspected.seoIssues
      result.notes = `title=${JSON.stringify(inspected.title)}; h1=${inspected.h1Count}; canonical=${inspected.canonical.length}; robots=${JSON.stringify(inspected.robots)}`
    }
    result.result = response.status === expectedStatus && result.seoIssues.length === 0 ? 'PASS' : 'FAIL'
  } catch (error) {
    result.networkErrors.push(error instanceof Error ? error.message : 'Unknown network error')
    result.notes = 'Local passive request failed.'
    result.result = 'FAIL'
  }
  return result
}

const results = []
for (const entry of manifest.routes) results.push(await auditEntry(entry))

await writeFile(new URL('../ROUTE_TEST_RESULTS.json', import.meta.url), `${JSON.stringify(results, null, 2)}\n`)

const counts = results.reduce((summary, item) => {
  summary[item.result] = (summary[item.result] || 0) + 1
  return summary
}, {})
console.log(JSON.stringify({ total: results.length, ...counts }, null, 2))
