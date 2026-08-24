#!/usr/bin/env node
/**
 * Statik siteyi Next.js dağıtımının `public/` köküne yerleştirir.
 *
 * Tek dağıtım mimarisinde Next.js uygulaması sitenin tamamını barındırır:
 *   /kadeai/*  → apps/kadeai/app/kadeai/   (Next rotaları)
 *   /api/*     → apps/kadeai/pages/api/     (ana sitenin 30 route'u)
 *   diğer      → apps/kadeai/public/        (bu betiğin kopyaladığı statik site)
 *
 * `public/kadeai/` KadeAI'ın kendi varlıklarıdır ve KORUNUR — `withBasePath()`
 * onları /kadeai/... adresinden çağırır. Kopyalama o klasöre dokunmaz.
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'dist')
const to = join(root, 'apps', 'kadeai', 'public')
const KEEP = new Set(['kadeai'])

if (!await stat(from).catch(() => null)) {
  console.error('dist/ yok — önce `npm run legacy:build` çalıştırın.')
  process.exit(1)
}

/* Önceki kopyayı temizle ki silinen sayfalar dağıtımda kalmasın. */
for (const entry of await readdir(to, { withFileTypes: true }).catch(() => [])) {
  if (KEEP.has(entry.name)) continue
  await rm(join(to, entry.name), { recursive: true, force: true })
}

await mkdir(to, { recursive: true })
let n = 0
for (const entry of await readdir(from, { withFileTypes: true })) {
  if (KEEP.has(entry.name)) {
    console.warn(`  ! dist/${entry.name} atlandı — KadeAI ad alanıyla çakışıyor`)
    continue
  }
  await cp(join(from, entry.name), join(to, entry.name), { recursive: true })
  n += 1
}
console.log(`Statik site Next public köküne yerleştirildi — ${n} girdi.`)
