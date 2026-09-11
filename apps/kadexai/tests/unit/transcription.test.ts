import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { validateTranscript, transcriptionVocabulary } from '../../lib/ai/transcription'
import { completeTranslations } from '../../lib/subtitles/translations'

const valid = { text: 'Kade Media', words: [{ word: 'Kade', start: 0, end: 0.5 }, { word: 'Media', start: 0.5, end: 1 }], language: 'tr' }
const audio = () => new File(['RIFF0000WAVE000000'], 'voice.wav', { type: 'audio/wav' })
function compile(path: string, require: (name: string) => unknown, globals: Record<string, unknown> = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports: Record<string, unknown> = {}
  runInNewContext(code, { exports, require, File, FormData, Uint8Array, AbortSignal, Buffer, ...globals })
  return exports
}

test('transcript validates complete word timings, preserves zero and distinguishes silence', () => {
  assert.deepEqual(validateTranscript(valid), valid)
  assert.equal(validateTranscript({ text: '', words: [] }).words.length, 0)
  for (const value of [null, {}, { text: '', words: valid.words }, { text: 'Kade', words: [] },
    ...[null, 'word', {}, { word: {}, start: 0, end: 1 }, { word: 'x', start: -1, end: 1 },
      { word: 'x', start: 0, end: 0 }, { word: 'x', start: '0', end: 1 }, { word: 'x', start: 0, end: Infinity }].map(word => ({ text: 'x', words: [word] })),
    { ...valid, words: [...valid.words].reverse() }]) assert.throws(() => validateTranscript(value))
})

test('vocabulary keeps names, deduplicates and bounds user supplied context', () => {
  const words = transcriptionVocabulary(['Kadir Demir', 'Kade Media', false, ''], 'Kadir Demir,\nÜrün <adı>,KadexAI')
  assert.equal(words.filter(word => word === 'Kadir Demir').length, 1)
  assert.equal(words.filter(word => word === 'Kade Media').length, 1)
  assert.ok(words.includes('Ürün adı'))
  assert.ok(transcriptionVocabulary([], 'x'.repeat(1000))[3].length <= 80)
  assert.ok(transcriptionVocabulary([], Array.from({ length: 100 }, (_, i) => `Term ${i}`).join(',')).length <= 23)
})

test('dubbing translation rejects missing, duplicate, empty, skipped and unrelated cues', () => {
  const source = [{ index: 1, text: 'Merhaba', start: 0, end: 1 }, { index: 2, text: 'Dünya', start: 2, end: 3 }]
  const translated = [{ index: 2, text: 'World' }, { index: 1, text: 'Hello' }]
  assert.deepEqual(completeTranslations(source, translated), [{ ...source[0], text: 'Hello' }, { ...source[1], text: 'World' }])
  for (const value of [null, [], [translated[0]], [translated[0], translated[0]], [{ index: 1, text: '' }, translated[0]],
    [{ index: 1, text: 'Merhaba', atlandi: true }, translated[0]], [{ index: 4, text: 'x' }, translated[0]]]) assert.throws(() => completeTranslations(source, value))
})

