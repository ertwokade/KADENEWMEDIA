import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('homepage content is public and editable', async () => {
  const api = await read('server/api/content.js')
  assert.match(api, /PUBLIC_CONTENT_SECTIONS[\s\S]*?'homepage'/)
  assert.match(api, /CONTENT_SECTIONS[\s\S]*?'homepage'/)
})

test('Haoqi snapshot loads the homepage admin runtime', async () => {
  const [snapshot, runtime] = await Promise.all([
    read('haoqi-clone/index.html'),
    read('haoqi-clone/homepage-admin.js'),
  ])
  const transform = await read('haoqi-clone/kade-html-transform.mjs')
  assert.match(transform, /['"]\/homepage-admin\.js['"]/)
  assert.match(runtime, /fetch\('\/api\/content\?section=homepage'/)
  assert.match(runtime, /data\.workItems/)
  assert.match(runtime, /data\.navItems/)
  assert.match(runtime, /data\.contactLines/)
  assert.match(runtime, /h1\[data-kade-seo-title\]/)
  assert.match(runtime, /div\.font-bold\.uppercase\.leading-none/)
})

test('admin exposes an addable homepage editor', async () => {
  const [admin, editor] = await Promise.all([
    read('src/pages/Admin.jsx'),
    read('src/pages/admin/editors/HomepageEditor.jsx'),
  ])
  assert.match(admin, /id: 'homepage'/)
  assert.match(admin, /handleSave\('homepage', data\)/)
  assert.match(editor, /Ana sayfayı kaydet/)
  assert.match(editor, /Çalışma \/ hizmet kartları/)
  assert.match(editor, /Sosyal bağlantılar/)
})
