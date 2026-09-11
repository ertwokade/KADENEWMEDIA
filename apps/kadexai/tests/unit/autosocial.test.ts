import test from 'node:test'
import assert from 'node:assert/strict'
import { createAutoSocialSidecar } from '../../lib/autosocial'

test('AutoSocial sidecar preserves exact Unicode basename and UTF-8 caption', () => {
  assert.deepEqual(createAutoSocialSidecar('İçerik 01.final.MP4', '  İlk satır 🎬\n#istanbul  '), {
    filename: 'İçerik 01.final.description', text: 'İlk satır 🎬\n#istanbul',
  })
})

test('all documented video extensions are supported', () => {
  for (const extension of ['mp4', 'mov', 'webm', 'avi', 'mkv']) {
    assert.equal(createAutoSocialSidecar(`video.${extension}`, 'Açıklama').filename, 'video.description')
  }
})

test('unsafe paths, Windows reserved names, hidden files and non-video names fail closed', () => {
  for (const name of ['../video.mp4', 'C:\\video.mp4', '.video.mp4', 'con.mp4', 'LPT1.final.mp4', 'a?.mp4', 'a\n.mp4', 'a .mp4', 'a.mp4 ', 'a.mp4.exe', 'video', '']) {
    assert.throws(() => createAutoSocialSidecar(name, 'Açıklama'), name)
  }
})

test('empty and excessive captions are rejected without truncating silently', () => {
  assert.throws(() => createAutoSocialSidecar('video.mp4', ' \u0000 '))
  assert.throws(() => createAutoSocialSidecar('video.mp4', 'a'.repeat(5001)))
  assert.equal(createAutoSocialSidecar('video.mp4', 'a\u0000b').text, 'ab')
})
