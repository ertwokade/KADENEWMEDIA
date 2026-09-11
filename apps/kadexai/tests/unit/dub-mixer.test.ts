import test from 'node:test'
import assert from 'node:assert/strict'
import { assembleDubTrack } from '../../lib/media/dubMixer'

test('dublaj boş ya da eksik ses parçalarını dosya oluşturmadan reddeder', async () => {
  await assert.rejects(assembleDubTrack([], { duration: 10 }), /parça yok/)
  await assert.rejects(assembleDubTrack([
    { index: 1, start: 0, end: 1, audio: 'YQ==' },
    { index: 2, start: 1, end: 2, audio: '' },
  ], { duration: 10 }), /eksik ses parçaları/)
})

test('tek bir bozuk ses parçası sessiz bir aralıkla başarıya dönüşmez', async () => {
  let closed = false
  let calls = 0
  const previous = globalThis.AudioContext
  globalThis.AudioContext = class {
    async decodeAudioData() {
      if (++calls === 2) throw new Error('Invalid audio')
      return { duration: 1 }
    }
    async close() { closed = true }
  } as unknown as typeof AudioContext
  try {
    await assert.rejects(assembleDubTrack([
      { index: 1, start: 0, end: 1, audio: 'YQ==' },
      { index: 2, start: 1, end: 2, audio: 'Yg==' },
    ], { duration: 2 }), /2 numaralı bölümün sesi çözülemedi/)
    assert.equal(calls, 2)
    assert.equal(closed, true, 'başarısız çözümlemede ses kaynağı kapatılır')
  } finally {
    globalThis.AudioContext = previous
  }
})
