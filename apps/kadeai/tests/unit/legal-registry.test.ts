import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LEGAL_DOCUMENTS, LEGAL_SLUGS, checkoutConsentSlugs, getLegalSpec } from '../../lib/legal/registry'

test('§5 listesindeki 13 belge tanımlı ve slug\'ları benzersiz', () => {
  assert.equal(LEGAL_DOCUMENTS.length, 13)
  assert.equal(new Set(LEGAL_SLUGS).size, LEGAL_SLUGS.length)
})

test('ödeme öncesi onay gerektiren belgeler mesafeli satış mevzuatına göre işaretli', () => {
  assert.deepEqual(checkoutConsentSlugs().sort(), ['iade-iptal', 'mesafeli-satis', 'on-bilgilendirme'])
})

test('slug formatı migration CHECK kuralıyla uyumlu', () => {
  for (const slug of LEGAL_SLUGS) {
    assert.match(slug, /^[a-z0-9][a-z0-9-]{1,79}$/, `${slug} slug kuralına uymuyor`)
  }
})

test('bilinmeyen slug için spec dönmez', () => {
  assert.equal(getLegalSpec('uydurma-metin'), undefined)
  assert.ok(getLegalSpec('mesafeli-satis'))
})