function transcribeRoute({ output = valid as unknown, groq = false, denied = false, planDenied = false, limited = false, failed = false, configured = true } = {}) {
  const calls: unknown[] = []
  const exports = compile('../../app/kadexai/api/transcribe/route.ts', name => {
    if (name === 'next/server') return { NextResponse: { json: Response.json } }
    if (name === '@/lib/auth/server') return { requireApiUser: async () => denied ? Response.json({}, { status: 401 }) : null, hasAuthenticatedUser: async () => true }
    if (name === '@/lib/payments/featureGuard') return { requireToolFeature: async () => planDenied ? Response.json({}, { status: 403 }) : null }
    if (name === '@/lib/rateLimit') return { getRateLimitKey: () => 'test', rateLimit: () => ({ allowed: !limited }) }
    if (name === '@/lib/ai/transcription') return { validateTranscript, transcriptionVocabulary }
    if (name === '@/lib/ai/profileContext') return { getRequestProfileVocabulary: async () => ['Kadir Demir'] }
    if (name === '@/lib/ai/geminiTranscribe') return { geminiTranscribeKullanilabilir: () => configured, geminiTranscribe: async (_file: File, vocabulary: string[]) => { calls.push(vocabulary); if (failed) throw Error('private-secret'); return output } }
    throw Error(name)
  }, { process: { env: { GROQ_API_KEY: groq ? 'test-only' : '' } }, fetch: async (_url: string, options: { body: FormData }) => { calls.push(options.body.get('prompt')); if (failed) throw Error('private-secret'); return Response.json(output) } })
  const post = exports.POST as (req: Request) => Promise<Response>
  return { calls, post: (file: File | null = audio(), vocabulary?: string | File, malformed = false) => {
    const body = new FormData()
    if (file) body.set('file', file)
    if (vocabulary !== undefined) body.set('vocabulary', vocabulary)
    return post(new Request('http://localhost/api/transcribe', { method: 'POST', body: malformed ? 'broken' : body }))
  } }
}

test('transcription guards and missing configuration do not call providers', async () => {
  for (const [options, status] of [[{ denied: true }, 401], [{ planDenied: true }, 403], [{ limited: true }, 429], [{ configured: false }, 503]] as const) {
    const api = transcribeRoute(options)
    assert.equal((await api.post()).status, status)
    assert.equal(api.calls.length, 0)
  }
})

test('transcription input errors are rejected before provider calls', async () => {
  const api = transcribeRoute()
  assert.equal((await api.post(null)).status, 400)
  assert.equal((await api.post(new File([], 'empty.wav', { type: 'audio/wav' }))).status, 400)
  assert.equal((await api.post(new File(['not audio'], 'fake.wav', { type: 'audio/wav' }))).status, 415)
  assert.equal((await api.post(audio(), 'x'.repeat(2001))).status, 400)
  assert.equal((await api.post(audio(), audio())).status, 400)
  assert.equal((await api.post(audio(), '', true)).status, 400)
  assert.equal(api.calls.length, 0)
})

test('both transcription providers return validated data and receive personal vocabulary', async () => {
  for (const groq of [true, false]) {
    const api = transcribeRoute({ groq })
    const response = await api.post(new File(['RIFF0000WAVE0000'], 'voice.wav', { type: 'audio/wav;codecs=pcm' }), 'Özel Ürün')
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.equal(result.timing, groq ? 'word' : 'estimated')
    assert.deepEqual(result.words, valid.words)
    assert.match(JSON.stringify(api.calls), /Kadir Demir/)
    assert.match(JSON.stringify(api.calls), /Özel Ürün/)
  }
})

test('empty speech is 422, malformed or failed providers are 502 without sensitive details', async () => {
  for (const groq of [true, false]) {
    assert.equal((await transcribeRoute({ groq, output: { text: '', words: [] } }).post()).status, 422)
    for (const output of [{}, { text: 'partial', words: [] }, { ...valid, words: [null] }]) assert.equal((await transcribeRoute({ groq, output }).post()).status, 502)
    const response = await transcribeRoute({ groq, failed: true }).post()
    assert.equal(response.status, 502)
    assert.doesNotMatch(await response.text(), /private-secret/)
  }
})

test('Gemini rejects malformed segments instead of quietly creating partial subtitles', async () => {
  for (const segments of [null, [null], [{ baslangic: -1, bitis: 1, metin: 'x' }], [{ baslangic: 0, bitis: 1, metin: {} }],
    [{ baslangic: 0, bitis: 2, metin: 'x' }, { baslangic: 1, bitis: 3, metin: 'y' }]]) {
    const exports = compile('../../lib/ai/geminiTranscribe.ts', name => {
      if (name === './transcription') return { validateTranscript }
      if (name === '@google/generative-ai') return { GoogleGenerativeAI: class { getGenerativeModel() { return { generateContent: async () => ({ response: { text: () => JSON.stringify({ dil: 'tr', bolumler: segments }) } }) } } } }
      throw Error(name)
    }, { process: { env: { GEMINI_API_KEY: 'test-only' } } })
    await assert.rejects((exports.geminiTranscribe as (file: File) => Promise<unknown>)(audio()))
  }
})

