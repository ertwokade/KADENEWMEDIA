#!/usr/bin/env node
/**
 * Supabase şema ↔ kod uyum denetimi.
 *
 * Neden gerekli: `/api/content?action=pageview` uzun süre HTTP 500 dönüyordu.
 * Sebep, kodun `kade_traffic_sources.detail` alanına `null` yazmaya
 * çalışmasıydı; şemada o kolon `NOT NULL`. Bu tür uyumsuzluklar yalnız
 * çalışma anında, üstelik belirli bir veri yolunda ortaya çıkıyor.
 *
 * Bu script migration SQL'lerinden tablo/kolon bilgisini çıkarır ve
 * server/api altındaki Supabase çağrılarıyla karşılaştırır:
 *   • var olmayan tabloya erişim
 *   • var olmayan kolona select/eq/insert/update
 *   • NOT NULL ve varsayılansız kolona `null` yazma
 *   • .maybeSingle() kullanılan yerde unique index olup olmadığı
 *
 * Statik analizdir: dinamik olarak kurulan alan adlarını göremez.
 * Bulduğu her şey gerçek, bulamadığı her şey garanti değil.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const MIGRATIONS = join(ROOT, 'apps/kadexai/supabase/migrations')
const API_DIR = join(ROOT, 'server/api')

// ── 1) Şemayı oku ───────────────────────────────────────────────────────────

/** @type {Map<string, {columns: Map<string, {notNull: boolean, hasDefault: boolean}>, uniques: string[][]}>} */
const schema = new Map()

const migrationFiles = (await readdir(MIGRATIONS)).filter((f) => f.endsWith('.sql')).sort()
for (const file of migrationFiles) {
  const sql = await readFile(join(MIGRATIONS, file), 'utf8')

  // CREATE TABLE blokları
  const createRe = /CREATE TABLE IF NOT EXISTS public\.(\w+)\s*\(([\s\S]*?)\n\);/g
  for (const match of sql.matchAll(createRe)) {
    const [, table, body] = match
    const entry = schema.get(table) || { columns: new Map(), uniques: [] }
    for (const rawLine of body.split('\n')) {
      const line = rawLine.trim().replace(/,$/, '')
      if (!line || /^(PRIMARY KEY|UNIQUE|CHECK|CONSTRAINT|FOREIGN KEY)/i.test(line)) continue
      // Rezerve kelimeler şemada tırnaklı yazılır: `"user" TEXT`
      const col = line.match(/^"?(\w+)"?\s+/)
      if (!col) continue
      entry.columns.set(col[1], {
        notNull: /NOT NULL/i.test(line),
        hasDefault: /DEFAULT/i.test(line),
      })
    }
    schema.set(table, entry)
  }

  // ALTER TABLE ... ADD COLUMN — tek ve çok satırlı biçimlerin ikisi de
  // kullanılıyor:  ALTER TABLE x\n  ADD COLUMN a TYPE,\n  ADD COLUMN b TYPE;
  for (const m of sql.matchAll(/ALTER TABLE (?:IF EXISTS )?public\.(\w+)([\s\S]*?);/gi)) {
    const [, table, body] = m
    if (!/ADD COLUMN/i.test(body)) continue
    const entry = schema.get(table) || { columns: new Map(), uniques: [] }
    for (const add of body.matchAll(/ADD COLUMN (?:IF NOT EXISTS )?"?(\w+)"?([^,;]*)/gi)) {
      entry.columns.set(add[1], {
        notNull: /NOT NULL/i.test(add[2]),
        hasDefault: /DEFAULT/i.test(add[2]),
      })
    }
    schema.set(table, entry)
  }

  // UNIQUE INDEX
  // İfade tabanlı index'ler de sayılır: ON kade_users (lower(username))
  for (const m of sql.matchAll(/CREATE UNIQUE INDEX (?:IF NOT EXISTS )?\w+\s+ON public\.(\w+)\s*\((.+?)\)\s*(?:WHERE|;)/gis)) {
    const [, table, cols] = m
    const entry = schema.get(table)
    if (!entry) continue
    const names = cols
      .split(',')
      .map((c) => c.trim().replace(/^\w+\((.+)\)$/, '$1').replace(/"/g, '').trim())
      .filter(Boolean)
    entry.uniques.push(names)
  }
}

// ── 2) Kodu tara ────────────────────────────────────────────────────────────

const findings = []
const add = (level, file, message) => findings.push({ level, file, message })

const apiFiles = []
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await collect(full)
    else if (entry.name.endsWith('.js')) apiFiles.push(full)
  }
}
await collect(API_DIR)

/** Bir `.from('x')` çağrısından sonraki zinciri kabaca yakalar. */
function chainAfter(source, index) {
  // Aynı ifade zinciri: bir sonraki `.from(` veya iki boş satıra kadar.
  const rest = source.slice(index, index + 900)
  const nextFrom = rest.indexOf(".from('", 10)
  return nextFrom > 0 ? rest.slice(0, nextFrom) : rest
}

