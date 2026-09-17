import test from 'node:test'
import assert from 'node:assert/strict'
import { presentMaterials, trustedDuration } from '../../lib/materials/present'

test('arşiv kaynağının 60 sn yer tutucu süresi gösterilmez, gerçek süreler kalır', () => {
  assert.equal(trustedDuration({ source: 'arsivhub', duration_sec: 60 }), null)
  assert.equal(trustedDuration({ source: 'arsivhub', duration_sec: 17 }), 17)
  assert.equal(trustedDuration({ source: 'youtube', duration_sec: 60 }), 60)
})

test('çocukları küçük düşüren başlıklar listelenmez, sıradan çocuk içeriği kalır', () => {
  const { visible, hidden } = presentMaterials([
    { title: 'Tuvalette sıçarken ağlayan çocuk', source: 'arsivhub', duration_sec: 60 },
    { title: 'Satılık dilenci çocuk', source: 'arsivhub', duration_sec: 60 },
    { title: 'osurarak merdiven çıkan çocuk', source: 'arsivhub', duration_sec: 60 },
    { title: 'Mahalle Yanarken Salıncakta Sallanan Çocuk', source: 'arsivhub', duration_sec: 60 },
    { title: 'Çocuk parkında bahar şenliği', source: 'arsivhub', duration_sec: 60 },
    { title: 'Nemo köpekbalığı', source: 'arsivhub', duration_sec: 60 },
  ])
  assert.equal(hidden, 4)
  assert.deepEqual(visible.map((row) => row.title), ['Çocuk parkında bahar şenliği', 'Nemo köpekbalığı'])
  assert.equal(visible[0].duration_sec, null)
})