test('Gemini keeps a complete segment timeline and removes MIME codec parameters', async () => {
  let mime = ''
  const exports = compile('../../lib/ai/geminiTranscribe.ts', name => {
    if (name === './transcription') return { validateTranscript }
    if (name === '@google/generative-ai') return { GoogleGenerativeAI: class { getGenerativeModel() { return { generateContent: async (parts: Array<{ inlineData?: { mimeType: string } }>) => {
      mime = parts[0].inlineData!.mimeType
      return { response: { text: () => JSON.stringify({ dil: 'tr', bolumler: [{ baslangic: 0, bitis: 1, metin: 'Kade Media' }] }) } }
    } } } } }
    throw Error(name)
  }, { process: { env: { GEMINI_API_KEY: 'test-only' } } })
  const result = await (exports.geminiTranscribe as (file: File) => Promise<typeof valid>)(new File(['test'], 'audio.webm', { type: 'audio/webm;codecs=opus' }))
  assert.equal(mime, 'audio/webm')
  assert.equal(result.words[0].start, 0)
  assert.equal(result.words.at(-1)!.end, 1)
})

function translationRoute({ output = '[{"i":1,"t":"Hello"}]', denied = false, limited = false, failed = false } = {}) {
  const calls: unknown[] = []
  const exports = compile('../../app/kadexai/api/subtitles/translate/route.ts', name => {
    if (name === 'next/server') return { NextResponse: { json: Response.json } }
    if (name === '@/lib/auth/server') return { requireApiUser: async () => denied ? Response.json({}, { status: 401 }) : null }
    if (name === '@/lib/payments/featureGuard') return { requireToolFeature: async () => null }
    if (name === '@/lib/rateLimit') return { getRateLimitKey: () => 'test', rateLimit: () => ({ allowed: !limited }), rateLimitHeaders: () => ({}) }
    if (name === '@/lib/ai/models') return { SELECTABLE_MODELS: ['auto'] }
    if (name === '@/lib/subtitles/languages') return { languageByCode: (code: string) => ['tr', 'en'].includes(code) ? { code, label: code } : null }
    if (name === '@/lib/ai/json') return { extractJsonArray: JSON.parse }
    if (name === '@/lib/ai/provider') return { generateContent: async (options: unknown) => { calls.push(options); if (failed) throw Error('private-secret'); return { content: output, model: 'auto' } } }
    throw Error(name)
  })
  const post = exports.POST as (req: Request) => Promise<Response>
  return { calls, post: (body: unknown = { cues: [{ index: 1, text: 'Merhaba' }], targetLang: 'en' }) => post(new Request('http://localhost/api/subtitles/translate', { method: 'POST', body: JSON.stringify(body) })) }
}

test('subtitle translation rejects malformed bodies, duplicate indices and silent truncation', async () => {
  const api = translationRoute()
  for (const body of [null, [], {}, { cues: {} }, { cues: [null] }, { cues: [{ index: 0, text: 'x' }] },
    { cues: [{ index: 1, text: 'x' }, { index: 1, text: 'y' }] }, { cues: [{ index: 1, text: 'x'.repeat(601) }] },
    { cues: [{ index: 1, text: 'x' }], targetLang: 'en', model: 'unknown' }]) assert.equal((await api.post(body)).status, 400)
  assert.equal(api.calls.length, 0)
})

test('subtitle translation retains auth and rate limiting', async () => {
  assert.equal((await translationRoute({ denied: true }).post()).status, 401)
  assert.equal((await translationRoute({ limited: true }).post()).status, 429)
})

