import test from 'node:test'
import assert from 'node:assert/strict'
import { verbatimQuote } from '../../lib/ai/quotes'

const SOURCE = 'Kade New Media, İstanbul merkezli bir dijital pazarlama ajansıdır. Çalışma ücretsiz 30 dakikalık keşif görüşmesiyle başlar, ardından yazılı teklif gönderilir.'

test('yalnız kaynakta birebir geçen alıntı kabul edilir ve özgün yazımla döner', () => {
  assert.equal(verbatimQuote('"çalışma ücretsiz 30 dakikalık keşif görüşmesiyle başlar"', SOURCE), 'Çalışma ücretsiz 30 dakikalık keşif görüşmesiyle başlar,'.replace(/,$/, ''))
  assert.equal(verbatimQuote('Kade New Media, İstanbul merkezli bir dijital pazarlama ajansıdır', SOURCE), 'Kade New Media, İstanbul merkezli bir dijital pazarlama ajansıdır.')
  // Kelimesi değiştirilmiş veya kaynakta olmayan ifade reddedilir.
  assert.equal(verbatimQuote('Çalışma ücretsiz 30 dakikalık keşif görüşüyle başlar', SOURCE), null)
  assert.equal(verbatimQuote('İstanbul merkezli Kade New Media, küçük işletmelerin dijital dünyada büyümesi için hizmet sunar.', SOURCE), null)
  assert.equal(verbatimQuote('kısa', SOURCE), null)
})
