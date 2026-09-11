import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ModelOutput from '../../components/ui/ModelOutput'

const render = (content: string) => renderToStaticMarkup(createElement(ModelOutput, { content }))

test('iç içe JSON metinleri de Markdown olarak okunur gösterilir', () => {
  const html = render(JSON.stringify({ adim: { metin: '**Başlık**\n- Bir\n- İki' } }))
  assert.match(html, /<dl/)
  assert.match(html, /<strong[^>]*>Başlık<\/strong>/)
  assert.match(html, /<ul/)
  assert.doesNotMatch(html, /\*\*Başlık\*\*/)
})

test('JSON içindeki kod çitleri veri kaybetmeden çizilir', () => {
  const html = render('```json\n' + JSON.stringify({ kod: '```js\nconst test = "json";\n```' }) + '\n```')
  assert.match(html, /<pre[^>]*><code>const test = &quot;json&quot;;<\/code><\/pre>/)
})

test('sıralı liste numaraları ve HTML güvenliği korunur', () => {
  const html = render('3. Üç\n4. Dört\n\n<script>alert(1)</script>')
  assert.match(html, /<ol[^>]*start="3"/)
  assert.match(html, /<li>Üç<\/li><li>Dört<\/li>/)
  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;/)
})

test('yarım kod çiti çıktıyı kaybetmez; sıfır ve false kaybolmaz', () => {
  assert.match(render('```\nörnek'), /<code>örnek<\/code>/)
  const html = render('{"puan":0,"hazir":false}')
  assert.match(html, />0<\/p>/)
  assert.match(html, />false<\/p>/)
})
