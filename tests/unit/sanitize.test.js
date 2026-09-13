import test from 'node:test'
import assert from 'node:assert/strict'

import {
  sanitizeBlogHtml,
  sanitizeNewsletterHtml,
  stripHtml,
} from '../../server/api/_lib/sanitize.js'

const mutationXssPayloads = [
  '<svg><textarea><img src=x onerror=alert(1)>',
  '<math><xmp><img src=x onerror=alert(1)>',
  '<textarea></textarea/><img src=x onerror=alert(1)></textarea>',
]

test('HTML sanitizers reject raw-text mutation XSS payloads', () => {
  for (const payload of mutationXssPayloads) {
    for (const sanitize of [sanitizeBlogHtml, sanitizeNewsletterHtml]) {
      const output = sanitize(payload)
      assert.doesNotMatch(output, /onerror|<svg|<math|<textarea|<xmp/i)
    }
  }
})

test('HTML sanitizers retain only the intended safe markup', () => {
  const input = '<p>Merhaba <strong>Kade</strong><script>alert(1)</script></p>'
  assert.equal(sanitizeBlogHtml(input), '<p>Merhaba <strong>Kade</strong></p>')
  assert.equal(stripHtml(input), 'Merhaba Kade')
})