for (const file of apiFiles) {
  const source = await readFile(file, 'utf8')
  const rel = file.replace(ROOT, '')

  for (const m of source.matchAll(/\.from\('(\w+)'\)/g)) {
    const table = m[1]
    const entry = schema.get(table)
    if (!entry) {
      add('HATA', rel, `şemada olmayan tablo: ${table}`)
      continue
    }

    const chain = chainAfter(source, m.index)
    const known = entry.columns

    // .select('a, b, c')
    for (const sel of chain.matchAll(/\.select\('([^']*)'/g)) {
      const list = sel[1]
      if (list.includes('*') || list.includes('(')) continue // ilişki/joker
      for (const raw of list.split(',')) {
        const col = raw.trim().split(/[:\s]/)[0]
        if (!col || col === 'count') continue
        if (!known.has(col)) add('HATA', rel, `${table}.select — bilinmeyen kolon: ${col}`)
      }
    }

    // .eq('col', ...) / .neq / .gte / .lte / .gt / .lt / .is / .ilike / .like
    for (const f of chain.matchAll(/\.(eq|neq|gte|lte|gt|lt|is|ilike|like)\('(\w+)'/g)) {
      const [, op, col] = f
      if (!known.has(col)) {
        add('HATA', rel, `${table}.${op}('${col}') — bilinmeyen kolon`)
        continue
      }
      // NOT NULL kolonda `.is(col, null)` hiçbir zaman eşleşmez.
      if (op === 'is' && /\.is\('\w+',\s*null\)/.test(f[0] + chain.slice(f.index, f.index + 30))) {
        if (known.get(col)?.notNull) {
          add('HATA', rel, `${table}.is('${col}', null) — kolon NOT NULL, bu koşul asla eşleşmez`)
        }
      }
    }

    // .order('col')
    for (const o of chain.matchAll(/\.order\('(\w+)'/g)) {
      if (!known.has(o[1])) add('HATA', rel, `${table}.order('${o[1]}') — bilinmeyen kolon`)
    }

    // .insert({...}) / .update({...}) / .upsert({...})
    for (const w of chain.matchAll(/\.(insert|update|upsert)\(\s*\{([^}]*)\}/g)) {
      const [, op, body] = w
      for (const pair of body.split(',')) {
        const kv = pair.match(/^\s*(\w+)\s*:\s*(.*)$/s)
        if (!kv) continue
        const [, col, value] = kv
        if (!known.has(col)) {
          add('HATA', rel, `${table}.${op} — bilinmeyen kolon: ${col}`)
          continue
        }
        const meta = known.get(col)
        if (meta.notNull && !meta.hasDefault && /^null\b/.test(value.trim())) {
          add('HATA', rel, `${table}.${op} — ${col} NOT NULL ama null yazılıyor`)
        }
      }
    }

    // .maybeSingle() — filtrelenen kolonlar unique index'le korunuyor mu?
    // `.limit(1)` zinciri zaten en fazla bir satır döndürür; bu durumda
    // birden fazla kayıt olsa bile çalışma anında hata oluşmaz.
    if (/\.maybeSingle\(\)/.test(chain) && !/\.limit\(1\)/.test(chain)) {
      const filtered = [...chain.matchAll(/\.eq\('(\w+)'/g)].map((x) => x[1]).sort()
      if (filtered.length) {
        // Bir unique index'in kolonlarının TAMAMI filtreleniyorsa sonuç en
        // fazla bir satırdır. Örn. slug unique ise (active, slug) da tektir.
        const covered = entry.uniques.some((u) => u.every((col) => filtered.includes(col)))
        const isPk = filtered.includes('id')
        if (!covered && !isPk) {
          add('UYARI', rel,
            `${table}.maybeSingle() — (${filtered.join(', ')}) için unique index yok; ` +
            'birden fazla satır dönerse çalışma anında hata verir')
        }
      }
    }
  }
}

// ── 3) Rapor ────────────────────────────────────────────────────────────────

console.log(`\nŞema: ${schema.size} tablo, ${migrationFiles.length} migration dosyası`)
console.log(`Taranan API dosyası: ${apiFiles.length}\n`)

const errors = findings.filter((f) => f.level === 'HATA')
const warnings = findings.filter((f) => f.level === 'UYARI')

const group = (list) => {
  const byFile = new Map()
  for (const f of list) {
    if (!byFile.has(f.file)) byFile.set(f.file, [])
    byFile.get(f.file).push(f.message)
  }
  for (const [file, messages] of byFile) {
    console.log(`  ${file}`)
    for (const message of [...new Set(messages)]) console.log(`    • ${message}`)
  }
}

if (errors.length) {
  console.log(`── HATA (${errors.length}) ──`)
  group(errors)
  console.log()
}
if (warnings.length) {
  console.log(`── UYARI (${warnings.length}) ──`)
  group(warnings)
  console.log()
}

if (!errors.length && !warnings.length) {
  console.log('Şema ile kod arasında uyumsuzluk bulunamadı.')
}

console.log('─'.repeat(64))
process.exit(errors.length ? 1 : 0)
