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
    const names = ['parseComments', 'analyzeComments', 'calcVideoScore', 'normalizeAnalysis', 'renderVideoScore', 'renderAnalysisHistory']
    if (code.includes('function commentSentiment(')) {
      names.push('commentSentiment')
      vm.runInContext('var negationPattern = /(değil|olmamış|olmadı|yaramadı|yok)\\b/', context)
    }
    for (const name of names) {
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

test('KadexAI SentScan açık olumsuz yorumları sayar, soru ve istekleri nötr bırakır', () => {
  const code = readFileSync(new URL('../../apps/kadexai/public/kadexai/operations-kit/app.js', import.meta.url), 'utf8')
  const context = vm.createContext({ buildWordCloud: () => [] })
  for (const constant of ['themeDefinitions', 'positiveWords', 'negativeWords', 'negationPattern']) {
    const start = code.indexOf(`const ${constant} =`)
    const end = code.indexOf(';\n', start)
    vm.runInContext(code.slice(start, end + 1).replace(/^const /, 'var '), context)
  }
  for (const name of ['containsAny', 'commentSentiment', 'parseComments', 'analyzeComments', 'calcVideoScore']) {
    const start = code.indexOf(`function ${name}(`)
    const end = code.indexOf('\nfunction ', start + 1)
    vm.runInContext(code.slice(start, end === -1 ? undefined : end), context)
  }
  const result = context.analyzeComments('Harika video, çok işime yaradı!\nSesi çok düşük, anlaşılmıyor.\nFiyatlar ne kadar?\nBir sonraki bölüm ne zaman?\nBence konu yüzeysel kalmış.')
  assert.equal(result.total, 5)
  assert.equal(result.sentiment.positive, 1)
  assert.equal(result.sentiment.negative, 2)
  assert.equal(result.sentiment.neutral, 2)
  assert.equal(result.sentiment.question, 2)
  const themeNames = result.themes.map((theme) => theme.name)
  assert.ok(themeNames.includes('Ses ve görüntü kalitesi'))
  assert.ok(themeNames.includes('İçerik derinliği'))
  assert.ok(!themeNames.some((name) => /Konsept|Kamusal/.test(name)))
  assert.equal(context.commentSentiment('Hiç güzel değil'), 'negative')
})

test('KadexAI SentScan transkripti konuya göre özetler, SRT satırlarını temizler ve cümle tekrarlamaz', () => {
  const code = readFileSync(new URL('../../apps/kadexai/public/kadexai/operations-kit/app.js', import.meta.url), 'utf8')
  const context = vm.createContext({})
  const stop = code.indexOf('const stopWords =')
  vm.runInContext(code.slice(stop, code.indexOf(';\n', stop) + 1).replace(/^const /, 'var '), context)
  for (const name of ['transcriptCueTimes', 'analyzeTranscriptText', 'repairTextEncoding', 'cleanTranscript', 'countWords']) {
    const start = code.indexOf(`function ${name}(`)
    const end = code.indexOf('\nfunction ', start + 1)
    vm.runInContext(code.slice(start, end === -1 ? undefined : end), context)
  }
  const srt = '1\n00:00:00,000 --> 00:00:03,758\nMerhaba ben Kadir, bugün sosyal medya hatalarını anlatıyorum.\n\n2\n00:00:03,758 --> 00:00:08,000\nSosyal medya hatalarını anlatıyorum.\n\n3\n00:00:08,000 --> 00:00:12,000\nİlk hata hedef kitleyi bilmeden paylaşım yapmak.\n'
  const clean = context.cleanTranscript(srt)
  assert.doesNotMatch(clean, /-->|^\s*\d+\s*$/m)
  const insight = context.analyzeTranscriptText(srt)
  assert.equal(insight.timestamps.length, 3)
  assert.ok(insight.topics.some((topic) => topic.word === 'sosyal' || topic.word === 'hatalarını'))
  assert.equal(new Set(insight.keySentences).size, insight.keySentences.length)
  assert.doesNotMatch(insight.summary, /Yayın takvimi|Müşteri/)
})
