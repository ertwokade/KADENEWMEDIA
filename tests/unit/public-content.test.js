import test from 'node:test'
import assert from 'node:assert/strict'
import { publicStats } from '../../server/api/_lib/public-content.js'

test('public stats omit private fields, unpublished and blank rows while preserving real zero', () => {
  const result = publicStats({ notes: 'private', rakamlar: [
    { sayi: 0, etiket: 'Kampanya', privateNote: 'private' },
    { sayi: '94%', etiket: 'Taslak', published: false },
    { sayi: '', etiket: 'Belirsiz' },
  ] });
  assert.deepEqual(result, { rakamlar: [{ sayi: '0', etiket: 'Kampanya', ikon: '' }] });
  assert.deepEqual(publicStats(null), { rakamlar: [] });
});
