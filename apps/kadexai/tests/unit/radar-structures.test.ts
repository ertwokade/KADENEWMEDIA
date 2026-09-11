import test from 'node:test'
import assert from 'node:assert/strict'
import { FORMATS } from '../../lib/kade-search/taxonomy'
import { FORMAT_STRUCTURES, structureFor } from '../../lib/kade-search/structures'
import { detectLanguage } from '../../lib/kade-search/classify'
import type { RawTrendItem } from '../../lib/kade-search/types'

test('all twenty advertised formats have distinct shooting structures', () => {
  assert.equal(Object.keys(FORMATS).length, 20)
  assert.deepEqual(Object.keys(FORMAT_STRUCTURES).sort(), Object.keys(FORMATS).sort())
  assert.equal(new Set(Object.values(FORMAT_STRUCTURES).map(value => value.join('|'))).size, 20)
  for (const key of Object.keys(FORMATS)) {
    const result = structureFor(key, 'İstanbul 🎬')
    assert.equal(result.length, 3)
    assert.ok(result[0].includes('İstanbul 🎬'))
    assert.ok(structureFor(key, 'Konu', true)[2].startsWith('45–60 sn'))
  }
})

test('foreign accented titles and collector boilerplate do not prove Turkish', () => {
  const language = (title: string, description = '') => detectLanguage({ title, description } as RawTrendItem)
  assert.equal(language('Über schöne Bücher'), 'und')
  assert.equal(language('Ça va?'), 'und')
  assert.equal(language('Summer morning routine', '[ÇIKARIM] Türkiye için çıkarılmış kayıt'), 'und')
  assert.equal(language('Bu, ne için?'), 'tr')
  assert.equal(language('İstanbul ve alışveriş'), 'tr')
  assert.equal(language('What is the best camera?'), 'en')
})