test('subtitle translation marks empty and absent output as skipped, preserves successful text', async () => {
  const res = await translationRoute({ output: '[{"i":1,"t":" "},{"i":2,"t":"World"}]' }).post({ cues: [{ index: 1, text: 'Merhaba' }, { index: 2, text: 'Dünya' }, { index: 3, text: 'Son' }], targetLang: 'en' })
  assert.equal(res.status, 200)
  const result = await res.json()
  assert.equal(result.atlanan, 2)
  assert.equal(result.ceviriler[0].atlandi, true)
  assert.equal(result.ceviriler[1].text, 'World')
})

test('subtitle translation rejects duplicate and unrelated results without exposing provider errors', async () => {
  for (const output of ['[{"i":1,"t":"A"},{"i":1,"t":"B"}]', '[{"i":99,"t":"A"}]', '{}', '[{"i":1,"t":false}]']) assert.equal((await translationRoute({ output }).post()).status, 502)
  const res = await translationRoute({ failed: true }).post()
  assert.equal(res.status, 502)
  assert.doesNotMatch(await res.text(), /private-secret/)
})

function audioExtraction(mode: 'complete' | 'timeout' | 'play-error') {
  let timeout: () => void = () => {}
  let stopped = 0
  let revoked = 0
  let fallback = 0
  const track = { stop: () => { stopped++ } }
  class Stream { getAudioTracks() { return [track] }; getTracks() { return [track] } }
  class Video {
    ended = false
    muted = false
    playbackRate = 1
    onloadedmetadata = () => {}
    onended = () => {}
    src = ''
    captureStream() { return new Stream() }
    pause() {}
    load() {}
    removeAttribute() {}
    play() {
      if (mode === 'play-error') return Promise.reject(Error('blocked'))
      queueMicrotask(() => { if (mode === 'timeout') timeout(); else { this.ended = true; this.onended() } })
      return Promise.resolve()
    }
  }
  const video = new Video()
  const exports = compile('../../lib/media/extractAudio.ts', () => { throw Error('Unexpected import') }, {
    Blob, HTMLVideoElement: Video, MediaStream: Stream,
    setTimeout: (callback: () => void) => { timeout = callback; return 1 }, clearTimeout: () => {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => { revoked++ } },
    document: { createElement: () => { queueMicrotask(() => video.onloadedmetadata()); return video } },
    MediaRecorder: class {
      static isTypeSupported() { return true }
      state = 'inactive'
      ondataavailable = (_event: { data: Blob }) => {}
      onstop = () => {}
      start() { this.state = 'recording'; this.ondataavailable({ data: new Blob(['audio']) }) }
      stop() { this.state = 'inactive'; this.onstop() }
    },
    AudioContext: class { async decodeAudioData() { fallback++; throw Error('unsupported') }; async close() {} },
  })
  return { extract: exports.extractAudio as (file: File) => Promise<File>, video, counts: () => ({ stopped, revoked, fallback }) }
}

test('supported audio bypasses recording with bytes and normalized MIME preserved', async () => {
  const api = audioExtraction('complete')
  const result = await api.extract(new File(['original'], 'voice.webm', { type: 'audio/webm;codecs=opus' }))
  assert.equal(await result.text(), 'original')
  assert.equal(result.type, 'audio/webm')
  assert.equal(api.counts().revoked, 0)
})

test('video recording uses original speed, returns only a completed file and releases media', async () => {
  const api = audioExtraction('complete')
  const result = await api.extract(new File(['video'], 'clip.mp4', { type: 'video/mp4' }))
  assert.equal(api.video.playbackRate, 1)
  assert.equal(result.type, 'audio/webm')
  assert.equal(await result.text(), 'audio')
  assert.deepEqual(api.counts(), { stopped: 1, revoked: 1, fallback: 0 })
})

test('timeout and playback rejection never return a partial recording', async () => {
  for (const mode of ['timeout', 'play-error'] as const) {
    const api = audioExtraction(mode)
    await assert.rejects(api.extract(new File(['video'], 'clip.mp4', { type: 'video/mp4' })))
    assert.deepEqual(api.counts(), { stopped: 1, revoked: 1, fallback: 1 })
  }
})
