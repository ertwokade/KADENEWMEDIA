import test from 'node:test'
import assert from 'node:assert/strict'
import { prefillQuery, splitList, withPrefill } from '../../lib/client/prefill'

test('geçmiş girdileri adres parametresine yalnız güvenli alanlarla taşınır', () => {
  const query = new URLSearchParams(prefillQuery({ topic: 'Sosyal medya hataları', platforms: ['instagram', 'youtube'], count: 7, model: 'auto', words: [{ word: 'x' }], profile: { a: 1 } }))
  assert.equal(query.get('topic'), 'Sosyal medya hataları')
  assert.equal(query.get('platforms'), 'instagram,youtube')
  assert.equal(query.get('count'), '7')
  assert.equal(query.has('model'), false)
  assert.equal(query.has('words'), false)
  assert.equal(withPrefill('/dashboard/hashtag', {}), '/dashboard/hashtag')
  assert.match(withPrefill('/dashboard/operations?view=crm', { topic: 'a' }), /\?view=crm&topic=a$/)
  assert.deepEqual(splitList('instagram, youtube,,'), ['instagram', 'youtube'])
})

test('takvime ekle bağlantısı hook formatını platforma çevirir ve yarının tarihini taşır', async () => {
  const { calendarHref, nextDayIstanbul } = await import('../../lib/client/calendarLink')
  assert.equal(nextDayIstanbul(new Date('2026-09-16T22:30:00Z')), '2026-09-18')
  const url = new URL(`https://x${calendarHref('Hook metni', 'reels', '2026-10-02')}`)
  assert.equal(url.searchParams.get('platform'), 'instagram')
  assert.equal(url.searchParams.get('date'), '2026-10-02')
  assert.equal(url.searchParams.get('title'), 'Hook metni')
})
