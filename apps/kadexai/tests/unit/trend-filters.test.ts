import test from 'node:test'
import assert from 'node:assert/strict'
import { boundedNumber, trendFiltersFromParams } from '../../lib/kade-search/filters'

test('all countries stays all while missing country can use TR default', () => {
  assert.equal(trendFiltersFromParams(new URLSearchParams('country=all&language=all'), 'TR').country, 'all')
  assert.equal(trendFiltersFromParams(new URLSearchParams(), 'TR').country, 'TR')
  assert.equal(trendFiltersFromParams(new URLSearchParams()).country, undefined)
})

test('all supported filter dimensions survive parsing', () => {
  const result = trendFiltersFromParams(new URLSearchParams('platform=youtube&category=teknoloji&kind=video&stage=rising&q=arama&since=72&sort=views'))
  assert.deepEqual([result.platform, result.category, result.kind, result.stage, result.q, result.sinceHours, result.sort], ['youtube', 'teknoloji', 'video', 'rising', 'arama', 72, 'views'])
})

test('invalid, negative and enormous query numbers cannot become invalid database ranges', () => {
  assert.equal(boundedNumber('NaN', 10, 1, 40), 10)
  assert.equal(boundedNumber('Infinity', 10, 1, 40), 10)
  assert.equal(boundedNumber('-5', 10, 1, 40), 1)
  assert.equal(boundedNumber('10000', 10, 1, 40), 40)
  assert.equal(boundedNumber('3.9', 10, 1, 40), 3)
  const result = trendFiltersFromParams(new URLSearchParams('limit=-1&offset=-4&since=NaN&sort=unknown'))
  assert.deepEqual([result.limit, result.offset, result.sinceHours, result.sort], [1, 0, 168, 'score'])
})
