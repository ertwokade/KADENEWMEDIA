import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

test('ana sitedeki operasyon kiti örnek veriyi gerçek sonuç gibi göstermez', () => {
  const html = readFileSync(new URL('../../src/embedded/kadir-organizasyon-kiti/index.html', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../../src/embedded/kadir-organizasyon-kiti/styles.css', import.meta.url), 'utf8')
  const code = readFileSync(new URL('../../src/embedded/kadir-organizasyon-kiti/app.js', import.meta.url), 'utf8')
  assert.match(html, /Başlangıç verileri gösteriliyor/)
  assert.match(html, /Boş çalışma alanına geç/)
  assert.doesNotMatch(html, /value="Kameramanlara kaşe/)
  assert.match(css, /\.starter-notice/)
  assert.match(code, /if\(!s\)return buildCleanInitial\(\)/)
  assert.match(code, /if\(!API\.features\.image\).*örnek kayıt oluşturulmadı/)
  assert.match(code, /if\(!API\.features\.video\).*örnek kayıt oluşturulmadı/)
  assert.doesNotMatch(code, /const fallback=\[\{title:"1 yildizli pizza"/)
})

// İki dağıtım kopyasındaki gerçek fonksiyonlar test edilir; uygulama başlatılmaz,
// ağ, localStorage veya üretim verisi kullanılmaz.
for (const source of ['src/embedded/kadir-organizasyon-kiti/app.js', 'apps/kadexai/public/kadexai/operations-kit/app.js']) {
  const code = readFileSync(new URL(`../../${source}`, import.meta.url), 'utf8')
  function setup() {
    const elements = { videoScore: { innerHTML: '' }, analysisHistory: { innerHTML: '' } }
    const context = vm.createContext({
      themeDefinitions: [], positiveWords: ['güzel'], negativeWords: ['kötü'],
      containsAny: (text, words) => words.some(word => text.includes(word)),
      buildWordCloud: () => [], isObj: value => value !== null && typeof value === 'object',
      idOf: value => value, str: (value, fallback) => typeof value === 'string' ? value : fallback,
      num: (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback,
      arr: value => Array.isArray(value) ? value : [],
      document: { getElementById: id => elements[id] }, state: { analysisHistory: [] },
      esc: value => String(value), fmt: { dt: () => 'test' },
    })
    for (const name of ['parseComments', 'analyzeComments', 'calcVideoScore', 'normalizeAnalysis', 'renderVideoScore', 'renderAnalysisHistory']) {
      const start = code.indexOf(`function ${name}(`)
      assert.notEqual(start, -1, `${name} mevcut olmalı`)
      const end = code.indexOf('\nfunction ', start + 1)
      vm.runInContext(code.slice(start, end === -1 ? undefined : end), context)
    }
    return { context, elements }
  }

  test(`${source}: boş yorum sıfır sayılır, puan veya eleştiri uydurulmaz`, () => {
    const { context, elements } = setup()
    const result = context.analyzeComments('  \n[10] ')
    assert.equal(result.total, 0)
    assert.equal(result.score, null)
    context.renderAnalysisHistory()
    assert.match(elements.analysisHistory.innerHTML, /düğmesiyle geçmişe ekle/)
    context.renderVideoScore(result)
    assert.doesNotMatch(elements.videoScore.innerHTML, /Yoğun eleştiri|\/ 10/)
  })

  test(`${source}: nötr yorum olumsuz sayılmaz, beğeni uydurulmaz`, () => {
    const { context, elements } = setup()
    const result = context.analyzeComments('Ne zaman yayınlanacak?\n[0] Tamam\n[12] güzel')
    assert.equal(result.total, 3)
    assert.equal(result.topComments[0].likes, 12)
    assert.equal(result.topComments.find(c => c.text.startsWith('Ne zaman')).likes, null)
    assert.equal(result.topComments.find(c => c.text === 'Tamam').likes, 0)
    const neutral = context.analyzeComments('Ne zaman yayınlanacak?')
    assert.equal(neutral.score, null)
    context.renderVideoScore(neutral)
    assert.match(elements.videoScore.innerHTML, /olumsuz yorum demek değildir/)
  })

  test(`${source}: hesaplanmayan puan geçmişte sıfıra dönüşmez`, () => {
    const { context, elements } = setup()
    const entry = context.normalizeAnalysis({ id: 'test', rawComments: 'Ne zaman?', total: 1, score: null })
    assert.equal(entry.score, null)
    assert.equal(context.normalizeAnalysis({ rawComments: '', total: 1, score: 5 }).total, 0)
    assert.equal(context.normalizeAnalysis({ rawComments: '', total: 1, score: 5 }).score, null)
    context.state.analysisHistory = [entry]
    context.renderAnalysisHistory()
    assert.match(elements.analysisHistory.innerHTML, /Puan hesaplanmadı/)
    assert.doesNotMatch(elements.analysisHistory.innerHTML, /null\/10|0\/10/)
  })
}
