import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeThread } from '../../lib/ai/thread'

test('thread açılış gönderisini ilk sıraya koyar, uzun gönderiyi atmaz ve istenen adede uyar', () => {
  const long = `${'Uzun bir cümle. '.repeat(25)}Son.`
  const thread = normalizeThread({
    hook: 'Küçük işletmelerin sosyal medyada yaptığı 5 hata',
    posts: [
      { no: 1, icerik: 'Hata 1: hedef kitleyi bilmemek', tip: 'bilgi' },
      { no: 2, icerik: long, tip: 'bilgi' },
      { no: 3, icerik: 'Hata 3', tip: 'bilgi' },
      { no: 4, icerik: 'Hata 4', tip: 'bilgi' },
      { no: 5, icerik: 'Hata 5', tip: 'bilgi' },
      { no: 6, icerik: 'Beğenmeyi unutma', tip: 'cta' },
    ],
  }, 'x', 7)
  assert.equal(thread.posts.length, 7)
  assert.equal(thread.posts[0].icerik, 'Küçük işletmelerin sosyal medyada yaptığı 5 hata')
  assert.ok(thread.posts[2].icerik.length <= 280)
  assert.deepEqual(thread.posts.map((post) => post.no), [1, 2, 3, 4, 5, 6, 7])
})
