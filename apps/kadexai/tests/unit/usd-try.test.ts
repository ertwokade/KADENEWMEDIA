import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTcmbUsdSelling, usdTryRate } from '../../lib/finance/usdTry'

const xml = '<Tarih_Date><Currency CrossOrder="0" Kod="USD" CurrencyCode="USD"><Unit>1</Unit><ForexBuying>48.5873</ForexBuying><ForexSelling>48.6749</ForexSelling></Currency><Currency Kod="EUR" CurrencyCode="EUR"><ForexSelling>55.1</ForexSelling></Currency></Tarih_Date>'

test('TCMB listesinden yalnız USD satış kuru okunur, ayar varsa o kullanılır', async () => {
  assert.equal(parseTcmbUsdSelling(xml), 48.6749)
  assert.equal(parseTcmbUsdSelling('<x/>'), null)
  const previous = process.env.KADE_USD_TRY_RATE
  process.env.KADE_USD_TRY_RATE = '40'
  assert.deepEqual(await usdTryRate(), { rate: 40, source: 'ayar' })
  delete process.env.KADE_USD_TRY_RATE
  assert.deepEqual(await usdTryRate(async () => new Response(xml)), { rate: 48.6749, source: 'TCMB günlük kur' })
  if (previous !== undefined) process.env.KADE_USD_TRY_RATE = previous
})
