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

test('ana sitede yayında olan metinler ödeme onayı gerektirenlerle karışmaz', () => {
  // Panelde "eksik" sayılmayacak olanlar yalnız checkoutConsent=false olanlar;
  // mesafeli satış / ön bilgilendirme / iade sürümlenmiş olmak ZORUNDA.
  const mainSite = LEGAL_DOCUMENTS.filter((d) => d.existingPath && !d.checkoutConsent)
  assert.equal(mainSite.length, 4)
  for (const document of LEGAL_DOCUMENTS.filter((d) => d.checkoutConsent)) {
    assert.equal(document.existingPath, undefined, `${document.slug} ana siteye devredilemez`)
  }
})
